/**
 * Question renderer + feedback (Phase 3). Renders one question, an input suited
 * to its type, a submit action, a progressive hint ladder, and specific
 * feedback. Status uses role=status/alert and text, never color alone.
 */
import { useState, type FormEvent } from 'react';
import type { Question } from '@learn/curriculum';
import { usePractice } from '../practice/usePractice.js';
import { PracticeRepository } from '@learn/persistence';

const CHOICE_TYPES = new Set(['multiple_choice', 'exact_choice', 'structured']);

export function QuestionView({
  question,
  learnerId,
  repository,
  onSolved,
  nextLabel,
}: {
  question: Question;
  learnerId: string | null;
  repository?: PracticeRepository;
  onSolved?: (snapshot: { hintsUsed: number; attempts: number }) => void;
  nextLabel?: string;
}): JSX.Element {
  const practice = usePractice({ question, learnerId, repository });
  const [value, setValue] = useState('');

  const options = Array.isArray((question.parameters as { options?: unknown })?.options)
    ? (question.parameters as { options: string[] }).options
    : null;
  const isChoice = CHOICE_TYPES.has(question.type) && options !== null;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!value.trim() || practice.solved) return;
    await practice.submit(value.trim());
  }

  return (
    <div className="question" aria-label={`Question ${question.question_id}`}>
      <p className="question-prompt">{question.prompt}</p>

      <form onSubmit={onSubmit}>
        {isChoice ? (
          <fieldset>
            <legend>Choose your answer</legend>
            {options!.map((opt) => (
              <label key={opt} className="choice">
                <input
                  type="radio"
                  name="answer"
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={practice.solved}
                />
                {opt}
              </label>
            ))}
          </fieldset>
        ) : (
          <>
            <label htmlFor="answer-input">Your answer</label>
            <input
              id="answer-input"
              name="answer"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={practice.solved}
              autoComplete="off"
              inputMode={question.type === 'numeric' ? 'decimal' : 'text'}
            />
          </>
        )}

        <div className="question-actions">
          <button type="submit" disabled={!value.trim() || practice.solved}>
            Submit
          </button>
          <button type="button" onClick={() => practice.revealHint()} disabled={!practice.canHint}>
            Show a hint
          </button>
        </div>
      </form>

      {practice.revealedHints > 0 && (
        <section aria-label="Hints" className="hints">
          <ol>
            {question.hints.slice(0, practice.revealedHints).map((h) => (
              <li key={h.level}>{h.text}</li>
            ))}
          </ol>
        </section>
      )}

      {practice.outcome && !practice.solved && practice.diagnosis && (
        <p className="feedback" role="alert" data-status="error">
          {practice.diagnosis.message}
        </p>
      )}

      {practice.solved && (
        <div className="feedback" role="status" data-status="success">
          <p>Correct!</p>
          <p className="explanation">{question.explanation}</p>
          {onSolved && (
            <button
              type="button"
              onClick={() =>
                onSolved({ hintsUsed: practice.revealedHints, attempts: practice.attemptNumber })
              }
            >
              {nextLabel ?? 'Next'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
