/**
 * The five mastery dimensions (doc 04 §3). Each score is a number in [0, 100].
 */
export const MASTERY_DIMENSIONS = [
  'understanding',
  'accuracy',
  'independence',
  'retention',
  'transfer',
] as const;

export type MasteryDimension = (typeof MASTERY_DIMENSIONS)[number];

export type MasteryScores = Record<MasteryDimension, number>;

/** Default mastery thresholds (doc 04 §3). Overridable per skill. */
export const DEFAULT_MASTERY_THRESHOLDS: MasteryScores = {
  understanding: 80,
  accuracy: 85,
  independence: 80,
  retention: 75,
  transfer: 70,
};

export function emptyMasteryScores(): MasteryScores {
  return { understanding: 0, accuracy: 0, independence: 0, retention: 0, transfer: 0 };
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
