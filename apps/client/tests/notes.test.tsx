import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InMemoryEventStore, LearnerRepository, NotesRepository } from '@learn/persistence';
import { LearnerProvider } from '../src/state/LearnerContext.js';
import { NotesPanel } from '../src/components/NotesPanel.js';

const SKILL = 'math.number_foundations.place_value';

async function renderNotes() {
  const store = new InMemoryEventStore();
  const clock = () => '2026-07-23T00:00:00.000Z';
  const learnerRepo = new LearnerRepository(store, clock);
  const learner = await learnerRepo.createProfile('Ada');
  const notesRepo = new NotesRepository(store, clock);
  render(
    <LearnerProvider repository={learnerRepo}>
      <NotesPanel skillId={SKILL} repository={notesRepo} />
    </LearnerProvider>,
  );
  return { notesRepo, learnerId: learner.learner_id };
}

describe('NotesPanel (Version 1 notes)', () => {
  it('saves a note that persists to the event log', async () => {
    const { notesRepo, learnerId } = await renderNotes();
    const textarea = await screen.findByLabelText(/notes for this skill/i);
    await userEvent.type(textarea, 'tens place = 40');
    await userEvent.click(screen.getByRole('button', { name: /save note/i }));

    await waitFor(() => expect(screen.getByText(/^saved\.$/i)).toBeInTheDocument());
    expect((await notesRepo.getNote(learnerId, SKILL))?.text).toBe('tens place = 40');
  });

  it('loads an existing note into the editor', async () => {
    const store = new InMemoryEventStore();
    const clock = () => '2026-07-23T00:00:00.000Z';
    const learnerRepo = new LearnerRepository(store, clock);
    const learner = await learnerRepo.createProfile('Grace');
    const notesRepo = new NotesRepository(store, clock);
    await notesRepo.saveNote(learner.learner_id, SKILL, 'remember this');

    render(
      <LearnerProvider repository={learnerRepo}>
        <NotesPanel skillId={SKILL} repository={notesRepo} />
      </LearnerProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/notes for this skill/i)).toHaveValue('remember this'),
    );
  });

  it('prompts to create a profile when there is none', () => {
    const store = new InMemoryEventStore();
    render(<NotesPanel skillId="s" repository={new NotesRepository(store)} />);
    expect(screen.getByText(/create a profile to keep notes/i)).toBeInTheDocument();
  });
});
