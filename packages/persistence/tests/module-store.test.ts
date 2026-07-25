import { describe, it, expect } from 'vitest';
import { InMemoryModuleStore, type InstalledModule } from '../src/module-store.js';

function module(id: string, name = id, installedAt = '2026-07-25T00:00:00.000Z'): InstalledModule {
  return { module_id: id, name, installed_at: installedAt, json: '{}' };
}

describe('installed course modules (Phase 18)', () => {
  it('starts with nothing installed and the built-in course active', async () => {
    const store = new InMemoryModuleStore();
    expect(await store.list()).toEqual([]);
    expect(await store.getActiveId()).toBeNull();
  });

  it('installs, activates, and reads back a module', async () => {
    const store = new InMemoryModuleStore();
    await store.install(module('m1', 'Geometry'));
    await store.setActiveId('m1');
    expect((await store.list()).map((m) => m.name)).toEqual(['Geometry']);
    expect(await store.getActiveId()).toBe('m1');
  });

  it('installing the same id again replaces it rather than duplicating', async () => {
    const store = new InMemoryModuleStore();
    await store.install(module('m1', 'Geometry v1'));
    await store.install(module('m1', 'Geometry v2'));
    const all = await store.list();
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe('Geometry v2');
  });

  it('falls back to the built-in course when the active module is removed', async () => {
    const store = new InMemoryModuleStore();
    await store.install(module('m1'));
    await store.setActiveId('m1');
    await store.remove('m1');
    // Never left pointing at content that is no longer there.
    expect(await store.getActiveId()).toBeNull();
    expect(await store.list()).toEqual([]);
  });

  it('leaves the active module alone when a different one is removed', async () => {
    const store = new InMemoryModuleStore();
    await store.install(module('m1'));
    await store.install(module('m2'));
    await store.setActiveId('m1');
    await store.remove('m2');
    expect(await store.getActiveId()).toBe('m1');
  });

  it('refuses to activate a module that is not installed', async () => {
    const store = new InMemoryModuleStore();
    await expect(store.setActiveId('nope')).rejects.toThrow(/unknown module/);
  });

  it('lists modules in install order', async () => {
    const store = new InMemoryModuleStore();
    await store.install(module('b', 'Second', '2026-07-26T00:00:00.000Z'));
    await store.install(module('a', 'First', '2026-07-25T00:00:00.000Z'));
    expect((await store.list()).map((m) => m.name)).toEqual(['First', 'Second']);
  });
});
