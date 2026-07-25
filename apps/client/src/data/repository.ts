/**
 * Wires the browser persistence adapter (IndexedDB) into single repository
 * instances for the app. Swapping the store here (e.g. for a cloud adapter
 * later) changes nothing else — provider stays behind the interface (doc 08 §9).
 */
import {
  IndexedDbEventStore,
  IndexedDbModuleStore,
  LearnerRepository,
  PracticeRepository,
  NotesRepository,
} from '@learn/persistence';

export const eventStore = new IndexedDbEventStore();
/** Installed course modules live in their own database (Phase 18). */
export const moduleStore = new IndexedDbModuleStore();
export const learnerRepository = new LearnerRepository(eventStore);
export const practiceRepository = new PracticeRepository(eventStore);
export const notesRepository = new NotesRepository(eventStore);
