import { describe, it, expect } from 'vitest';
import {
  InMemoryEventStore,
  NotesRepository,
  exportEvents,
  importEvents,
  projectNotes,
} from '../src/index.js';

const clock = () => '2026-07-23T00:00:00.000Z';

describe('NotesRepository (Version 1 notes)', () => {
  it('saves and reads a note per skill, latest wins', async () => {
    const store = new InMemoryEventStore();
    const repo = new NotesRepository(store, clock);
    await repo.saveNote('L1', 'math.s1', 'first');
    await repo.saveNote('L1', 'math.s1', 'second');
    await repo.saveNote('L1', 'math.s2', 'other');

    expect((await repo.getNote('L1', 'math.s1'))?.text).toBe('second');
    expect((await repo.getNote('L1', 'math.s2'))?.text).toBe('other');
    expect(await repo.getNote('L1', 'math.none')).toBeNull();
  });

  it('an empty note clears it', async () => {
    const store = new InMemoryEventStore();
    const repo = new NotesRepository(store, clock);
    await repo.saveNote('L1', 'math.s1', 'note');
    await repo.saveNote('L1', 'math.s1', '');
    expect(await repo.getNote('L1', 'math.s1')).toBeNull();
  });

  it('notes travel in a progress export and re-import idempotently', async () => {
    const a = new InMemoryEventStore();
    const repo = new NotesRepository(a, clock);
    await repo.saveNote('L1', 'math.s1', 'keep me');
    const dump = await exportEvents(a);

    const b = new InMemoryEventStore();
    await importEvents(b, dump);
    await importEvents(b, dump);
    expect(projectNotes(await b.getByLearner('L1')).get('math.s1')?.text).toBe('keep me');
  });
});
