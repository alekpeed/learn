import { describe, it, expect } from 'vitest';
import type { MasteryScores } from '@learn/domain';
import { emptySkillProgress } from '@learn/domain';
import {
  selectMasteryCheckItems,
  gradeMasteryCheck,
  MASTERY_CHECK_SIZE,
  type CheckAnswer,
} from '../src/index.js';

const THRESHOLDS: MasteryScores = {
  understanding: 80,
  accuracy: 85,
  independence: 80,
  retention: 75,
  transfer: 70,
};

function pool() {
  return [
    { question_id: 'a1', type: 'numeric', difficulty: 1 },
    { question_id: 'a2', type: 'numeric', difficulty: 3 },
    { question_id: 'a3', type: 'numeric', difficulty: 5 },
    { question_id: 'b1', type: 'multiple_choice', difficulty: 2 },
    { question_id: 'b2', type: 'multiple_choice', difficulty: 4 },
    { question_id: 'c1', type: 'fraction', difficulty: 2 },
    { question_id: 'd1', type: 'multi_select', difficulty: 3 },
  ];
}

const ids = (list: { question_id: string }[]): string[] => list.map((q) => q.question_id);

describe('mastery check item selection', () => {
  it('mixes item forms rather than taking all of one type', () => {
    const picked = selectMasteryCheckItems(pool(), new Map());
    const types = new Set(picked.map((q) => q.type));
    // Four types exist; a check of six must not come from just one or two.
    expect(types.size).toBeGreaterThanOrEqual(3);
  });

  it('represents every available form before repeating one', () => {
    const picked = selectMasteryCheckItems(pool(), new Map(), 4);
    expect(new Set(picked.map((q) => q.type)).size).toBe(4);
  });

  it('asks the requested number of items', () => {
    expect(selectMasteryCheckItems(pool(), new Map())).toHaveLength(MASTERY_CHECK_SIZE);
    expect(selectMasteryCheckItems(pool(), new Map(), 3)).toHaveLength(3);
  });

  it('never repeats an item within one check', () => {
    const picked = ids(selectMasteryCheckItems(pool(), new Map()));
    expect(new Set(picked).size).toBe(picked.length);
  });

  it('presents easiest first so a check does not open on its hardest item', () => {
    const picked = selectMasteryCheckItems(pool(), new Map());
    const d = picked.map((q) => q.difficulty);
    expect(d).toEqual([...d].sort((x, y) => x - y));
  });

  it('prefers items the learner has met least, so a retake is not a rerun', () => {
    const exposure = new Map([
      ['a1', { count: 3, lastAt: '2026-07-20T10:00:00.000Z' }],
      ['a2', { count: 0, lastAt: null }],
    ]);
    const picked = ids(selectMasteryCheckItems(pool(), exposure, 4));
    // a2 is unseen and a1 has been met three times, so within the numeric type
    // a2 is taken first.
    expect(picked.indexOf('a2')).toBeGreaterThanOrEqual(0);
    if (picked.includes('a1')) {
      expect(picked.indexOf('a2')).toBeLessThan(picked.indexOf('a1'));
    }
  });

  it('copes with a pool smaller than the check', () => {
    const small = [{ question_id: 'x', type: 'numeric', difficulty: 2 }];
    expect(selectMasteryCheckItems(small, new Map())).toHaveLength(1);
    expect(selectMasteryCheckItems([], new Map())).toEqual([]);
  });
});

describe('mastery check verdict', () => {
  const answer = (id: string, correct: boolean, misconception?: string): CheckAnswer => ({
    question_id: id,
    skill_id: 's1',
    correct,
    ...(misconception ? { misconception_id: misconception } : {}),
  });

  function progressAt(scores: Partial<MasteryScores>) {
    const p = emptySkillProgress('s1');
    p.scores = { ...THRESHOLDS, ...scores };
    return p;
  }

  it('passes only when every item is right AND the projection clears thresholds', () => {
    const all = [answer('a', true), answer('b', true)];
    const result = gradeMasteryCheck(all, progressAt({}), THRESHOLDS);
    expect(result.outcome).toBe('passed');
    expect(result.correct).toBe(2);
  });

  it('does not pass a perfect run when the skill is still below threshold', () => {
    // A lucky six is not mastery; the projection has to agree.
    const all = [answer('a', true), answer('b', true)];
    const result = gradeMasteryCheck(all, progressAt({ retention: 10 }), THRESHOLDS);
    expect(result.outcome).toBe('not_yet');
    expect(result.shortfalls.map((s) => s.dimension)).toContain('retention');
  });

  it('does not pass when thresholds are met but items were missed', () => {
    // Thresholds met long ago do not survive getting a fresh check wrong.
    const mixed = [answer('a', true), answer('b', false)];
    const result = gradeMasteryCheck(mixed, progressAt({}), THRESHOLDS);
    expect(result.outcome).toBe('not_yet');
    expect(result.missed).toEqual(['b']);
  });

  it('names the misconceptions the check surfaced, without duplicates', () => {
    const answers = [
      answer('a', false, 'mc.x'),
      answer('b', false, 'mc.x'),
      answer('c', false, 'mc.y'),
    ];
    const result = gradeMasteryCheck(answers, progressAt({}), THRESHOLDS);
    expect(result.misconceptions).toEqual(['mc.x', 'mc.y']);
    expect(result.recommendation).toMatch(/misunderstanding/i);
  });

  it('gives a specific recommendation naming what to do next', () => {
    const missed = gradeMasteryCheck(
      [answer('a', true), answer('b', false)],
      progressAt({}),
      THRESHOLDS,
    );
    expect(missed.recommendation).toMatch(/review|retake/i);

    const passed = gradeMasteryCheck([answer('a', true)], progressAt({}), THRESHOLDS);
    expect(passed.recommendation).toMatch(/ready/i);
  });

  it('explains a perfect run that still falls short on a dimension', () => {
    const result = gradeMasteryCheck([answer('a', true)], progressAt({ transfer: 5 }), THRESHOLDS);
    expect(result.outcome).toBe('not_yet');
    expect(result.recommendation).toMatch(/transfer/);
  });

  it('treats missing progress as not yet mastered rather than throwing', () => {
    const result = gradeMasteryCheck([answer('a', true)], undefined, THRESHOLDS);
    expect(result.outcome).toBe('not_yet');
  });

  it('handles a check with no answers', () => {
    const result = gradeMasteryCheck([], progressAt({}), THRESHOLDS);
    expect(result.outcome).toBe('not_yet');
    expect(result.total).toBe(0);
  });
});
