import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@learn/domain';
import {
  InMemoryEventStore,
  exportEvents,
  importEvents,
  LearnerRepository,
  projectLearner,
} from '../src/index.js';

let counter = 0;
const fixedClock = () => '2026-07-23T00:00:00.000Z';

function evt(over: Partial<LearningEvent> = {}): LearningEvent {
  counter += 1;
  return {
    event_id: over.event_id ?? `e${counter}`,
    type: over.type ?? 'question_presented',
    learner_id: over.learner_id ?? 'L1',
    created_at: over.created_at ?? fixedClock(),
    seq: over.seq ?? counter,
    payload: over.payload ?? {},
  };
}

describe('InMemoryEventStore idempotency', () => {
  it('does not double-store the same event_id', async () => {
    const store = new InMemoryEventStore();
    const e = evt({ event_id: 'dup', seq: 0 });
    expect(await store.append(e)).toBe(true);
    expect(await store.append(e)).toBe(false); // duplicate → no double credit
    expect(await store.getAll()).toHaveLength(1);
  });

  it('orders events by seq per learner', async () => {
    const store = new InMemoryEventStore();
    await store.append(evt({ event_id: 'b', learner_id: 'L1', seq: 2 }));
    await store.append(evt({ event_id: 'a', learner_id: 'L1', seq: 1 }));
    const seqs = (await store.getByLearner('L1')).map((e) => e.seq);
    expect(seqs).toEqual([1, 2]);
  });

  it('computes nextSeq as max+1', async () => {
    const store = new InMemoryEventStore();
    expect(await store.nextSeq('L1')).toBe(0);
    await store.append(evt({ event_id: 'x', learner_id: 'L1', seq: 0 }));
    expect(await store.nextSeq('L1')).toBe(1);
  });
});

describe('export / import is idempotent', () => {
  it('re-importing the same log adds nothing', async () => {
    const a = new InMemoryEventStore();
    await a.append(evt({ event_id: 'k1', seq: 0 }));
    await a.append(evt({ event_id: 'k2', seq: 1 }));
    const dump = await exportEvents(a);

    const b = new InMemoryEventStore();
    expect(await importEvents(b, dump)).toBe(2);
    expect(await importEvents(b, dump)).toBe(0); // second import is a no-op
    expect(await b.getAll()).toHaveLength(2);
  });
});

describe('projection reproducibility (DEC-006)', () => {
  it('yields identical learner state on replay', async () => {
    const store = new InMemoryEventStore();
    const repo = new LearnerRepository(store, fixedClock);
    const created = await repo.createProfile('Ada');
    await repo.updateSettings(created.learner_id, {
      accessibility_settings: { text_size: 'large' },
      preferences: { ai_tutor_enabled: true },
    });

    const events = await store.getAll();
    const first = projectLearner(events);
    const second = projectLearner(events);
    expect(first).toEqual(second);
    expect(first?.accessibility_settings.text_size).toBe('large');
    expect(first?.preferences.ai_tutor_enabled).toBe(true);
    expect(first?.display_name).toBe('Ada');
  });

  it('AI tutor is off by default (DEC-010)', async () => {
    const store = new InMemoryEventStore();
    const repo = new LearnerRepository(store, fixedClock);
    const learner = await repo.createProfile('Grace');
    expect(learner.preferences.ai_tutor_enabled).toBe(false);
  });

  it('reset clears all local data', async () => {
    const store = new InMemoryEventStore();
    const repo = new LearnerRepository(store, fixedClock);
    await repo.createProfile('Temp');
    await repo.resetAll();
    expect(await repo.loadCurrent()).toBeNull();
  });
});
