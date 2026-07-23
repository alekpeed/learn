import { describe, it, expect } from 'vitest';
import {
  InMemoryEventStore,
  PracticeRepository,
  exportEvents,
  importEvents,
} from '../src/index.js';

const clock = () => '2026-07-23T00:00:00.000Z';

function attempt(over: Partial<Parameters<PracticeRepository['submitAttempt']>[1]> = {}) {
  return {
    question_id: 'math.u.s.q1',
    skill_id: 'math.u.s',
    submitted_answer: '40',
    normalized_answer: '40',
    correct: true,
    attempt_number: 1,
    hints_used: 0,
    difficulty: 2,
    response_time_ms: 1000,
    dimensions: ['accuracy'],
    is_transfer: false,
    ...over,
  };
}

describe('PracticeRepository (PRC-006)', () => {
  it('records and projects attempts in order', async () => {
    const store = new InMemoryEventStore();
    const repo = new PracticeRepository(store, clock);
    await repo.presentQuestion('L1', 'math.u.s.q1', 'math.u.s');
    await repo.submitAttempt('L1', attempt({ correct: false, attempt_number: 1 }));
    await repo.submitAttempt('L1', attempt({ correct: true, attempt_number: 2 }));

    const attempts = await repo.getAttempts('L1', 'math.u.s.q1');
    expect(attempts).toHaveLength(2);
    expect(attempts.map((a) => a.attempt_number)).toEqual([1, 2]);
    expect(attempts[1]?.correct).toBe(true);
  });

  it('counts hint requests per question', async () => {
    const store = new InMemoryEventStore();
    const repo = new PracticeRepository(store, clock);
    await repo.requestHint('L1', 'math.u.s.q1', 1);
    await repo.requestHint('L1', 'math.u.s.q1', 2);
    await repo.requestHint('L1', 'other.q', 1);
    expect(await repo.countHints('L1', 'math.u.s.q1')).toBe(2);
  });

  it('does not double-count attempts after re-importing the log', async () => {
    const store = new InMemoryEventStore();
    const repo = new PracticeRepository(store, clock);
    await repo.submitAttempt('L1', attempt());
    const dump = await exportEvents(store);

    const store2 = new InMemoryEventStore();
    await importEvents(store2, dump);
    await importEvents(store2, dump); // idempotent replay
    const repo2 = new PracticeRepository(store2, clock);
    expect(await repo2.getAttempts('L1')).toHaveLength(1);
  });
});
