/**
 * Provides the loaded curriculum package to the app. Loading + validation is
 * synchronous over bundled content; validation failures surface as an error
 * state rather than a crash (doc 14 §1 fail explicitly).
 *
 * Phase 18 adds installed course modules. The bundled curriculum stays the
 * synchronous initial value so the first paint is always correct, and an active
 * module is swapped in afterwards. A module that fails to load leaves the app on
 * the bundled curriculum with a warning rather than taking every screen down -
 * content a learner installed must never be able to brick the app.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { parseCourseModule, type CoursePackage, type LoadResult } from '@learn/curriculum';
import type { ModuleStore } from '@learn/persistence';
import { loadSampleCurriculum } from '../data/curriculum.js';
import { moduleStore as defaultModuleStore } from '../data/repository.js';

interface CurriculumContextValue {
  package: CoursePackage | null;
  errors: string[];
  /** Name of the installed module in use, or null when using bundled content. */
  activeModuleName: string | null;
  /** Re-read the active module (after installing, activating, or removing one). */
  reloadModules: () => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function CurriculumProvider({
  children,
  result,
  modules = defaultModuleStore,
}: {
  children: ReactNode;
  /** Test seam: supply a load result directly, bypassing bundled content. */
  result?: LoadResult;
  /** Test seam: supply a module store. */
  modules?: ModuleStore;
}): JSX.Element {
  const bundled = useMemo<LoadResult>(() => result ?? loadSampleCurriculum(), [result]);
  const [active, setActive] = useState<{ package: CoursePackage; name: string } | null>(null);
  const [moduleErrors, setModuleErrors] = useState<string[]>([]);

  const reloadModules = useCallback(async () => {
    const activeId = await modules.getActiveId();
    const installed = activeId
      ? (await modules.list()).find((m) => m.module_id === activeId)
      : undefined;
    if (!installed) {
      setActive(null);
      setModuleErrors([]);
      return;
    }
    const parsed = parseCourseModule(installed.json);
    if (parsed.ok) {
      setActive({ package: parsed.package, name: installed.name });
      setModuleErrors([]);
    } else {
      // Stay on the bundled curriculum; say why rather than failing silently.
      setActive(null);
      setModuleErrors([
        `The installed course "${installed.name}" could not be loaded, so the built-in course is being used.`,
        ...parsed.errors,
      ]);
    }
  }, [modules]);

  useEffect(() => {
    let cancelled = false;
    reloadModules().catch(() => {
      // No module store, or it failed to open: bundled content still works.
      if (!cancelled) setActive(null);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadModules]);

  const value = useMemo<CurriculumContextValue>(() => {
    if (active) {
      return {
        package: active.package,
        errors: moduleErrors,
        activeModuleName: active.name,
        reloadModules,
      };
    }
    return bundled.ok
      ? { package: bundled.package, errors: moduleErrors, activeModuleName: null, reloadModules }
      : {
          package: null,
          errors: [...bundled.errors, ...moduleErrors],
          activeModuleName: null,
          reloadModules,
        };
  }, [active, bundled, moduleErrors, reloadModules]);

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
}

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error('useCurriculum must be used within a CurriculumProvider');
  return ctx;
}

/**
 * Like useCurriculum but returns null instead of throwing. For components that
 * only read content to enrich what they show, and must not take the screen down
 * when they are rendered outside a provider.
 */
export function useOptionalCurriculum(): CurriculumContextValue | null {
  return useContext(CurriculumContext);
}
