import { describe, it, expect } from 'vitest';
import { InMemoryEventStore, LearnerRepository } from '../src/index.js';

function repo(): { store: InMemoryEventStore; learners: LearnerRepository } {
  const store = new InMemoryEventStore();
  let tick = 0;
  // A fixed, increasing clock so created_at ordering is deterministic.
  const clock = (): string => {
    tick += 1;
    return `2026-07-25T10:00:0${tick}.000Z`;
  };
  return { store, learners: new LearnerRepository(store, clock) };
}

describe('multi-learner profiles (Phase 25)', () => {
  it('lists every profile, oldest first', async () => {
    const { learners } = repo();
    await learners.createProfile('Ada');
    await learners.createProfile('Grace');
    const all = await learners.listLearners();
    expect(all.map((l) => l.display_name)).toEqual(['Ada', 'Grace']);
  });

  it('projects each profile from its own events only', async () => {
    const { learners } = repo();
    const ada = await learners.createProfile('Ada');
    const grace = await learners.createProfile('Grace');
    await learners.updateSettings(ada.learner_id, {
      accessibility_settings: { text_size: 'x-large' },
    });

    const all = await learners.listLearners();
    const loadedAda = all.find((l) => l.learner_id === ada.learner_id);
    const loadedGrace = all.find((l) => l.learner_id === grace.learner_id);
    expect(loadedAda?.accessibility_settings.text_size).toBe('x-large');
    // Grace must be untouched by a setting Ada changed.
    expect(loadedGrace?.accessibility_settings.text_size).not.toBe('x-large');
  });

  it('loads the preferred profile when it exists', async () => {
    const { learners } = repo();
    const ada = await learners.createProfile('Ada');
    await learners.createProfile('Grace');
    const current = await learners.loadCurrent(ada.learner_id);
    expect(current?.display_name).toBe('Ada');
  });

  it('falls back to the newest profile when the preferred id is unknown', async () => {
    const { learners } = repo();
    await learners.createProfile('Ada');
    await learners.createProfile('Grace');
    expect((await learners.loadCurrent('nonexistent'))?.display_name).toBe('Grace');
    expect((await learners.loadCurrent(null))?.display_name).toBe('Grace');
    // No argument at all is the pre-Phase-25 behaviour and must still work.
    expect((await learners.loadCurrent())?.display_name).toBe('Grace');
  });

  it('returns null when there are no profiles', async () => {
    const { learners } = repo();
    expect(await learners.loadCurrent()).toBeNull();
    expect(await learners.listLearners()).toEqual([]);
  });

  it('deletes one profile without touching the others', async () => {
    const { store, learners } = repo();
    const ada = await learners.createProfile('Ada');
    const grace = await learners.createProfile('Grace');

    await learners.deleteLearner(ada.learner_id);

    const remaining = await learners.listLearners();
    expect(remaining.map((l) => l.display_name)).toEqual(['Grace']);
    expect(await store.getByLearner(ada.learner_id)).toEqual([]);
    expect((await store.getByLearner(grace.learner_id)).length).toBeGreaterThan(0);
  });

  it('keeps per-learner sequence numbers independent', async () => {
    const { store, learners } = repo();
    const ada = await learners.createProfile('Ada');
    const grace = await learners.createProfile('Grace');
    await learners.updateSettings(ada.learner_id, { preferences: { daily_goal_questions: 5 } });

    // Each learner's log starts at 0 regardless of what the other did.
    expect((await store.getByLearner(ada.learner_id)).map((e) => e.seq)).toEqual([0, 1]);
    expect((await store.getByLearner(grace.learner_id)).map((e) => e.seq)).toEqual([0]);
  });

  it('deleting the last profile leaves an empty device, not a broken one', async () => {
    const { learners } = repo();
    const ada = await learners.createProfile('Ada');
    await learners.deleteLearner(ada.learner_id);
    expect(await learners.listLearners()).toEqual([]);
    expect(await learners.loadCurrent(ada.learner_id)).toBeNull();
  });
});
