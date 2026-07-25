/**
 * Optional sync and cross-device resume (Phase 20, DEC-006/013/015).
 *
 * Sync is off by default and the app is fully usable without it. Nothing here
 * is a source of truth: the append-only event log is, and every event already
 * carries a stable `event_id`, so merging two devices is a set union rather
 * than a conflict resolution problem. There is no last-writer-wins, no vector
 * clock, and no merge policy to get wrong - two devices that both practised
 * offline simply end up with both sets of events, and the projection replays to
 * the same answer on each.
 *
 * That property is the whole reason this phase is small. It is worth keeping:
 * anything that makes an event mutable would turn this back into a distributed
 * systems problem.
 *
 * Credentials never travel through here into the log. Like BYOK keys they live
 * in client storage only (DEC-015), so a progress export can be shared without
 * leaking a token.
 */
import type { LearningEvent } from '@learn/domain';
import type { EventStore } from './event-store.js';

/**
 * A place events can be pushed to and pulled from. Deliberately tiny so a
 * folder, a Supabase table, or a plain HTTP endpoint can all implement it.
 */
export interface SyncBackend {
  readonly name: string;
  /** Every event the remote holds for this learner. */
  pull(learnerId: string): Promise<LearningEvent[]>;
  /** Store these events. Must be idempotent on `event_id`. */
  push(learnerId: string, events: LearningEvent[]): Promise<void>;
}

export interface SyncResult {
  status: 'ok' | 'failed';
  /** Events the remote had that this device did not. */
  pulled: number;
  /** Events this device had that the remote did not. */
  pushed: number;
  /** Present only when status is 'failed'. */
  error?: string;
}

/**
 * Merge this device with the remote, in both directions.
 *
 * Pull is applied through the store's own append, which already ignores an
 * event_id it has seen, so a repeated sync adds nothing. Push sends only what
 * the remote is missing.
 *
 * Never throws: a sync that fails leaves local data untouched and says so,
 * because losing the ability to practise offline would be a far worse outcome
 * than a stale remote.
 */
export async function syncEvents(
  store: EventStore,
  backend: SyncBackend,
  learnerId: string,
): Promise<SyncResult> {
  let remote: LearningEvent[];
  try {
    remote = await backend.pull(learnerId);
  } catch (error) {
    return { status: 'failed', pulled: 0, pushed: 0, error: (error as Error).message };
  }

  let pulled = 0;
  for (const event of remote) {
    // Only this learner's events, whatever the remote returned.
    if (event.learner_id !== learnerId) continue;
    if (await store.append(event)) pulled += 1;
  }

  const remoteIds = new Set(remote.map((e) => e.event_id));
  const local = await store.getByLearner(learnerId);
  const missing = local.filter((e) => !remoteIds.has(e.event_id));

  if (missing.length > 0) {
    try {
      await backend.push(learnerId, missing);
    } catch (error) {
      // The pull already succeeded, so report what landed rather than pretending
      // the whole sync failed.
      return { status: 'failed', pulled, pushed: 0, error: (error as Error).message };
    }
  }

  return { status: 'ok', pulled, pushed: missing.length };
}

/** Reference backend for tests and for a second in-process device. */
export class InMemorySyncBackend implements SyncBackend {
  readonly name = 'memory';
  private readonly events = new Map<string, LearningEvent>();

  async pull(learnerId: string): Promise<LearningEvent[]> {
    return [...this.events.values()]
      .filter((e) => e.learner_id === learnerId)
      .sort((a, b) => a.seq - b.seq);
  }

  async push(_learnerId: string, events: LearningEvent[]): Promise<void> {
    for (const event of events) {
      // Idempotent on event_id, same contract as the local store.
      if (!this.events.has(event.event_id)) this.events.set(event.event_id, event);
    }
  }

  /** Test helper: how many events the remote is holding. */
  size(): number {
    return this.events.size;
  }
}

export interface HttpSyncConfig {
  /** Base URL of the sync endpoint. */
  endpoint: string;
  /** Optional bearer token. Stored client-side only, never in the event log. */
  token?: string;
}

/**
 * A plain HTTP backend: GET returns the learner's events, POST accepts a batch.
 * Deliberately unopinionated so it can sit in front of Supabase, a small server,
 * or anything else that honours those two calls and dedupes on event_id.
 */
export class HttpSyncBackend implements SyncBackend {
  readonly name = 'http';

  constructor(
    private readonly config: HttpSyncConfig,
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {}

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.config.token) headers.authorization = `Bearer ${this.config.token}`;
    return headers;
  }

  private url(learnerId: string): string {
    const base = this.config.endpoint.replace(/\/$/, '');
    return `${base}/events?learner_id=${encodeURIComponent(learnerId)}`;
  }

  async pull(learnerId: string): Promise<LearningEvent[]> {
    const response = await this.fetchImpl(this.url(learnerId), { headers: this.headers() });
    if (!response.ok) throw new Error(`sync pull failed (${response.status})`);
    const body = (await response.json()) as { events?: unknown };
    if (!Array.isArray(body.events)) throw new Error('sync pull returned no events array');
    // Only well-formed events; a malformed remote must not corrupt the log.
    return body.events.filter((e): e is LearningEvent => {
      const candidate = e as Partial<LearningEvent>;
      return (
        typeof candidate?.event_id === 'string' &&
        typeof candidate.learner_id === 'string' &&
        typeof candidate.type === 'string' &&
        typeof candidate.seq === 'number'
      );
    });
  }

  async push(learnerId: string, events: LearningEvent[]): Promise<void> {
    const response = await this.fetchImpl(this.url(learnerId), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ events }),
    });
    if (!response.ok) throw new Error(`sync push failed (${response.status})`);
  }
}
