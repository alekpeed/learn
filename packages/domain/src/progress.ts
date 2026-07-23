/**
 * Per-skill learner progress (doc 09 SkillProgress). This is a projection of the
 * event log (DEC-006), not an independent source of truth.
 */
import type { SkillState } from './skill-state.js';
import type { MasteryScores } from './mastery.js';
import { emptyMasteryScores } from './mastery.js';

export interface SkillProgress {
  skill_id: string;
  state: SkillState;
  scores: MasteryScores;
  /** Position in the review interval ladder; -1 until first scheduled. */
  review_index: number;
  /** ISO timestamp of the next scheduled review, or null. */
  next_review_at: string | null;
  last_interval_days: number;
  last_practiced_at: string | null;
  /** True once a delayed review (interval >= 7 days) has confirmed retention. */
  delayed_review_confirmed: boolean;
  attempt_count: number;
}

export function emptySkillProgress(skillId: string): SkillProgress {
  return {
    skill_id: skillId,
    state: 'unknown',
    scores: emptyMasteryScores(),
    review_index: -1,
    next_review_at: null,
    last_interval_days: 0,
    last_practiced_at: null,
    delayed_review_confirmed: false,
    attempt_count: 0,
  };
}
