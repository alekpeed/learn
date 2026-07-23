/**
 * Today's-session assembly (Version 1 study plans, doc 04 §13). Picks what to do
 * next: reviews that are due, plus the next skill the learner can start.
 */
import type { SkillProgress } from '@learn/domain';
import type { SkillGraph } from '@learn/curriculum';
import { isReviewDue } from './state.js';
import { unlockStatus } from './gating.js';

export interface TodaysSession {
  /** Skills whose review is due now (in learning order). */
  dueSkills: string[];
  /** The next unlocked, not-yet-mastered skill to work on, if any. */
  nextSkill: string | null;
}

const IN_PROGRESS = new Set(['unknown', 'diagnosed_weak', 'learning', 'practicing']);

export function selectTodaysSession(
  progress: Map<string, SkillProgress>,
  graph: SkillGraph,
  order: string[],
  nowIso: string,
): TodaysSession {
  const dueSkills = order.filter((id) => {
    const p = progress.get(id);
    return p ? isReviewDue(p, nowIso) : false;
  });

  const nextSkill =
    order.find((id) => {
      const state = progress.get(id)?.state ?? 'unknown';
      return IN_PROGRESS.has(state) && unlockStatus(id, graph, progress).unlocked;
    }) ?? null;

  return { dueSkills, nextSkill };
}
