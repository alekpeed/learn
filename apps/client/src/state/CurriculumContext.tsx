/**
 * Provides the loaded curriculum package to the app. Loading + validation is
 * synchronous over bundled content; validation failures surface as an error
 * state rather than a crash (doc 14 §1 fail explicitly).
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { CoursePackage, LoadResult } from '@learn/curriculum';
import { loadSampleCurriculum } from '../data/curriculum.js';

interface CurriculumContextValue {
  package: CoursePackage | null;
  errors: string[];
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function CurriculumProvider({
  children,
  result,
}: {
  children: ReactNode;
  result?: LoadResult;
}): JSX.Element {
  const value = useMemo<CurriculumContextValue>(() => {
    const loaded = result ?? loadSampleCurriculum();
    return loaded.ok
      ? { package: loaded.package, errors: [] }
      : { package: null, errors: loaded.errors };
  }, [result]);

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
}

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error('useCurriculum must be used within a CurriculumProvider');
  return ctx;
}
