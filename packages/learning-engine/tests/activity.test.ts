import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@learn/domain';
import { answeredOn, currentStreak, selectTodaysSession } from '../src/index.js';
import { buildGraph, type Skill } from '@learn/curriculum';
import { emptySkillProgress, type SkillProgress, type SkillState } from '@learn/domain';

let seq = 0;
function answer(dayIso: string): LearningEvent {
  seq += 1;
  return {
    event_id: `e${seq}`,
    type: 'answer_submitted',
    learner_id: 'L1',
    created_at: dayIso,
    seq,
    payload: {},
  };
}

describe('daily activity (study plans)', () => {
  it('counts answers on a given day', () => {
    const events = [
      answer('2026-07-23T09:00:00Z'),
      answer('2026-07-23T10:00:00Z'),
      answer('2026-07-22T10:00:00Z'),
    ];
    expect(answeredOn(events, '2026-07-23T23:00:00Z')).toBe(2);
  });

  it('counts a streak of consecutive days ending today', () => {
    const events = [
      answer('2026-07-21T10:00:00Z'),
      answer('2026-07-22T10:00:00Z'),
      answer('2026-07-23T10:00:00Z'),
    ];
    expect(currentStreak(events, '2026-07-23T20:00:00Z')).toBe(3);
  });

  it('keeps the streak alive when today has no activity yet', () => {
    const events = [answer('2026-07-21T10:00:00Z'), answer('2026-07-22T10:00:00Z')];
    expect(currentStreak(events, '2026-07-23T08:00:00Z')).toBe(2);
  });

  it('breaks the streak after a skipped day', () => {
    const events = [answer('2026-07-20T10:00:00Z'), answer('2026-07-23T10:00:00Z')];
    expect(currentStreak(events, '2026-07-23T20:00:00Z')).toBe(1);
  });
});

function skill(id: string, prereqs: string[] = []): Skill {
  return {
    skill_id: id,
    unit_id: 'math.u',
    title: id,
    summary: id,
    objectives: ['o'],
    prerequisites: prereqs.map((p) => ({ prerequisite_skill_id: p })),
    mastery_thresholds: {
      understanding: 80,
      accuracy: 85,
      independence: 80,
      retention: 75,
      transfer: 70,
    },
    content_version: '0.1.0',
  };
}
function progressAt(
  id: string,
  state: SkillState,
  over: Partial<SkillProgress> = {},
): SkillProgress {
  return { ...emptySkillProgress(id), state, ...over };
}

describe("today's session", () => {
  const graph = buildGraph([skill('a'), skill('b', ['a']), skill('c', ['b'])]);
  const order = ['a', 'b', 'c'];

  it('lists due reviews and the next unlocked skill', () => {
    const progress = new Map<string, SkillProgress>([
      ['a', progressAt('a', 'mastered', { next_review_at: '2026-07-20T00:00:00Z' })],
      ['b', progressAt('b', 'learning')],
    ]);
    const session = selectTodaysSession(progress, graph, order, '2026-07-23T00:00:00Z');
    expect(session.dueSkills).toContain('a'); // review overdue
    expect(session.nextSkill).toBe('b'); // unlocked (a mastered) and in progress
  });

  // Subject chosen at Goal Selection (doc 07).
  describe('subject focus', () => {
    const wide = buildGraph([skill('a'), skill('b'), skill('c')]);
    const wideOrder = ['a', 'b', 'c'];
    const progress = new Map<string, SkillProgress>();

    it('takes the next skill from the chosen subject, not the global frontier', () => {
      const session = selectTodaysSession(
        progress,
        wide,
        wideOrder,
        '2026-07-23T00:00:00Z',
        [],
        new Set(['c']),
      );
      expect(session.nextSkill).toBe('c');
    });

    it('falls back to the whole curriculum rather than dead-ending', () => {
      const done = new Map<string, SkillProgress>([['c', progressAt('c', 'mastered')]]);
      const session = selectTodaysSession(
        done,
        wide,
        wideOrder,
        '2026-07-23T00:00:00Z',
        [],
        new Set(['c']),
      );
      expect(session.nextSkill).toBe('a');
    });

    it('never hides a due review that sits outside the chosen subject', () => {
      const due = new Map<string, SkillProgress>([
        ['a', progressAt('a', 'mastered', { next_review_at: '2026-07-20T00:00:00Z' })],
      ]);
      const session = selectTodaysSession(
        due,
        wide,
        wideOrder,
        '2026-07-23T00:00:00Z',
        [],
        new Set(['c']),
      );
      expect(session.dueSkills).toEqual(['a']);
    });
  });
});
