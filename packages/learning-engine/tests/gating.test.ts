import { describe, it, expect } from 'vitest';
import { buildGraph, type Skill } from '@learn/curriculum';
import { emptySkillProgress, type SkillProgress, type SkillState } from '@learn/domain';
import { unlockStatus, findRemediationTarget, selectDifficulty } from '../src/index.js';

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

function progressAt(id: string, state: SkillState): SkillProgress {
  return { ...emptySkillProgress(id), state };
}

// a -> b -> c
const graph = buildGraph([
  skill('math.u.a'),
  skill('math.u.b', ['math.u.a']),
  skill('math.u.c', ['math.u.b']),
]);

describe('prerequisite gating (LRN-003, chain progression exit criterion)', () => {
  it('locks a skill until its prerequisite is provisionally mastered', () => {
    const progress = new Map<string, SkillProgress>();
    progress.set('math.u.a', progressAt('math.u.a', 'practicing'));
    expect(unlockStatus('math.u.b', graph, progress).unlocked).toBe(false);

    progress.set('math.u.a', progressAt('math.u.a', 'provisionally_mastered'));
    expect(unlockStatus('math.u.b', graph, progress).unlocked).toBe(true);
  });

  it('a root skill is always unlocked', () => {
    expect(unlockStatus('math.u.a', graph, new Map()).unlocked).toBe(true);
  });
});

describe('remediation routing (LRN-004)', () => {
  it('routes to the lowest unstable prerequisite', () => {
    const progress = new Map<string, SkillProgress>();
    // Nothing satisfied: remediation for c should send us to a (the root).
    expect(findRemediationTarget('math.u.c', graph, progress)).toBe('math.u.a');

    // a satisfied: remediation for c should send us to b.
    progress.set('math.u.a', progressAt('math.u.a', 'mastered'));
    expect(findRemediationTarget('math.u.c', graph, progress)).toBe('math.u.b');
  });
});

describe('adaptive difficulty (LRN-005)', () => {
  it('rises after clean success and falls after errors or heavy hints', () => {
    expect(selectDifficulty([])).toBe(2);
    const clean = [
      { correct: true, hints_used: 0, difficulty: 2 },
      { correct: true, hints_used: 0, difficulty: 2 },
    ];
    expect(selectDifficulty(clean)).toBe(3);
    const struggling = [{ correct: false, hints_used: 0, difficulty: 3 }];
    expect(selectDifficulty(struggling)).toBe(2);
    const hinted = [{ correct: true, hints_used: 3, difficulty: 3 }];
    expect(selectDifficulty(hinted)).toBe(2);
  });
});
