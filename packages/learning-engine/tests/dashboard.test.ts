import { describe, it, expect } from 'vitest';
import {
  overallScore,
  bucketFor,
  summarizeProgress,
  masteryByUnit,
  dimensionAverages,
} from '../src/index.js';
import { buildGraph, type Skill } from '@learn/curriculum';
import { emptySkillProgress, type SkillProgress, type SkillState } from '@learn/domain';

function skill(id: string, unitId: string): Skill {
  return {
    skill_id: id,
    unit_id: unitId,
    title: id,
    summary: id,
    objectives: ['o'],
    prerequisites: [],
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

const FULL = { understanding: 90, accuracy: 90, independence: 90, retention: 90, transfer: 90 };

describe('overallScore', () => {
  it('is the mean of the five dimensions', () => {
    expect(overallScore(FULL)).toBe(90);
    expect(
      overallScore({ understanding: 100, accuracy: 0, independence: 0, retention: 0, transfer: 0 }),
    ).toBe(20);
  });
});

describe('bucketFor', () => {
  it('collapses states into four buckets', () => {
    expect(bucketFor('mastered')).toBe('mastered');
    expect(bucketFor('provisionally_mastered')).toBe('mastered');
    expect(bucketFor('learning')).toBe('in_progress');
    expect(bucketFor('review_due')).toBe('in_progress');
    expect(bucketFor('diagnosed_weak')).toBe('needs_work');
    expect(bucketFor('decayed')).toBe('needs_work');
    expect(bucketFor('unknown')).toBe('not_started');
  });
});

describe('summarizeProgress', () => {
  const graph = buildGraph([skill('a', 'u1'), skill('b', 'u1'), skill('c', 'u2')]);
  const now = '2026-07-23T00:00:00Z';

  it('counts buckets across every skill, including untouched ones', () => {
    const progress = new Map<string, SkillProgress>([
      ['a', progressAt('a', 'mastered', { attempt_count: 4, scores: FULL })],
      ['b', progressAt('b', 'learning', { attempt_count: 2, scores: { ...FULL, transfer: 40 } })],
      // c never started
    ]);
    const s = summarizeProgress(progress, graph, now);
    expect(s.totalSkills).toBe(3);
    expect(s.mastered).toBe(1);
    expect(s.inProgress).toBe(1);
    expect(s.notStarted).toBe(1);
    expect(s.started).toBe(2);
    expect(Math.round(s.avgOverall)).toBe(85); // (90 + 80) / 2
  });

  it('counts due reviews', () => {
    const progress = new Map<string, SkillProgress>([
      [
        'a',
        progressAt('a', 'mastered', { attempt_count: 1, next_review_at: '2026-07-20T00:00:00Z' }),
      ],
    ]);
    expect(summarizeProgress(progress, graph, now).dueReview).toBe(1);
  });
});

describe('masteryByUnit', () => {
  const graph = buildGraph([skill('a', 'u2'), skill('b', 'u1'), skill('c', 'u1')]);
  const units = [
    { unit_id: 'u1', title: 'Unit One', order: 1 },
    { unit_id: 'u2', title: 'Unit Two', order: 2 },
  ];

  it('groups by unit, ordered by unit order, with per-unit stats', () => {
    const progress = new Map<string, SkillProgress>([
      ['b', progressAt('b', 'mastered', { attempt_count: 3, scores: FULL })],
      ['c', progressAt('c', 'learning', { attempt_count: 1, scores: { ...FULL, transfer: 30 } })],
    ]);
    const rows = masteryByUnit(progress, graph, units);
    expect(rows.map((r) => r.unitId)).toEqual(['u1', 'u2']);
    const u1 = rows[0]!;
    const u2 = rows[1]!;
    expect(u1.total).toBe(2);
    expect(u1.mastered).toBe(1);
    expect(u1.started).toBe(2);
    expect(Math.round(u1.avgOverall)).toBe(84); // (90 + 78) / 2
    expect(u2.total).toBe(1);
    expect(u2.started).toBe(0);
    expect(u2.avgOverall).toBe(0);
  });

  it('falls back to the raw unit id when metadata is missing', () => {
    const g = buildGraph([skill('x', 'orphan')]);
    const rows = masteryByUnit(new Map(), g, []);
    expect(rows[0]!.unitId).toBe('orphan');
    expect(rows[0]!.title).toBe('orphan');
  });
});

describe('dimensionAverages', () => {
  const graph = buildGraph([skill('a', 'u1'), skill('b', 'u1')]);

  it('averages each dimension across started skills only', () => {
    const progress = new Map<string, SkillProgress>([
      ['a', progressAt('a', 'mastered', { attempt_count: 2, scores: FULL })],
      ['b', progressAt('b', 'learning', { attempt_count: 1, scores: { ...FULL, transfer: 10 } })],
    ]);
    const avg = dimensionAverages(progress, graph);
    expect(avg.understanding).toBe(90);
    expect(avg.transfer).toBe(50); // (90 + 10) / 2
  });

  it('returns zeros when nothing is started', () => {
    expect(dimensionAverages(new Map(), graph).accuracy).toBe(0);
  });
});
