import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryEventStore, LearnerRepository } from '@learn/persistence';
import { LearnerProvider } from '../src/state/LearnerContext.js';
import { TutorPanel } from '../src/components/TutorPanel.js';

const CONTEXT = {
  skill_id: 'math.algebra.one_step_equations',
  skill_title: 'One-Step Equations',
  objective: 'Solve using inverse operations',
  lesson_excerpt: 'Undo addition by subtracting from both sides.',
  problem_prompt: 'Solve x + 4 = 11',
  correct_answer: '7',
};

async function renderPanel(aiEnabled: boolean) {
  const store = new InMemoryEventStore();
  const repo = new LearnerRepository(store, () => '2026-07-23T00:00:00.000Z');
  const learner = await repo.createProfile('Ada');
  if (aiEnabled) {
    await repo.updateSettings(learner.learner_id, { preferences: { ai_tutor_enabled: true } });
  }
  render(
    <LearnerProvider repository={repo}>
      <MemoryRouter>
        <TutorPanel context={CONTEXT} modes={['explain', 'guide']} />
      </MemoryRouter>
    </LearnerProvider>,
  );
}

describe('TutorPanel (Phase 8)', () => {
  it('is off by default and points to Settings (DEC-010)', async () => {
    await renderPanel(false);
    expect(await screen.findByText(/the ai tutor is off/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /explain differently/i })).not.toBeInTheDocument();
  });

  it('when enabled, gives a grounded explanation', async () => {
    await renderPanel(true);
    const explain = await screen.findByRole('button', { name: /explain differently/i });
    await userEvent.click(explain);
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /tutor response/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('region', { name: /tutor response/i })).toHaveTextContent(
      /One-Step Equations/i,
    );
  });

  it('guided mode never reveals the answer (hint restraint)', async () => {
    await renderPanel(true);
    await userEvent.click(await screen.findByRole('button', { name: /guide me/i }));
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /tutor response/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('region', { name: /tutor response/i })).not.toHaveTextContent(/\b7\b/);
  });
});
