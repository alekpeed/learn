/**
 * Per-skill learner notes (doc 07 Notes). Loads the current note, lets the
 * learner edit and save it. Notes persist in the event log and are included in
 * a progress export. Requires a profile; degrades to a hint otherwise.
 */
import { useEffect, useRef, useState } from 'react';
import { NotesRepository } from '@learn/persistence';
import { useOptionalLearner } from '../state/LearnerContext.js';
import { notesRepository as defaultRepo } from '../data/repository.js';

export function NotesPanel({
  skillId,
  repository = defaultRepo,
}: {
  skillId: string;
  repository?: NotesRepository;
}): JSX.Element {
  const learner = useOptionalLearner()?.learner ?? null;
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!learner) return;
    let active = true;
    const key = `${learner.learner_id}:${skillId}`;
    repository.getNote(learner.learner_id, skillId).then((note) => {
      if (active && loadedFor.current !== key) {
        loadedFor.current = key;
        setText(note?.text ?? '');
      }
    });
    return () => {
      active = false;
    };
  }, [learner, skillId, repository]);

  if (!learner) {
    return (
      <aside className="notes-panel" aria-label="Notes">
        <p className="progress-note">Create a profile to keep notes.</p>
      </aside>
    );
  }

  async function save(): Promise<void> {
    if (!learner) return;
    setStatus('saving');
    await repository.saveNote(learner.learner_id, skillId, text);
    setStatus('saved');
  }

  return (
    <aside className="notes-panel" aria-label="Notes">
      <h2>Your notes</h2>
      <label htmlFor="note-text">Notes for this skill</label>
      <textarea
        id="note-text"
        value={text}
        rows={4}
        onChange={(e) => {
          setText(e.target.value);
          setStatus('idle');
        }}
        placeholder="Jot down anything that helps you remember this."
      />
      <div className="question-actions">
        <button type="button" onClick={save} disabled={status === 'saving'}>
          Save note
        </button>
        {status === 'saved' && (
          <span className="progress-note" role="status">
            Saved.
          </span>
        )}
      </div>
    </aside>
  );
}
