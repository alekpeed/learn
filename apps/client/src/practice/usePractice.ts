/**
 * Practice controller (PRC-005/006): grades an answer deterministically, reveals
 * progressive hints, diagnoses errors, and records every action as an event.
 * The validation engine is authoritative — no AI in this path (DEC-003).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Question } from '@learn/curriculum';
import {
  validateAnswer,
  diagnose,
  type ValidatorType,
  type ValidationOutcome,
  type DiagnosisResult,
} from '@learn/validation-engine';
import { PracticeRepository } from '@learn/persistence';
import { practiceRepository as defaultRepo } from '../data/repository.js';

export interface PracticeState {
  attemptNumber: number;
  revealedHints: number;
  outcome: ValidationOutcome | null;
  diagnosis: DiagnosisResult | null;
  solved: boolean;
}

export interface UsePracticeOptions {
  question: Question;
  learnerId: string | null;
  repository?: PracticeRepository;
  now?: () => number;
}

export interface UsePractice extends PracticeState {
  submit: (value: string) => Promise<void>;
  revealHint: () => Promise<void>;
  canHint: boolean;
}

export function usePractice({
  question,
  learnerId,
  repository = defaultRepo,
  now = () => Date.now(),
}: UsePracticeOptions): UsePractice {
  const [state, setState] = useState<PracticeState>({
    attemptNumber: 1,
    revealedHints: 0,
    outcome: null,
    diagnosis: null,
    solved: false,
  });
  const startedAt = useRef<number>(now());

  const submit = useCallback(
    async (value: string) => {
      if (state.solved) return;
      const outcome = validateAnswer(
        question.validator as ValidatorType,
        value,
        question.answer_spec,
      );
      const diagnosis = outcome.correct
        ? null
        : diagnose({
            validator: question.validator as ValidatorType,
            submitted: value,
            answer_spec: question.answer_spec,
            reason: outcome.reason,
          });

      if (learnerId) {
        await repository.submitAttempt(learnerId, {
          question_id: question.question_id,
          skill_id: question.skill_id,
          submitted_answer: value,
          normalized_answer: outcome.normalized,
          correct: outcome.correct,
          attempt_number: state.attemptNumber,
          hints_used: state.revealedHints,
          difficulty: question.difficulty,
          response_time_ms: Math.max(0, now() - startedAt.current),
        });
      }

      setState((prev) => ({
        ...prev,
        outcome,
        diagnosis,
        solved: outcome.correct,
        attemptNumber: outcome.correct ? prev.attemptNumber : prev.attemptNumber + 1,
      }));
    },
    [state.solved, state.attemptNumber, state.revealedHints, question, learnerId, repository, now],
  );

  const revealHint = useCallback(async () => {
    if (state.revealedHints >= question.hints.length || state.solved) return;
    const nextLevel = state.revealedHints + 1;
    if (learnerId) {
      await repository.requestHint(learnerId, question.question_id, nextLevel);
    }
    setState((prev) => ({ ...prev, revealedHints: nextLevel }));
  }, [state.revealedHints, state.solved, question, learnerId, repository]);

  const canHint = useMemo(
    () => !state.solved && state.revealedHints < question.hints.length,
    [state.solved, state.revealedHints, question.hints.length],
  );

  return { ...state, submit, revealHint, canHint };
}
