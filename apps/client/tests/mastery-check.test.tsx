/**
 * Check mode (doc 07 "Mastery Check"). Two of the five spec requirements are
 * enforced here rather than in the engine, because they are about what the
 * learner is shown: "no ordinary hints" and no result until the end. The
 * answer is still graded and recorded exactly as in practice - a check that
 * quietly stopped writing attempts would leave the projection unable to
 * promote the skill it just tested.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { InMemoryEventStore, PracticeRepository } from '@learn/persistence';
import type { Question } from '@learn/curriculum';
import { QuestionView } from '../src/components/QuestionView.js';

function fractionQuestion(): Question {
  return {
    question_id: 'math.f.add.q1',
    skill_id: 'math.f.add',
    type: 'fraction',
    difficulty: 2,
    prompt: 'What is 1/5 + 2/5?',
    answer_spec: { correct_answer: '3/5' },
    validator: 'fraction',
    hints: [{ level: 1, text: 'Add the numerators.' }],
    dimensions: ['accuracy'],
    explanation: 'Add numerators, keep the denominator: 3/5.',
    content_version: '0.1.0',
  };
}

function renderCheck(onAnswered: (r: { correct: boolean; misconceptionId?: string }) => void) {
  const store = new InMemoryEventStore();
  const repository = new PracticeRepository(store, () => '2026-07-27T00:00:00.000Z');
  render(
    <MemoryRouter>
      <QuestionView
        question={fractionQuestion()}
        learnerId="L1"
        repository={repository}
        mode="check"
        onAnswered={onAnswered}
      />
    </MemoryRouter>,
  );
  return repository;
}

describe('mastery check mode', () => {
  it('offers no hint button', () => {
    renderCheck(() => {});
    expect(screen.queryByRole('button', { name: /show a hint/i })).not.toBeInTheDocument();
  });

  it('withholds the verdict and the explanation after a correct answer', async () => {
    const seen: { correct: boolean }[] = [];
    renderCheck((r) => seen.push(r));

    await userEvent.type(screen.getByLabelText(/your answer/i), '3/5');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/answer recorded/i)).toBeInTheDocument();
    expect(screen.queryByText(/^correct!$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/keep the denominator/i)).not.toBeInTheDocument();
    expect(seen).toEqual([{ correct: true }]);
  });

  it('withholds feedback after a wrong answer but still reports it to the check', async () => {
    const seen: { correct: boolean }[] = [];
    renderCheck((r) => seen.push(r));

    await userEvent.type(screen.getByLabelText(/your answer/i), '3/10');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/answer recorded/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(seen[0]?.correct).toBe(false);
  });

  it('records the attempt so the projection can promote the skill', async () => {
    const repository = renderCheck(() => {});

    await userEvent.type(screen.getByLabelText(/your answer/i), '3/5');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await screen.findByText(/answer recorded/i);

    const attempts = await repository.getAttempts('L1', 'math.f.add.q1');
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.correct).toBe(true);
  });

  it('locks the answer after one attempt: a check has no second try', async () => {
    renderCheck(() => {});

    await userEvent.type(screen.getByLabelText(/your answer/i), '3/10');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await screen.findByText(/answer recorded/i);

    expect(screen.getByLabelText(/your answer/i)).toBeDisabled();
  });

  it('leaves practice mode unchanged: hints and feedback still appear', async () => {
    render(
      <MemoryRouter>
        <QuestionView question={fractionQuestion()} learnerId={null} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /show a hint/i }));
    expect(screen.getByText(/add the numerators/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/your answer/i), '3/5');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/correct/i)).toBeInTheDocument();
  });
});
