import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Question } from '@learn/curriculum';
import { QuestionView } from '../src/components/QuestionView.js';

function base(): Omit<Question, 'type' | 'validator' | 'parameters' | 'answer_spec'> {
  return {
    question_id: 'q1',
    skill_id: 's1',
    difficulty: 2,
    prompt: 'Prompt',
    hints: [{ level: 1, text: 'hint' }],
    dimensions: ['accuracy'],
    explanation: 'because',
    content_version: '0.1.0',
  };
}

function renderQ(q: Question) {
  return render(
    <MemoryRouter>
      <QuestionView question={q} learnerId={null} />
    </MemoryRouter>,
  );
}

describe('multi-select questions', () => {
  it('accepts the correct set of checkboxes', async () => {
    const q: Question = {
      ...base(),
      type: 'multi_select',
      validator: 'multi_select',
      parameters: { options: ['a', 'b', 'c'] },
      answer_spec: { correct_answer: ['a', 'c'] },
    };
    renderQ(q);
    await userEvent.click(screen.getByRole('checkbox', { name: 'a' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'c' }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
  });
});

describe('exact value questions (Phase 23)', () => {
  function exactQ(): Question {
    return {
      ...base(),
      type: 'exact_value',
      validator: 'exact_value',
      answer_spec: { correct_answer: 'sqrt(3)/2' },
    };
  }

  it('explains the notation and links the help to the input', () => {
    renderQ(exactQ());
    const input = screen.getByLabelText(/your answer/i);
    expect(input).toHaveAttribute('placeholder', expect.stringContaining('sqrt(3)/2'));
    // The notation help must be announced with the field, not merely nearby.
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(/exact value/i);
  });

  it('accepts an equivalent exact form', async () => {
    renderQ(exactQ());
    await userEvent.type(screen.getByLabelText(/your answer/i), 'sqrt(12)/4');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
  });

  it('rejects a rounded decimal where an exact value was asked for', async () => {
    renderQ(exactQ());
    await userEvent.type(screen.getByLabelText(/your answer/i), '0.866');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/not quite|try again/i)).toBeInTheDocument();
  });
});

describe('ordering questions', () => {
  it('grades the arranged order', async () => {
    const q: Question = {
      ...base(),
      type: 'ordering',
      validator: 'ordering',
      parameters: { options: ['second', 'first'] },
      answer_spec: { correct_answer: ['first', 'second'] },
    };
    renderQ(q);
    // Options start as ['second','first']; move 'first' up to fix the order.
    await userEvent.click(screen.getByRole('button', { name: /move first up/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
  });
});
