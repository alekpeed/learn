/**
 * Question renderer + feedback (Phase 3). Renders one question, an input suited
 * to its type, a submit action, a progressive hint ladder, and specific
 * feedback. Status uses role=status/alert and text, never color alone.
 */
import { useState, type FormEvent } from 'react';
import type { Question } from '@learn/curriculum';
import { usePractice } from '../practice/usePractice.js';
import { TutorPanel } from './TutorPanel.js';
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

  const options = Array.isArray((question.parameters as { options?: unknown })?.options)
    ? (question.parameters as { options: string[] }).options
    : null;
  const isChoice = CHOICE_TYPES.has(question.type) && options !== null;
  const isMulti = question.type === 'multi_select' && options !== null;
  const isOrder = question.type === 'ordering' && options !== null;

  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>(() => (isOrder ? [...(options as string[])] : []));

  const answer = isMulti
    ? [...selected].sort().join('|')
    : isOrder
      ? order.join('|')
      : value.trim();
  const canSubmit = isMulti
    ? selected.length > 0
    : isOrder
      ? order.length > 0
      : value.trim() !== '';

  function toggle(opt: string): void {
    setSelected((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  }

  function move(index: number, delta: number): void {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target] as string, next[index] as string];
      return next;
    });
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!canSubmit || practice.solved) return;
    await practice.submit(answer);
  }

  return (
    <div className="question" aria-label={`Question ${question.question_id}`}>
      <p className="question-prompt">{question.prompt}</p>

      <form onSubmit={onSubmit}>
        {isChoice && (
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
        )}

        {isMulti && (
          <fieldset>
            <legend>Select all that apply</legend>
            {options!.map((opt) => (
              <label key={opt} className="choice">
                <input
                  type="checkbox"
                  name="answer"
                  value={opt}
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  disabled={practice.solved}
                />
                {opt}
              </label>
            ))}
          </fieldset>
        )}

        {isOrder && (
          <fieldset>
            <legend>Put these in the correct order</legend>
            <ol className="ordering-list">
              {order.map((item, i) => (
                <li key={item}>
                  <span className="ordering-item">{item}</span>
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || practice.solved}
                    aria-label={`Move ${item} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1 || practice.solved}
                    aria-label={`Move ${item} down`}
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ol>
          </fieldset>
        )}

        {!isChoice && !isMulti && !isOrder && (
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
          <button type="submit" disabled={!canSubmit || practice.solved}>
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

      <TutorPanel
        context={{
          skill_id: question.skill_id,
          skill_title: question.skill_id,
          problem_prompt: question.prompt,
          correct_answer: String(question.answer_spec.correct_answer),
          lesson_excerpt: question.explanation,
          detected_misconception: practice.diagnosis?.message,
        }}
        modes={
          practice.solved
            ? ['explain', 'extend']
            : practice.diagnosis
              ? ['guide', 'diagnose']
              : ['guide']
        }
      />
    </div>
  );
}
