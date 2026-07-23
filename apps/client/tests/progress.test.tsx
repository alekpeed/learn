import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { LearningEvent } from '@learn/domain';
import { LearnerProvider } from '../src/state/LearnerContext.js';
import { CurriculumProvider } from '../src/state/CurriculumContext.js';
import { ProgressProvider } from '../src/state/ProgressContext.js';
import { Progress } from '../src/screens/Progress.js';
import { InMemoryEventStore, LearnerRepository } from '@learn/persistence';

function strongAttempt(skillId: string, i: number): LearningEvent {
  return {
    event_id: `${skillId}-${i}`,
    type: 'answer_submitted',
    learner_id: 'L1',
    created_at: '2026-07-23T00:00:00.000Z',
    seq: i,
    payload: {
      question_id: `${skillId}.q`,
      skill_id: skillId,
      submitted_answer: 'x',
      normalized_answer: 'x',
      correct: true,
      attempt_number: 1,
      hints_used: 0,
      difficulty: 5,
      response_time_ms: 100,
      dimensions: ['understanding'],
      is_transfer: true,
    },
  };
}

async function renderProgressWithLearner(events: LearningEvent[]) {
  // A real (in-memory) profile so ProgressProvider has a learner id to load for.
  const store = new InMemoryEventStore();
  const repo = new LearnerRepository(store, () => '2026-07-23T00:00:00.000Z');
  await repo.createProfile('Ada');

  render(
    <LearnerProvider repository={repo}>
      <CurriculumProvider>
        <ProgressProvider loadEvents={async () => events}>
          <MemoryRouter>
            <Progress />
          </MemoryRouter>
        </ProgressProvider>
      </CurriculumProvider>
    </LearnerProvider>,
  );
}

describe('Progress screen (Phase 4)', () => {
  it('shows skill-level scores projected from attempts', async () => {
    const skill = 'math.number_foundations.place_value';
    const events = Array.from({ length: 8 }, (_, i) => strongAttempt(skill, i));
    await renderProgressWithLearner(events);

    expect(await screen.findByRole('heading', { name: /place value/i })).toBeInTheDocument();
    // Five dimensions are surfaced (not a single course percentage).
    expect(screen.getByText('Understanding')).toBeInTheDocument();
    expect(screen.getByText('Retention')).toBeInTheDocument();
    // Sustained strong practice reaches at least provisional mastery.
    expect(screen.getByText(/provisionally mastered|mastered/i)).toBeInTheDocument();
  });

  it('shows an empty state before any practice', async () => {
    await renderProgressWithLearner([]);
    expect(await screen.findByText(/no practice yet/i)).toBeInTheDocument();
  });
});
