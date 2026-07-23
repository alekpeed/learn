/**
 * Learner notes (Version 1, doc 07 Notes). One editable note per skill, stored
 * as `note_saved` events so notes ride along in progress export/import and stay
 * reproducible (DEC-006). The latest note for a skill wins.
 */
import type { LearningEvent } from '@learn/domain';
import type { EventStore } from './event-store.js';
import { newId } from './id.js';
import { systemClock, type Clock } from './clock.js';

export interface Note {
  skill_id: string;
  text: string;
  updated_at: string;
}

interface NotePayload {
  skill_id: string;
  text: string;
}

/** Fold events into the current note per skill (latest wins; empty clears it). */
export function projectNotes(events: LearningEvent[]): Map<string, Note> {
  const notes = new Map<string, Note>();
  for (const event of events) {
    if (event.type !== 'note_saved') continue;
    const p = event.payload as unknown as NotePayload;
    if (p.text.trim() === '') {
      notes.delete(p.skill_id);
    } else {
      notes.set(p.skill_id, { skill_id: p.skill_id, text: p.text, updated_at: event.created_at });
    }
  }
  return notes;
}

export class NotesRepository {
  constructor(
    private readonly store: EventStore,
    private readonly clock: Clock = systemClock,
  ) {}

  async saveNote(learnerId: string, skillId: string, text: string): Promise<void> {
    const seq = await this.store.nextSeq(learnerId);
    const event: LearningEvent = {
      event_id: newId(),
      type: 'note_saved',
      learner_id: learnerId,
      created_at: this.clock(),
      seq,
      payload: { skill_id: skillId, text },
    };
    await this.store.append(event);
  }

  async getNotes(learnerId: string): Promise<Map<string, Note>> {
    return projectNotes(await this.store.getByLearner(learnerId));
  }

  async getNote(learnerId: string, skillId: string): Promise<Note | null> {
    return (await this.getNotes(learnerId)).get(skillId) ?? null;
  }
}
