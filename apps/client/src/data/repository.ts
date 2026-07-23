/**
 * Wires the browser persistence adapter (IndexedDB) into single repository
 * instances for the app. Swapping the store here (e.g. for a cloud adapter
 * later) changes nothing else — provider stays behind the interface (doc 08 §9).
 */
import { IndexedDbEventStore, LearnerRepository, PracticeRepository } from '@learn/persistence';

export const eventStore = new IndexedDbEventStore();
export const learnerRepository = new LearnerRepository(eventStore);
export const practiceRepository = new PracticeRepository(eventStore);
