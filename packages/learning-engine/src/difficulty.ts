/**
 * Adaptive difficulty selection (LRN-005, doc 04 §6). Chooses the next question
 * difficulty (1-5) from recent attempt outcomes. Difficulty rises with clean
 * success and falls after errors or heavy hint use.
 */
export interface RecentAttempt {
  correct: boolean;
  hints_used: number;
  difficulty: number;
}

const MIN = 1;
const MAX = 5;
const START = 2;

export function selectDifficulty(recent: RecentAttempt[], windowSize = 3): number {
  if (recent.length === 0) return START;
  const window = recent.slice(-windowSize);
  const base = window[window.length - 1]?.difficulty ?? START;

  const allCleanCorrect = window.every((a) => a.correct && a.hints_used === 0);
  const anyError = window.some((a) => !a.correct);
  const heavyHints = window.some((a) => a.hints_used >= 2);

  let next = base;
  if (allCleanCorrect && window.length >= Math.min(windowSize, 2)) next = base + 1;
  else if (anyError || heavyHints) next = base - 1;

  return Math.max(MIN, Math.min(MAX, next));
}
