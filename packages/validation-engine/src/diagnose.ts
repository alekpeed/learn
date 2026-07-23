/**
 * Deterministic error diagnosis (PRC-007, doc 02 §8, doc 04 §8).
 * Uses the submitted answer, the expected answer, and the question's declared
 * common wrong answers to classify a mistake. Deterministic rules run before
 * any AI interpretation (doc 04 §8). Produces the smallest useful correction.
 */
import type { DiagnosisCategory } from '@learn/domain';
import type { AnswerSpec, ValidatorType } from './types.js';
import { parseRational, rationalToNumber } from './rational.js';

export interface CommonWrongAnswer {
  value: unknown;
  misconception_id: string;
}

export interface DiagnosisInput {
  validator: ValidatorType;
  submitted: string;
  answer_spec: AnswerSpec;
  common_wrong_answers?: CommonWrongAnswer[];
  reason?: string;
}

export interface DiagnosisResult {
  category: DiagnosisCategory;
  message: string;
  misconception_id?: string;
}

function num(input: string): number | null {
  const r = parseRational(input);
  if (r) return rationalToNumber(r);
  const n = Number(String(input).trim());
  return Number.isFinite(n) ? n : null;
}

export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const submitted = input.submitted.trim();

  // 0. Unparseable / bad format.
  if (input.reason === 'not a number' || input.reason === 'not a fraction or number') {
    return {
      category: 'invalid_format',
      message: 'That does not look like a number. Check the format and try again.',
    };
  }
  if (input.reason === 'unit mismatch') {
    return { category: 'unit_error', message: 'The number is right, but check the unit.' };
  }
  if (input.reason === 'expected a number with a unit') {
    return {
      category: 'invalid_format',
      message: 'Include a unit with your answer, for example "40 cm".',
    };
  }

  // 1. Declared common wrong answers map straight to a misconception.
  for (const cwa of input.common_wrong_answers ?? []) {
    if (String(cwa.value).trim() === submitted) {
      return {
        category: 'conceptual_misunderstanding',
        message: 'That is a common mistake here — look again at the method.',
        misconception_id: cwa.misconception_id,
      };
    }
  }

  // 2. Numeric structural rules.
  const got = num(submitted);
  const expected = num(String(input.answer_spec.correct_answer));
  if (got !== null && expected !== null && got !== expected) {
    if (got === -expected) {
      return { category: 'sign_error', message: 'Check the sign of your answer.' };
    }
    if (expected !== 0 && (got === expected * 10 || got === expected / 10)) {
      return {
        category: 'place_value_error',
        message: 'Check the place value — you may be off by a factor of ten.',
      };
    }
    if (Math.abs(got - expected) <= Math.max(2, Math.abs(expected) * 0.1)) {
      return { category: 'arithmetic_error', message: 'You are close. Recheck your arithmetic.' };
    }
  }

  return { category: 'unclassified', message: 'Not quite. Try a hint, then try again.' };
}
