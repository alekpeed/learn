/**
 * Question rotation.
 *
 * Practice used to walk a skill's items in authored order from index 0 every
 * time, and review always served item 0 - so a skill on the spaced ladder
 * (0, 1, 3, 7, 14, 30, 90 days) showed the same question seven times over three
 * months. That trains recall of one answer rather than of the method, which is
 * the opposite of what the review schedule exists to measure.
 *
 * Exposure is projected from the event log like everything else (DEC-006): the
 * `answer_submitted` events already carry `question_id`, so no new state and no
 * migration is needed.
 *
 * Ordering is deterministic, so a given log always produces the same sequence
 * and the behaviour is testable. Variety comes from the exposure counts
 * changing as the learner works, not from randomness.
 */
import type { LearningEvent, AnswerSubmittedPayload } from '@learn/domain';

export interface Exposure {
  /** How many times this question has been answered. */
  count: number;
  /** ISO timestamp of the most recent answer, or null if never answered. */
  lastAt: string | null;
}

export type ExposureMap = Map<string, Exposure>;

/** Fold the log into per-question exposure. */
export function projectExposure(events: LearningEvent[]): ExposureMap {
  const map: ExposureMap = new Map();
  for (const e of events) {
    if (e.type !== 'answer_submitted') continue;
    const p = e.payload as AnswerSubmittedPayload;
    if (!p.question_id) continue;
    const current = map.get(p.question_id);
    if (!current) {
      map.set(p.question_id, { count: 1, lastAt: e.created_at });
    } else {
      current.count += 1;
      if (!current.lastAt || e.created_at > current.lastAt) current.lastAt = e.created_at;
    }
  }
  return map;
}

/**
 * A stable pseudo-random key in [0,1) for a question in a given round.
 *
 * This is what breaks ties between equally-unseen questions. It has to be
 * deterministic - the same log must always give the same order, or nothing
 * about selection could be tested - but it must also differ between rounds, so
 * a learner returning to a fully-seen skill does not get the authored order
 * back. Mixing the question id with the round number achieves both.
 */
function tieBreak(questionId: string, round: number): number {
  let h = 2166136261 ^ round;
  for (let i = 0; i < questionId.length; i += 1) {
    h ^= questionId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export interface RotatableQuestion {
  question_id: string;
  difficulty: number;
}

/**
 * Order a skill's questions for practice: never-answered first, then
 * least-recently-answered, with ties broken stably but not in authored order.
 *
 * Difficulty is preserved as the primary sort within the unseen group, so a
 * learner still meets easier items before harder ones rather than being thrown
 * a difficulty-5 transfer problem first.
 */
export function rotateForPractice<T extends RotatableQuestion>(
  questions: readonly T[],
  exposure: ExposureMap,
): T[] {
  const round = questions.reduce((n, q) => n + (exposure.get(q.question_id)?.count ?? 0), 0);

  return [...questions].sort((a, b) => {
    const ea = exposure.get(a.question_id);
    const eb = exposure.get(b.question_id);
    const seenA = ea?.count ?? 0;
    const seenB = eb?.count ?? 0;

    // 1. Anything never answered comes before anything already answered.
    if ((seenA === 0) !== (seenB === 0)) return seenA === 0 ? -1 : 1;

    if (seenA === 0) {
      // 2. Among unseen items, easiest first so the ramp is preserved.
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
    } else {
      // 3. Among seen items, fewest exposures first, then longest ago.
      if (seenA !== seenB) return seenA - seenB;
      const la = ea?.lastAt ?? '';
      const lb = eb?.lastAt ?? '';
      if (la !== lb) return la < lb ? -1 : 1;
    }

    // 4. Stable, non-authored tie-break that varies between rounds.
    return tieBreak(a.question_id, round) - tieBreak(b.question_id, round);
  });
}

/**
 * Pick the single question a due review should ask.
 *
 * Least-exposed first, then longest-ago, never repeating the question answered
 * most recently. That walks the whole pool before any item comes round again,
 * so a skill on the full ladder meets a different question at each step and
 * still re-meets earlier ones later, after a long gap - which is exactly the
 * retention evidence the schedule is looking for.
 *
 * An earlier draft preferred questions the learner had already seen, on the
 * theory that recall of a familiar item is the better probe. That was wrong in
 * a way worth recording: with one item seen, the "seen" pool is that one item,
 * so review served it forever - the same defect this function exists to fix,
 * reintroduced one level down. Breadth first avoids the trap entirely, and a
 * review of an unseen item still tests the skill, which is what is being
 * measured.
 */
export function selectForReview<T extends RotatableQuestion>(
  questions: readonly T[],
  exposure: ExposureMap,
): T | undefined {
  if (questions.length === 0) return undefined;

  // Whatever was answered most recently is the one thing never to serve again
  // immediately, provided there is anything else to serve.
  let mostRecentId: string | null = null;
  let mostRecentAt = '';
  for (const q of questions) {
    const at = exposure.get(q.question_id)?.lastAt;
    if (at && at > mostRecentAt) {
      mostRecentAt = at;
      mostRecentId = q.question_id;
    }
  }
  const candidates = questions.filter((q) => q.question_id !== mostRecentId);
  const pool = candidates.length > 0 ? candidates : questions;
  const round = questions.reduce((n, q) => n + (exposure.get(q.question_id)?.count ?? 0), 0);

  return [...pool].sort((a, b) => {
    const ea = exposure.get(a.question_id);
    const eb = exposure.get(b.question_id);
    const seenA = ea?.count ?? 0;
    const seenB = eb?.count ?? 0;
    if (seenA !== seenB) return seenA - seenB;
    const la = ea?.lastAt ?? '';
    const lb = eb?.lastAt ?? '';
    if (la !== lb) return la < lb ? -1 : 1;
    return tieBreak(a.question_id, round) - tieBreak(b.question_id, round);
  })[0];
}
