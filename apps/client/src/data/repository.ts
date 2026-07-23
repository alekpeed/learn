/**
 * Wires the browser persistence adapter (IndexedDB) into a single repository
 * instance for the app. Swapping the store here (e.g. for a cloud adapter
 * later) changes nothing else — provider stays behind the interface (doc 08 §9).
 */
import { IndexedDbEventStore, LearnerRepository } from '@learn/persistence';

export const eventStore = new IndexedDbEventStore();
export const learnerRepository = new LearnerRepository(eventStore);
