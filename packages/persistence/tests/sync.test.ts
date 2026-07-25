import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@learn/domain';
import { InMemoryEventStore } from '../src/event-store.js';
import { syncEvents, InMemorySyncBackend, HttpSyncBackend, type SyncBackend } from '../src/sync.js';

function event(id: string, seq: number, learnerId = 'l1'): LearningEvent {
  return {
    event_id: id,
    type: 'answer_submitted',
    learner_id: learnerId,
    created_at: `2026-07-25T00:00:${String(seq).padStart(2, '0')}.000Z`,
    seq,
    payload: { skill_id: 'math.a.b', correct: true },
  };
}

async function storeWith(...events: LearningEvent[]): Promise<InMemoryEventStore> {
  const store = new InMemoryEventStore();
  for (const e of events) await store.append(e);
  return store;
}

describe('cross-device sync (Phase 20)', () => {
  it('pushes local events to an empty remote', async () => {
    const store = await storeWith(event('a', 1), event('b', 2));
    const backend = new InMemorySyncBackend();

    const result = await syncEvents(store, backend, 'l1');
    expect(result).toMatchObject({ status: 'ok', pulled: 0, pushed: 2 });
    expect(backend.size()).toBe(2);
  });

  it('pulls remote events this device has never seen', async () => {
    const store = await storeWith(event('a', 1));
    const backend = new InMemorySyncBackend();
    await backend.push('l1', [event('b', 2)]);

    const result = await syncEvents(store, backend, 'l1');
    expect(result).toMatchObject({ status: 'ok', pulled: 1, pushed: 1 });
    expect((await store.getByLearner('l1')).map((e) => e.event_id).sort()).toEqual(['a', 'b']);
  });

  it('is idempotent: syncing twice changes nothing the second time', async () => {
    const store = await storeWith(event('a', 1), event('b', 2));
    const backend = new InMemorySyncBackend();

    await syncEvents(store, backend, 'l1');
    const second = await syncEvents(store, backend, 'l1');
    expect(second).toMatchObject({ status: 'ok', pulled: 0, pushed: 0 });
  });

  it('merges two devices that both worked offline, with no conflict to resolve', async () => {
    // The point of event sourcing here: this is a set union, not a merge policy.
    const laptop = await storeWith(event('a', 1), event('laptop-1', 2));
    const phone = await storeWith(event('a', 1), event('phone-1', 2));
    const backend = new InMemorySyncBackend();

    await syncEvents(laptop, backend, 'l1');
    await syncEvents(phone, backend, 'l1');
    await syncEvents(laptop, backend, 'l1');

    const laptopIds = (await laptop.getByLearner('l1')).map((e) => e.event_id).sort();
    const phoneIds = (await phone.getByLearner('l1')).map((e) => e.event_id).sort();
    expect(laptopIds).toEqual(['a', 'laptop-1', 'phone-1']);
    // The phone catches up on its next sync.
    await syncEvents(phone, backend, 'l1');
    expect((await phone.getByLearner('l1')).map((e) => e.event_id).sort()).toEqual(laptopIds);
    expect(phoneIds).not.toEqual([]);
  });

  it('converges regardless of which device syncs first', async () => {
    const a = await storeWith(event('a1', 1));
    const b = await storeWith(event('b1', 1));
    const backend = new InMemorySyncBackend();

    await syncEvents(b, backend, 'l1');
    await syncEvents(a, backend, 'l1');
    await syncEvents(b, backend, 'l1');

    const idsA = (await a.getByLearner('l1')).map((e) => e.event_id).sort();
    const idsB = (await b.getByLearner('l1')).map((e) => e.event_id).sort();
    expect(idsA).toEqual(idsB);
  });

  it('ignores events belonging to a different learner', async () => {
    const store = await storeWith(event('a', 1));
    const backend = new InMemorySyncBackend();
    await backend.push('l1', [event('other', 1, 'someone-else')]);

    await syncEvents(store, backend, 'l1');
    expect((await store.getByLearner('l1')).map((e) => e.event_id)).toEqual(['a']);
  });

  it('leaves local data untouched when the remote cannot be reached', async () => {
    const store = await storeWith(event('a', 1));
    const failing: SyncBackend = {
      name: 'broken',
      pull: async () => {
        throw new Error('offline');
      },
      push: async () => {},
    };

    const result = await syncEvents(store, failing, 'l1');
    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/offline/);
    // Practising offline must never be collateral damage of a failed sync.
    expect(await store.getByLearner('l1')).toHaveLength(1);
  });

  it('reports what landed when the pull worked but the push did not', async () => {
    const store = await storeWith(event('a', 1));
    const halfBroken: SyncBackend = {
      name: 'half',
      pull: async () => [event('remote', 5)],
      push: async () => {
        throw new Error('write rejected');
      },
    };

    const result = await syncEvents(store, halfBroken, 'l1');
    expect(result).toMatchObject({ status: 'failed', pulled: 1, pushed: 0 });
    expect(await store.getByLearner('l1')).toHaveLength(2);
  });
});

describe('HTTP sync backend (Phase 20)', () => {
  function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
      ok,
      status,
      json: async () => body,
    } as unknown as Response;
  }

  it('sends the bearer token when one is configured', async () => {
    let seen: RequestInit | undefined;
    const backend = new HttpSyncBackend(
      { endpoint: 'https://example.test/api', token: 'secret' },
      (async (_url: string, init?: RequestInit) => {
        seen = init;
        return jsonResponse({ events: [] });
      }) as unknown as typeof fetch,
    );

    await backend.pull('l1');
    expect((seen?.headers as Record<string, string>).authorization).toBe('Bearer secret');
  });

  it('throws on a non-ok pull rather than treating it as an empty remote', async () => {
    const backend = new HttpSyncBackend({ endpoint: 'https://example.test/api' }, (async () =>
      jsonResponse({}, false, 500)) as unknown as typeof fetch);
    // Silently reading a 500 as "no events" would look like data loss.
    await expect(backend.pull('l1')).rejects.toThrow(/500/);
  });

  it('rejects a response with no events array', async () => {
    const backend = new HttpSyncBackend({ endpoint: 'https://example.test/api' }, (async () =>
      jsonResponse({ nope: true })) as unknown as typeof fetch);
    await expect(backend.pull('l1')).rejects.toThrow(/no events array/);
  });

  it('drops malformed events so a bad remote cannot corrupt the log', async () => {
    const backend = new HttpSyncBackend({ endpoint: 'https://example.test/api' }, (async () =>
      jsonResponse({
        events: [event('good', 1), { nonsense: true }, null, 'a string'],
      })) as unknown as typeof fetch);
    const pulled = await backend.pull('l1');
    expect(pulled.map((e) => e.event_id)).toEqual(['good']);
  });

  it('throws on a rejected push', async () => {
    const backend = new HttpSyncBackend({ endpoint: 'https://example.test/api' }, (async () =>
      jsonResponse({}, false, 403)) as unknown as typeof fetch);
    await expect(backend.push('l1', [event('a', 1)])).rejects.toThrow(/403/);
  });

  it('tolerates a trailing slash on the endpoint', async () => {
    let url = '';
    const backend = new HttpSyncBackend({ endpoint: 'https://example.test/api/' }, (async (
      u: string,
    ) => {
      url = u;
      return jsonResponse({ events: [] });
    }) as unknown as typeof fetch);
    await backend.pull('l1');
    expect(url).toBe('https://example.test/api/events?learner_id=l1');
  });
});
