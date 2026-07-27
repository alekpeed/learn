/**
 * Today's-session assembly (Version 1 study plans, doc 04 §13). Picks what to do
 * next: reviews that are due, plus the next skill the learner can start.
 */
import type { SkillProgress } from '@learn/domain';
import type { SkillGraph } from '@learn/curriculum';
import { isReviewDue } from './state.js';
import { unlockStatus } from './gating.js';
import type { MisconceptionOccurrence } from './misconceptions.js';

export interface TodaysSession {
  /** Skills whose review is due now (in learning order). */
  dueSkills: string[];
  /** The next unlocked, not-yet-mastered skill to work on, if any. */
  nextSkill: string | null;
  /**
   * Skills carrying an active misconception (Phase 17). Empty unless the caller
   * passes the projection in - a caller that does not care about remediation
   * gets exactly the behaviour it had before.
   */
  remediationSkills: string[];
}

const IN_PROGRESS = new Set(['unknown', 'diagnosed_weak', 'learning', 'practicing']);

export function selectTodaysSession(
  progress: Map<string, SkillProgress>,
  graph: SkillGraph,
  order: string[],
  nowIso: string,
  /** Misconception projection; omit to keep the pre-Phase-17 behaviour. */
  misconceptions: MisconceptionOccurrence[] = [],
  /**
   * Skills belonging to the subject chosen at Goal Selection (doc 07). When
   * given, the next skill is taken from inside it if anything there is still
   * available, and from the whole curriculum otherwise - so choosing a subject
   * steers what comes next without ever dead-ending the learner.
   *
   * Due reviews are deliberately NOT filtered: retention decays on its own
   * schedule, and hiding a due review because it sits in another subject is how
   * a learner silently loses a skill they had already earned.
   */
  focusSkills?: ReadonlySet<string>,
): TodaysSession {
  const dueSkills = order.filter((id) => {
    const p = progress.get(id);
    return p ? isReviewDue(p, nowIso) : false;
  });

  const remediation = new Set(
    misconceptions
      .filter((m) => m.active)
      .map((m) => m.skill_id)
      .filter((id) => graph.skills.has(id)),
  );
  const remediationSkills = order.filter((id) => remediation.has(id));

  // A skill the learner keeps getting wrong the same way is a better use of the
  // next session than moving on, so it wins over the frontier - but never over a
  // review that is already due, which is time-sensitive.
  const pick = (ids: readonly string[]): string | null =>
    ids.find((id) => remediation.has(id) && unlockStatus(id, graph, progress).unlocked) ??
    ids.find((id) => {
      const state = progress.get(id)?.state ?? 'unknown';
      return IN_PROGRESS.has(state) && unlockStatus(id, graph, progress).unlocked;
    }) ??
    null;

  const nextSkill =
    (focusSkills ? pick(order.filter((id) => focusSkills.has(id))) : null) ?? pick(order);

  return { dueSkills, nextSkill, remediationSkills };
}
