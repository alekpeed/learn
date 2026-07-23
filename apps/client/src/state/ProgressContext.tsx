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
import { projectProgress, type ThresholdLookup } from '@learn/learning-engine';
import { useLearner } from './LearnerContext.js';
import { useCurriculum } from './CurriculumContext.js';
import { eventStore } from '../data/repository.js';

interface ProgressContextValue {
  progress: Map<string, SkillProgress>;
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
      setLoading(false);
      return;
    }
    const events = await load(learner.learner_id);
    setProgress(projectProgress(events, thresholds));
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
    () => ({ progress, loading, refresh }),
    [progress, loading, refresh],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider');
  return ctx;
}
