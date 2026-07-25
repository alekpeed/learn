/** Validator interface types (doc 08 §2 Validation Engine). */

export type ValidatorType =
  | 'numeric'
  | 'fraction'
  | 'decimal'
  | 'percentage'
  | 'unit'
  | 'exact_choice'
  | 'structured'
  | 'multi_select'
  | 'ordering'
  | 'point'
  | 'exact_value';

export interface AnswerSpec {
  correct_answer: unknown;
  accepted_equivalents?: unknown[];
  /** Absolute numeric tolerance (numeric/decimal/unit). */
  tolerance?: number;
  /** Required unit (unit validator). */
  unit?: string;
  rounding?: {
    decimals?: number;
    significant_figures?: number;
  };
}

export interface ValidationOutcome {
  correct: boolean;
  /** Canonical form of the learner's answer, stored on the attempt. */
  normalized: string;
  /** Present when the answer could not be graded (bad format, unit mismatch). */
  reason?: string;
}
