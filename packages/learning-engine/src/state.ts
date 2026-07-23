/**
 * Skill-state machine + advancement (LRN-001). Derives the mastery-based state
 * from scores and review evidence (doc 04 §§2, 14). Time-based overlays
 * (review_due / decayed) are computed at read time by effectiveState.
 */
import type { SkillState, SkillProgress, MasteryScores } from '@learn/domain';
import { meetsImmediateThresholds } from './scoring.js';

/**
 * The mastery-based state, ignoring the clock. `attempts` and
 * `delayed_review_confirmed` come from the projected progress.
 */
export function deriveState(
  scores: MasteryScores,
  thresholds: MasteryScores,
  attempts: number,
  delayedReviewConfirmed: boolean,
): SkillState {
  if (attempts === 0) return 'unknown';
  if (meetsImmediateThresholds(scores, thresholds)) {
    const fullyMastered = delayedReviewConfirmed && scores.retention >= thresholds.retention;
    return fullyMastered ? 'mastered' : 'provisionally_mastered';
  }
  if (scores.accuracy >= 40) return 'practicing';
  return 'learning';
}

/**
 * The state a learner effectively sees now, layering review-due and decay on top
 * of the mastery-based state (doc 04 §2). `now` is passed in — never read here.
 */
export function effectiveState(progress: SkillProgress, now: string): SkillState {
  const due = progress.next_review_at !== null && now >= progress.next_review_at;
  if (!due) return progress.state;
  if (progress.state === 'mastered' || progress.state === 'provisionally_mastered') {
    // Overdue mastered skill with weak retention has decayed; otherwise it is due.
    return progress.scores.retention < 50 ? 'decayed' : 'review_due';
  }
  return progress.state;
}

export function isReviewDue(progress: SkillProgress, now: string): boolean {
  return progress.next_review_at !== null && now >= progress.next_review_at;
}
