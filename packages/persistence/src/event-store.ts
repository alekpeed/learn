/**
 * Append-only event store (docs 08 §§3-4, DEC-006/013).
 *
 * The event log is the source of truth. Appends are idempotent by `event_id`
 * so replay and (later) sync never double-count — doc 11: "duplicate events
 * do not duplicate credit".
 */
import type { LearningEvent } from '@learn/domain';

export interface EventStore {
  /**
   * Append an event. Returns true if it was newly stored, false if an event
   * with the same `event_id` already existed (idempotent no-op).
   */
  append(event: LearningEvent): Promise<boolean>;
  /** All events for a learner, ordered by `seq` ascending. */
  getByLearner(learnerId: string): Promise<LearningEvent[]>;
  /** Every stored event, ordered by (learner_id, seq). */
  getAll(): Promise<LearningEvent[]>;
  /** Next sequence number for a learner (max existing seq + 1, or 0). */
  nextSeq(learnerId: string): Promise<number>;
  /** Remove all events (used by "reset local data", requires confirmation upstream). */
  clear(): Promise<void>;
}

function orderBySeq(a: LearningEvent, b: LearningEvent): number {
  if (a.learner_id !== b.learner_id) return a.learner_id < b.learner_id ? -1 : 1;
  return a.seq - b.seq;
}

/** In-memory store — used in tests and as the reference implementation. */
export class InMemoryEventStore implements EventStore {
  private readonly byId = new Map<string, LearningEvent>();

  append(event: LearningEvent): Promise<boolean> {
    if (this.byId.has(event.event_id)) return Promise.resolve(false);
    this.byId.set(event.event_id, event);
    return Promise.resolve(true);
  }

  getByLearner(learnerId: string): Promise<LearningEvent[]> {
    const events = [...this.byId.values()]
      .filter((e) => e.learner_id === learnerId)
      .sort(orderBySeq);
    return Promise.resolve(events);
  }

  getAll(): Promise<LearningEvent[]> {
    return Promise.resolve([...this.byId.values()].sort(orderBySeq));
  }

  async nextSeq(learnerId: string): Promise<number> {
    const events = await this.getByLearner(learnerId);
    return events.length === 0 ? 0 : (events[events.length - 1]?.seq ?? -1) + 1;
  }

  clear(): Promise<void> {
    this.byId.clear();
    return Promise.resolve();
  }
}

/** Serialize the full log for export (doc 15 §6 local-only progress export). */
export async function exportEvents(store: EventStore): Promise<string> {
  const events = await store.getAll();
  return JSON.stringify({ version: 1, events }, null, 2);
}

/**
 * Import a previously exported log. Idempotent: re-importing the same file
 * adds nothing (doc 11: "exported progress can be imported", "offline events
 * synchronize once"). Returns the count of newly added events.
 */
export async function importEvents(store: EventStore, json: string): Promise<number> {
  const parsed = JSON.parse(json) as { events?: LearningEvent[] };
  const events = parsed.events ?? [];
  let added = 0;
  for (const event of events) {
    if (await store.append(event)) added += 1;
  }
  return added;
}
