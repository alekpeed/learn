/**
 * Learner-specific skill state machine (doc 04 §2).
 * These are the only valid states a skill may hold for a learner.
 */
export const SKILL_STATES = [
  'unknown',
  'diagnosed_weak',
  'learning',
  'practicing',
  'provisionally_mastered',
  'mastered',
  'review_due',
  'decayed',
] as const;

export type SkillState = (typeof SKILL_STATES)[number];

export function isSkillState(value: unknown): value is SkillState {
  return typeof value === 'string' && (SKILL_STATES as readonly string[]).includes(value);
}
