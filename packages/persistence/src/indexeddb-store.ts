/**
 * IndexedDB adapter (DEC-013) — the browser implementation of EventStore.
 * Kept behind the same interface as InMemoryEventStore so it is replaceable
 * (doc 08 §9). All spec-relevant behavior is covered by tests against the
 * in-memory reference; this adapter mirrors it using a single object store.
 */
import type { LearningEvent } from '@learn/domain';
import type { EventStore } from './event-store.js';

const DB_NAME = 'learn-events';
const STORE = 'events';
const DB_VERSION = 1;

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDbEventStore implements EventStore {
  private dbPromise: Promise<IDBDatabase> | undefined;

  constructor(private readonly factory: IDBFactory = globalThis.indexedDB) {}

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = this.factory.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            const os = db.createObjectStore(STORE, { keyPath: 'event_id' });
            os.createIndex('by_learner_seq', ['learner_id', 'seq']);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  private async tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.open();
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  async append(event: LearningEvent): Promise<boolean> {
    const store = await this.tx('readwrite');
    const existing = await promisify(store.get(event.event_id));
    if (existing) return false;
    await promisify(store.add(event));
    return true;
  }

  async getByLearner(learnerId: string): Promise<LearningEvent[]> {
    const all = await this.getAll();
    return all.filter((e) => e.learner_id === learnerId);
  }

  async getAll(): Promise<LearningEvent[]> {
    const store = await this.tx('readonly');
    const all = (await promisify(store.getAll())) as LearningEvent[];
    return all.sort((a, b) =>
      a.learner_id !== b.learner_id ? (a.learner_id < b.learner_id ? -1 : 1) : a.seq - b.seq,
    );
  }

  async nextSeq(learnerId: string): Promise<number> {
    const events = await this.getByLearner(learnerId);
    return events.length === 0 ? 0 : (events[events.length - 1]?.seq ?? -1) + 1;
  }

  async clear(): Promise<void> {
    const store = await this.tx('readwrite');
    await promisify(store.clear());
  }

  async deleteLearner(learnerId: string): Promise<void> {
    const doomed = await this.getByLearner(learnerId);
    if (doomed.length === 0) return;
    const store = await this.tx('readwrite');
    for (const event of doomed) {
      await promisify(store.delete(event.event_id));
    }
  }
}
