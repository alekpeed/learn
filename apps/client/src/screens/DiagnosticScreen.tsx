import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startDiagnostic,
  currentSkill,
  recordResult,
  skipCurrent,
  isComplete,
  estimatedRemaining,
  summarize,
} from '@learn/diagnostic';
import { validateAnswer, type ValidatorType } from '@learn/validation-engine';
import { useCurriculum } from '../state/CurriculumContext.js';
import { ScreenState } from '../components/ScreenState.js';

const CHOICE_TYPES = new Set(['multiple_choice', 'exact_choice', 'structured']);

/**
 * Adaptive diagnostic (doc 07 Diagnostic): one question at a time, a skip
 * option, a progress estimate, and no penalty framing (no feedback per item).
 */
export function DiagnosticScreen(): JSX.Element {
  const { package: pkg } = useCurriculum();
  const navigate = useNavigate();

  const order = useMemo(
    () => (pkg ? pkg.order.filter((id) => (pkg.questionsBySkill.get(id)?.length ?? 0) > 0) : []),
    [pkg],
  );

  const [state, setState] = useState(() => startDiagnostic(order));
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isComplete(state) && order.length > 0) {
      navigate('/diagnostic/results', { state: summarize(state) });
    }
  }, [state, order.length, navigate]);

  if (!pkg) {
    return (
      <section>
        <h1>Diagnostic</h1>
        <ScreenState status="error" message="Curriculum failed to load." />
      </section>
    );
  }

  if (order.length === 0) {
    return (
      <section>
        <h1>Diagnostic</h1>
        <ScreenState status="empty" message="No diagnostic questions are available yet." />
      </section>
    );
  }

  const skillId = currentSkill(state);
  const question = skillId ? pkg.questionsBySkill.get(skillId)?.[0] : undefined;
  if (!skillId || !question) {
    return (
      <section>
        <h1>Diagnostic</h1>
        <ScreenState status="loading" message="Preparing your results…" />
      </section>
    );
  }

  const options = Array.isArray((question.parameters as { options?: unknown })?.options)
    ? (question.parameters as { options: string[] }).options
    : null;
  const isChoice = CHOICE_TYPES.has(question.type) && options !== null;

  function submit(e: FormEvent): void {
    e.preventDefault();
    if (!value.trim() || !question) return;
    const outcome = validateAnswer(
      question.validator as ValidatorType,
      value.trim(),
      question.answer_spec,
    );
    setState((s) => recordResult(s, outcome.correct));
    setValue('');
  }

  return (
    <section>
      <h1>Diagnostic</h1>
      <p className="progress-note">
        About {estimatedRemaining(state)} question{estimatedRemaining(state) === 1 ? '' : 's'} left.
        Answer what you can — skipping is fine, and there is no penalty.
      </p>

      <div className="question">
        <p className="question-prompt">{question.prompt}</p>
        <form onSubmit={submit}>
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
                    onChange={(ev) => setValue(ev.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </fieldset>
          ) : (
            <>
              <label htmlFor="diag-answer">Your answer</label>
              <input
                id="diag-answer"
                name="answer"
                value={value}
                onChange={(ev) => setValue(ev.target.value)}
                autoComplete="off"
              />
            </>
          )}
          <div className="question-actions">
            <button type="submit" disabled={!value.trim()}>
              Submit
            </button>
            <button
              type="button"
              onClick={() => {
                setState((s) => skipCurrent(s));
                setValue('');
              }}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
