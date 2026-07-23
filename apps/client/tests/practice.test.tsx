import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryEventStore, PracticeRepository } from '@learn/persistence';
import type { Question } from '@learn/curriculum';
import { QuestionView } from '../src/components/QuestionView.js';

// QuestionView contains an (off-by-default) tutor panel that links to Settings,
// so a router context is required.
function renderQuestion(props: ComponentProps<typeof QuestionView>) {
  return render(
    <MemoryRouter>
      <QuestionView {...props} />
    </MemoryRouter>,
  );
}

function fractionQuestion(): Question {
  return {
    question_id: 'math.f.add.q1',
    skill_id: 'math.f.add',
    type: 'fraction',
    difficulty: 2,
    prompt: 'What is 1/5 + 2/5?',
    answer_spec: { correct_answer: '3/5' },
    validator: 'fraction',
    hints: [
      { level: 1, text: 'Add the numerators.' },
      { level: 2, text: 'Keep the denominator.' },
    ],
    dimensions: ['accuracy'],
    explanation: 'Add numerators, keep the denominator: 3/5.',
    content_version: '0.1.0',
  };
}

describe('QuestionView (Phase 3)', () => {
  it('accepts an equivalent fraction and records the attempt', async () => {
    const store = new InMemoryEventStore();
    const repo = new PracticeRepository(store, () => '2026-07-23T00:00:00.000Z');
    renderQuestion({ question: fractionQuestion(), learnerId: 'L1', repository: repo });

    await userEvent.type(screen.getByLabelText(/your answer/i), '6/10');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/correct/i)).toBeInTheDocument();
    const attempts = await repo.getAttempts('L1', 'math.f.add.q1');
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.correct).toBe(true);
    expect(attempts[0]?.normalized_answer).toBe('3/5');
  });

  it('gives specific feedback on a wrong answer and records the failed attempt', async () => {
    const store = new InMemoryEventStore();
    const repo = new PracticeRepository(store, () => '2026-07-23T00:00:00.000Z');
    renderQuestion({ question: fractionQuestion(), learnerId: 'L1', repository: repo });

    await userEvent.type(screen.getByLabelText(/your answer/i), '2/5');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    const attempts = await repo.getAttempts('L1', 'math.f.add.q1');
    expect(attempts[0]?.correct).toBe(false);
  });

  it('reveals hints progressively and records hint events', async () => {
    const store = new InMemoryEventStore();
    const repo = new PracticeRepository(store, () => '2026-07-23T00:00:00.000Z');
    renderQuestion({ question: fractionQuestion(), learnerId: 'L1', repository: repo });

    const hintButton = screen.getByRole('button', { name: /show a hint/i });
    await userEvent.click(hintButton);
    expect(screen.getByText(/add the numerators/i)).toBeInTheDocument();
    expect(screen.queryByText(/keep the denominator/i)).not.toBeInTheDocument();

    await userEvent.click(hintButton);
    expect(screen.getByText(/keep the denominator/i)).toBeInTheDocument();

    // Ladder exhausted → button disabled.
    expect(hintButton).toBeDisabled();
    expect(await repo.countHints('L1', 'math.f.add.q1')).toBe(2);
  });

  it('renders choice options for multiple-choice questions', async () => {
    const q: Question = {
      ...fractionQuestion(),
      question_id: 'math.c.q1',
      type: 'multiple_choice',
      validator: 'exact_choice',
      parameters: { options: ['<', '>', '='] },
      answer_spec: { correct_answer: '>' },
    };
    renderQuestion({ question: q, learnerId: null });
    await userEvent.click(screen.getByRole('radio', { name: '>' }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/correct/i)).toBeInTheDocument();
  });
});
