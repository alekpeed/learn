/**
 * Projects per-skill progress from the event log (DEC-006) and exposes it to the
 * UI. Refreshes after practice/review so mastery, locks, and review dates stay
 * current. Progress is always derived, never stored independently.
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
import type { LearningEvent, SkillProgress, MasteryScores } from '@learn/domain';
import { DEFAULT_MASTERY_THRESHOLDS } from '@learn/domain';
import {
  projectProgress,
  projectMisconceptions,
  projectExposure,
  type ThresholdLookup,
  type MisconceptionOccurrence,
  type ExposureMap,
} from '@learn/learning-engine';
import { useLearner } from './LearnerContext.js';
import { useCurriculum } from './CurriculumContext.js';
import { eventStore } from '../data/repository.js';

interface ProgressContextValue {
  progress: Map<string, SkillProgress>;
  /**
   * Misconceptions this learner has shown, projected from the same event log in
   * the same pass (Phase 17). Kept here so the log is read once, and so the UI
   * never has to derive remediation state of its own.
   */
  misconceptions: MisconceptionOccurrence[];
  /**
   * How often each question has been answered, and when (Phase: rotation).
   * Projected in the same pass as progress so the log is still read once.
   */
  exposure: ExposureMap;
  /**
   * Which learner the current projection actually reflects, or null when there
   * is no profile. `loading` alone is not enough to know the projection is
   * ready: this provider settles once with no learner before the profile
   * arrives, so a consumer can observe loading=false against an empty
   * projection. Comparing this to the active learner id closes that window.
   */
  projectedFor: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({
  children,
  loadEvents,
  progressOverride,
}: {
  children: ReactNode;
  /** Test seam: supply events directly instead of reading the store. */
  loadEvents?: (learnerId: string) => Promise<LearningEvent[]>;
  /** Test seam: supply a ready-made progress map, bypassing loading. */
  progressOverride?: Map<string, SkillProgress>;
}): JSX.Element {
  const { learner } = useLearner();
  const { package: pkg } = useCurriculum();
  const [progress, setProgress] = useState<Map<string, SkillProgress>>(
    progressOverride ?? new Map(),
  );
  const [misconceptions, setMisconceptions] = useState<MisconceptionOccurrence[]>([]);
  const [exposure, setExposure] = useState<ExposureMap>(() => new Map());
  const [projectedFor, setProjectedFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(progressOverride ? false : true);

  const thresholds = useMemo<ThresholdLookup>(() => {
    return (skillId: string): MasteryScores =>
      pkg?.graph.skills.get(skillId)?.mastery_thresholds ?? DEFAULT_MASTERY_THRESHOLDS;
  }, [pkg]);

  const load = useCallback(
    (learnerId: string) =>
      loadEvents ? loadEvents(learnerId) : eventStore.getByLearner(learnerId),
    [loadEvents],
  );

  const refresh = useCallback(async () => {
    if (!learner) {
      setProgress(new Map());
      setMisconceptions([]);
      setExposure(new Map());
      setProjectedFor(null);
      setLoading(false);
      return;
    }
    const events = await load(learner.learner_id);
    setProgress(projectProgress(events, thresholds));
    setMisconceptions(projectMisconceptions(events));
    setExposure(projectExposure(events));
    setProjectedFor(learner.learner_id);
    setLoading(false);
  }, [learner, load, thresholds]);

  useEffect(() => {
    if (progressOverride) return;
    let active = true;
    setLoading(true);
    refresh().catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refresh, progressOverride]);

  const value = useMemo<ProgressContextValue>(
    () => ({ progress, misconceptions, exposure, projectedFor, loading, refresh }),
    [progress, misconceptions, exposure, projectedFor, loading, refresh],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}

/**
 * Like useProgress but returns null instead of throwing. For components that
 * only use progress to enrich what they show - a question still renders and
 * still grades without it.
 */
export function useOptionalProgress(): ProgressContextValue | null {
  return useContext(ProgressContext);
}
