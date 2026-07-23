import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import type { LearningEvent } from '@learn/domain';
import { IndexedDbEventStore } from '../src/indexeddb-store.js';

function evt(id: string, seq: number, learner = 'L1'): LearningEvent {
  return {
    event_id: id,
    type: 'question_presented',
    learner_id: learner,
    created_at: '2026-07-23T00:00:00.000Z',
    seq,
    payload: {},
  };
}

describe('IndexedDbEventStore (fake-indexeddb)', () => {
  beforeEach(async () => {
    await new IndexedDbEventStore().clear();
  });

  it('persists and reloads events in seq order', async () => {
    const store = new IndexedDbEventStore();
    await store.append(evt('b', 2));
    await store.append(evt('a', 1));
    const seqs = (await store.getByLearner('L1')).map((e) => e.seq);
    expect(seqs).toEqual([1, 2]);
  });

  it('is idempotent by event_id', async () => {
    const store = new IndexedDbEventStore();
    expect(await store.append(evt('dup', 0))).toBe(true);
    expect(await store.append(evt('dup', 0))).toBe(false);
    expect(await store.getAll()).toHaveLength(1);
  });

  it('survives a new store instance against the same database (restart)', async () => {
    await new IndexedDbEventStore().append(evt('persisted', 0));
    const reopened = new IndexedDbEventStore();
    const all = await reopened.getAll();
    expect(all.map((e) => e.event_id)).toContain('persisted');
  });
});
