import { describe, it, expect } from 'vitest';
import { buildGraph, findMissingReferences, findCycle, topologicalOrder } from '../src/graph.js';
import type { Skill } from '../src/types.js';

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

describe('skill graph', () => {
  it('orders prerequisites before dependents', () => {
    const g = buildGraph([
      skill('math.u.c', ['math.u.b']),
      skill('math.u.b', ['math.u.a']),
      skill('math.u.a'),
    ]);
    const order = topologicalOrder(g);
    expect(order).not.toBeNull();
    const pos = (id: string) => order!.indexOf(id);
    expect(pos('math.u.a')).toBeLessThan(pos('math.u.b'));
    expect(pos('math.u.b')).toBeLessThan(pos('math.u.c'));
  });

  it('detects missing prerequisite references', () => {
    const g = buildGraph([skill('math.u.a', ['math.u.ghost'])]);
    expect(findMissingReferences(g)).toEqual(['math.u.ghost']);
  });

  it('reports a cycle and refuses to topologically sort it', () => {
    const g = buildGraph([skill('math.u.a', ['math.u.b']), skill('math.u.b', ['math.u.a'])]);
    const cycle = findCycle(g);
    expect(cycle).not.toBeNull();
    expect(cycle).toContain('math.u.a');
    expect(cycle).toContain('math.u.b');
    expect(topologicalOrder(g)).toBeNull();
  });

  it('acyclic graph has no cycle', () => {
    const g = buildGraph([skill('math.u.a'), skill('math.u.b', ['math.u.a'])]);
    expect(findCycle(g)).toBeNull();
  });
});
