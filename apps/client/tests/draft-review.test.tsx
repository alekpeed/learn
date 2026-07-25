/**
 * The author gate (Phase 19, DEC-005/010): a proposed question reaches a learner
 * only after deterministic screening AND an explicit human approval.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TutorGateway, type TutorProvider } from '@learn/ai-gateway';
import { InMemoryModuleStore } from '@learn/persistence';
import { CurriculumProvider } from '../src/state/CurriculumContext.js';
import { DraftReview } from '../src/components/DraftReview.js';

const SKILL_TITLE = 'Place Value';

function providerReturning(text: string): TutorProvider {
  return {
    name: 'test',
    isAvailable: () => true,
    generate: async () => ({ text }),
  };
}

const GOOD_DRAFT = JSON.stringify([
  {
    type: 'numeric',
    difficulty: 2,
    prompt: 'What is the value of the 7 in 472?',
    answer_spec: { correct_answer: 70 },
    validator: 'numeric',
    hints: [{ level: 1, text: 'Name the column the digit sits in.' }],
    dimensions: ['accuracy'],
    explanation: 'The 7 sits in the tens column.',
  },
]);

const BAD_DRAFT = JSON.stringify([
  {
    type: 'numeric',
    difficulty: 2,
    prompt: 'What is the value of the 7 in 472?',
    answer_spec: { correct_answer: 'roughly seventy' },
    validator: 'numeric',
    hints: [{ level: 1, text: 'Name the column.' }],
    dimensions: ['accuracy'],
    explanation: 'Tens column.',
  },
]);

function renderReview(text: string, store: InMemoryModuleStore) {
  return render(
    <CurriculumProvider modules={store}>
      <MemoryRouter>
        <DraftReview gateway={new TutorGateway(providerReturning(text))} store={store} />
      </MemoryRouter>
    </CurriculumProvider>,
  );
}

async function propose(): Promise<void> {
  await userEvent.selectOptions(await screen.findByLabelText(/skill to write questions for/i), [
    screen.getByRole('option', { name: SKILL_TITLE }),
  ]);
  await userEvent.click(screen.getByRole('button', { name: /suggest questions/i }));
}

describe('AI-drafted practice questions (Phase 19)', () => {
  it('shows a screened suggestion but publishes nothing on its own', async () => {
    const store = new InMemoryModuleStore();
    renderReview(GOOD_DRAFT, store);
    await propose();

    expect(await screen.findByText(/value of the 7 in 472/i)).toBeVisible();
    // Reviewed, not published: the course is untouched until approval.
    expect(await store.list()).toEqual([]);
  });

  it('keeps publish disabled until something is approved', async () => {
    const store = new InMemoryModuleStore();
    renderReview(GOOD_DRAFT, store);
    await propose();

    const publish = await screen.findByRole('button', { name: /publish 0 approved/i });
    expect(publish).toBeDisabled();
  });

  it('publishes only after an explicit approval', async () => {
    const store = new InMemoryModuleStore();
    renderReview(GOOD_DRAFT, store);
    await propose();

    await userEvent.click(await screen.findByRole('checkbox', { name: /approve this question/i }));
    await userEvent.click(screen.getByRole('button', { name: /publish 1 approved/i }));

    await waitFor(async () => {
      expect(await store.getActiveId()).not.toBeNull();
    });
    expect(await screen.findByText(/published 1 question/i)).toBeVisible();
  });

  it('never offers a suggestion that failed screening', async () => {
    const store = new InMemoryModuleStore();
    renderReview(BAD_DRAFT, store);
    await propose();

    expect(await screen.findByText(/1 rejected/i)).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: /approve/i })).toBeNull();
    expect(await store.list()).toEqual([]);
  });

  it('says why a suggestion was rejected', async () => {
    const store = new InMemoryModuleStore();
    renderReview(BAD_DRAFT, store);
    await propose();

    await userEvent.click(await screen.findByText(/why 1 were rejected/i));
    expect(screen.getByText(/does not grade as correct/i)).toBeVisible();
  });

  it('reports unusable model output without adding anything', async () => {
    const store = new InMemoryModuleStore();
    renderReview('I am not able to help with that.', store);
    await propose();

    expect(await screen.findByRole('alert')).toHaveTextContent(/did not return anything usable/i);
    expect(await store.list()).toEqual([]);
  });

  it('survives a provider that fails entirely', async () => {
    const store = new InMemoryModuleStore();
    const failing: TutorProvider = {
      name: 'test',
      isAvailable: () => true,
      generate: async () => {
        throw new Error('network');
      },
    };
    render(
      <CurriculumProvider modules={store}>
        <MemoryRouter>
          <DraftReview gateway={new TutorGateway(failing)} store={store} />
        </MemoryRouter>
      </CurriculumProvider>,
    );
    await propose();

    // The gateway's fallback text is prose, so nothing parses and nothing is added.
    expect(await screen.findByRole('alert')).toHaveTextContent(/did not return anything usable/i);
    expect(await store.list()).toEqual([]);
  });
});
