import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@learn/domain';
import { projectExposure, rotateForPractice, selectForReview } from '../src/index.js';

let seq = 0;

function answered(questionId: string, at: string): LearningEvent {
  seq += 1;
  return {
    event_id: `e${seq}`,
    type: 'answer_submitted',
    learner_id: 'L1',
    created_at: at,
    seq,
    payload: {
      question_id: questionId,
      skill_id: 's1',
      submitted_answer: 'x',
      normalized_answer: 'x',
      correct: true,
      attempt_number: 1,
      hints_used: 0,
    },
  };
}

const QUESTIONS = [
  { question_id: 'q1', difficulty: 2 },
  { question_id: 'q2', difficulty: 2 },
  { question_id: 'q3', difficulty: 3 },
  { question_id: 'q4', difficulty: 4 },
  { question_id: 'q5', difficulty: 5 },
];

const ids = (list: { question_id: string }[]): string[] => list.map((q) => q.question_id);

describe('question rotation', () => {
  it('projects exposure counts and the latest answer time', () => {
    const exposure = projectExposure([
      answered('q1', '2026-07-20T10:00:00.000Z'),
      answered('q1', '2026-07-22T10:00:00.000Z'),
      answered('q2', '2026-07-21T10:00:00.000Z'),
    ]);
    expect(exposure.get('q1')).toEqual({ count: 2, lastAt: '2026-07-22T10:00:00.000Z' });
    expect(exposure.get('q2')?.count).toBe(1);
    expect(exposure.get('q3')).toBeUndefined();
  });

  it('takes the latest timestamp even when events arrive out of order', () => {
    const exposure = projectExposure([
      answered('q1', '2026-07-22T10:00:00.000Z'),
      answered('q1', '2026-07-20T10:00:00.000Z'),
    ]);
    expect(exposure.get('q1')?.lastAt).toBe('2026-07-22T10:00:00.000Z');
  });

  describe('practice ordering', () => {
    it('puts every unseen question before any seen one', () => {
      const exposure = projectExposure([
        answered('q1', '2026-07-20T10:00:00.000Z'),
        answered('q2', '2026-07-20T10:00:00.000Z'),
      ]);
      const order = ids(rotateForPractice(QUESTIONS, exposure));
      const lastUnseen = Math.max(order.indexOf('q3'), order.indexOf('q4'), order.indexOf('q5'));
      const firstSeen = Math.min(order.indexOf('q1'), order.indexOf('q2'));
      expect(lastUnseen).toBeLessThan(firstSeen);
    });

    it('ramps unseen questions by difficulty rather than shuffling them', () => {
      const order = rotateForPractice(QUESTIONS, new Map());
      const difficulties = order.map((q) => q.difficulty);
      expect(difficulties).toEqual([...difficulties].sort((a, b) => a - b));
    });

    it('once everything is seen, orders by fewest exposures then longest ago', () => {
      const exposure = projectExposure([
        answered('q1', '2026-07-22T10:00:00.000Z'),
        answered('q1', '2026-07-23T10:00:00.000Z'),
        answered('q2', '2026-07-20T10:00:00.000Z'),
        answered('q3', '2026-07-21T10:00:00.000Z'),
        answered('q4', '2026-07-24T10:00:00.000Z'),
        answered('q5', '2026-07-25T10:00:00.000Z'),
      ]);
      const order = ids(rotateForPractice(QUESTIONS, exposure));
      // q1 is the only one answered twice, so it goes last.
      expect(order[order.length - 1]).toBe('q1');
      // Among the once-seen, q2 was longest ago, so it comes first.
      expect(order[0]).toBe('q2');
    });

    it('does not simply return the authored order once everything is seen', () => {
      const exposure = projectExposure(
        QUESTIONS.map((q) => answered(q.question_id, '2026-07-20T10:00:00.000Z')),
      );
      // Identical counts and timestamps, so only the tie-break separates them.
      expect(ids(rotateForPractice(QUESTIONS, exposure))).not.toEqual(ids(QUESTIONS));
    });

    it('is deterministic: the same log always gives the same order', () => {
      const events = [answered('q1', '2026-07-20T10:00:00.000Z')];
      const a = ids(rotateForPractice(QUESTIONS, projectExposure(events)));
      const b = ids(rotateForPractice(QUESTIONS, projectExposure(events)));
      expect(a).toEqual(b);
    });

    it('never drops or duplicates a question', () => {
      const exposure = projectExposure([answered('q3', '2026-07-20T10:00:00.000Z')]);
      const order = ids(rotateForPractice(QUESTIONS, exposure));
      expect([...order].sort()).toEqual(ids(QUESTIONS).sort());
    });

    it('handles an empty pool', () => {
      expect(rotateForPractice([], new Map())).toEqual([]);
    });
  });

  describe('review selection', () => {
    it('does not always serve the first authored question', () => {
      // The bug this replaces: review used questionsBySkill[0] every time, so
      // a skill on the full ladder showed one question seven times.
      const exposure = projectExposure([
        answered('q1', '2026-07-25T10:00:00.000Z'),
        answered('q2', '2026-07-20T10:00:00.000Z'),
      ]);
      expect(selectForReview(QUESTIONS, exposure)?.question_id).not.toBe('q1');
    });

    it('never serves the question that was just answered', () => {
      for (const justAnswered of ids(QUESTIONS)) {
        const exposure = projectExposure([answered(justAnswered, '2026-07-25T10:00:00.000Z')]);
        expect(selectForReview(QUESTIONS, exposure)?.question_id).not.toBe(justAnswered);
      }
    });

    it('spreads across the pool before repeating, rather than favouring seen items', () => {
      // Preferring already-seen items looks right for a retention probe, but
      // with one item seen the "seen" pool is that item, so review would serve
      // it forever - the very defect this replaces. Least-exposed first avoids
      // the trap; q4 has been seen once, so the others come first.
      const exposure = projectExposure([answered('q4', '2026-07-01T10:00:00.000Z')]);
      expect(selectForReview(QUESTIONS, exposure)?.question_id).not.toBe('q4');
    });

    it('comes back to an early question once the pool has been walked', () => {
      const events: LearningEvent[] = [];
      const served: string[] = [];
      for (let i = 0; i < QUESTIONS.length + 1; i += 1) {
        const picked = selectForReview(QUESTIONS, projectExposure(events));
        served.push(picked!.question_id);
        events.push(
          answered(picked!.question_id, `2026-07-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`),
        );
      }
      // The first five are all different; the sixth revisits one of them.
      expect(new Set(served.slice(0, 5)).size).toBe(5);
      expect(served.slice(0, 5)).toContain(served[5]);
    });

    it('falls back to an unseen question when nothing has been seen', () => {
      const picked = selectForReview(QUESTIONS, new Map());
      expect(ids(QUESTIONS)).toContain(picked?.question_id);
    });

    it('rotates across consecutive reviews instead of repeating one item', () => {
      // Walk the ladder: each review answers whatever was served, which then
      // becomes the most recent and so is not served again next time.
      const events: LearningEvent[] = [];
      const served: string[] = [];
      const days = ['2026-07-01', '2026-07-02', '2026-07-04', '2026-07-08'];
      for (const day of days) {
        const picked = selectForReview(QUESTIONS, projectExposure(events));
        expect(picked).toBeDefined();
        served.push(picked!.question_id);
        events.push(answered(picked!.question_id, `${day}T10:00:00.000Z`));
      }
      expect(new Set(served).size).toBe(served.length);
    });

    it('returns undefined for an empty pool', () => {
      expect(selectForReview([], new Map())).toBeUndefined();
    });
  });
});
