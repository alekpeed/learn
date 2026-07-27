/**
 * Mastery check (doc 07 "Mastery Check", doc 04 step 9 of 10).
 *
 * The spec asks for five things: no ordinary hints, a clear start and finish,
 * mixed item forms, an immediate result, and a specific recommendation. This
 * module owns the two deterministic parts - choosing the items and deciding the
 * verdict. The screen owns the rest.
 *
 * A check deliberately records the same `answer_submitted` events as ordinary
 * practice, so the existing scorer promotes the skill on its own merits. There
 * is no separate "mastery check score" and no special path into progress: the
 * verdict is read back out of the normal projection afterwards (DEC-006). What
 * makes a check different is the conditions it is taken under - hints
 * unavailable and feedback withheld - which the scorer already rewards, because
 * an unaided first-attempt answer scores higher than a hinted one.
 */
import type { MasteryScores, SkillProgress } from '@learn/domain';
import { MASTERY_DIMENSIONS } from '@learn/domain';
import type { ExposureMap } from './rotation.js';

export interface CheckableQuestion {
  question_id: string;
  type: string;
  difficulty: number;
}

/** How many items a check asks. Long enough to be evidence, short enough to sit. */
export const MASTERY_CHECK_SIZE = 6;

/**
 * Choose a mixed set of items: spread across question types first, then across
 * difficulty, preferring items the learner has met least often so a check is
 * not a rerun of the last one.
 *
 * "Mixed item forms" is the spec's wording, so type variety is the primary axis:
 * a check made entirely of multiple-choice items would be weak evidence however
 * well its difficulty was spread.
 */
export function selectMasteryCheckItems<T extends CheckableQuestion>(
  questions: readonly T[],
  exposure: ExposureMap,
  size: number = MASTERY_CHECK_SIZE,
): T[] {
  if (questions.length === 0) return [];

  const seen = (q: T): number => exposure.get(q.question_id)?.count ?? 0;
  // Within a type, least-seen first, then easiest, then by id so ties are stable.
  const byPreference = (a: T, b: T): number =>
    seen(a) - seen(b) || a.difficulty - b.difficulty || a.question_id.localeCompare(b.question_id);

  const byType = new Map<string, T[]>();
  for (const q of questions) {
    const list = byType.get(q.type) ?? [];
    list.push(q);
    byType.set(q.type, list);
  }
  for (const list of byType.values()) list.sort(byPreference);

  // Round-robin across the types, so every form present is represented before
  // any form is used twice.
  const types = [...byType.keys()].sort();
  const picked: T[] = [];
  let round = 0;
  while (picked.length < Math.min(size, questions.length)) {
    let addedThisRound = false;
    for (const t of types) {
      if (picked.length >= size) break;
      const item = byType.get(t)?.[round];
      if (item) {
        picked.push(item);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round += 1;
  }

  // Present easiest first: a check should not open with its hardest item.
  return picked.sort(
    (a, b) => a.difficulty - b.difficulty || a.question_id.localeCompare(b.question_id),
  );
}

export interface CheckAnswer {
  question_id: string;
  correct: boolean;
  /** Misconception the diagnoser named, when it named one. */
  misconception_id?: string;
  skill_id: string;
}

export type CheckOutcome = 'passed' | 'not_yet';

export interface MasteryCheckResult {
  outcome: CheckOutcome;
  correct: number;
  total: number;
  /** Dimensions still below their threshold after the check, worst first. */
  shortfalls: { dimension: string; score: number; threshold: number }[];
  /** Misconceptions the check surfaced, in the order they appeared. */
  misconceptions: string[];
  /** Question ids answered wrongly, for "look again at these". */
  missed: string[];
  /** One sentence naming the next action. */
  recommendation: string;
}

/**
 * Decide the verdict from the answers plus the progress projection as it stands
 * *after* those answers have been recorded.
 *
 * Passing needs both things the learner is being asked to demonstrate: getting
 * the items right here, and the skill actually clearing its thresholds in the
 * projection. Either alone is misleading - a lucky run on six items is not
 * mastery, and thresholds met long ago do not survive getting half of a fresh
 * check wrong.
 */
export function gradeMasteryCheck(
  answers: readonly CheckAnswer[],
  progress: SkillProgress | undefined,
  thresholds: MasteryScores,
): MasteryCheckResult {
  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const missed = answers.filter((a) => !a.correct).map((a) => a.question_id);

  const misconceptions: string[] = [];
  for (const a of answers) {
    if (a.misconception_id && !misconceptions.includes(a.misconception_id)) {
      misconceptions.push(a.misconception_id);
    }
  }

  const scores = progress?.scores;
  const shortfalls = scores
    ? MASTERY_DIMENSIONS.map((d) => ({
        dimension: d,
        score: scores[d],
        threshold: thresholds[d],
      }))
        .filter((s) => s.score < s.threshold)
        .sort((a, b) => a.score - b.threshold - (b.score - a.threshold))
    : [];

  // Every item right, and the projection agrees the skill is there. No
  // projection at all means no evidence, which cannot pass - an absent
  // SkillProgress produces no shortfalls, so testing shortfalls alone would
  // read "nothing is wrong" as "everything is fine".
  const allCorrect = total > 0 && correct === total;
  const outcome: CheckOutcome =
    progress !== undefined && allCorrect && shortfalls.length === 0 ? 'passed' : 'not_yet';

  let recommendation: string;
  if (outcome === 'passed') {
    recommendation =
      'This skill is ready. It will come back for review later to confirm you have kept it.';
  } else if (misconceptions.length > 0) {
    recommendation =
      'Work through the explanation for the misunderstanding below, then take the check again.';
  } else if (missed.length > 0) {
    recommendation = `Review the ${missed.length === 1 ? 'question' : String(missed.length) + ' questions'} you missed, practise the skill again, then retake the check.`;
  } else if (shortfalls.length > 0) {
    const worst = shortfalls[0]!;
    recommendation = `Every answer was right, but ${worst.dimension} is still below the level this skill needs. More practice will raise it.`;
  } else {
    recommendation = 'Practise this skill a little more, then take the check again.';
  }

  return { outcome, correct, total, shortfalls, misconceptions, missed, recommendation };
}
