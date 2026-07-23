/**
 * Learning-engine constants. All tunables live here so scoring/scheduling stay
 * testable and match docs/spec-derived/MASTERY_SCORING.md and REVIEW_SCHEDULING.md.
 */
export const SCORING = {
  /** EMA learning rate. */
  alpha: 0.25,
  ceiling: (difficulty: number): number => 40 + 12 * difficulty,
  penalty: (difficulty: number): number => 30 - 4 * difficulty,
  intervalBonus: (intervalDays: number): number => Math.min(1.3, 1 + 0.05 * intervalDays),
  retentionFailPenalty: (overdueDays: number): number => 25 + 0.3 * overdueDays,
} as const;

/** Review interval ladder in days (doc 04 §10). Index 0 = same day. */
export const LADDER_DAYS = [0, 1, 3, 7, 14, 30, 90] as const;
export const PROMOTE_STEP = 1;
export const DEMOTE_STEP = 2;
/** Quality gate for a review to count as a success (REVIEW_SCHEDULING §3). */
export const REVIEW_SUCCESS_GATE = 0.6;
/** Recall interval (days) at which a successful delayed review confirms retention. */
export const DELAYED_CONFIRM_DAYS = 7;
