/**
 * Error-diagnosis categories (doc 02 §8). Deterministic classification assigns
 * one of these to an incorrect answer so the learner gets the smallest useful
 * correction rather than the full answer immediately (doc 02 §8, doc 04 §8).
 */
export const DIAGNOSIS_CATEGORIES = [
  'arithmetic_error',
  'sign_error',
  'place_value_error',
  'incorrect_operation',
  'misread_problem',
  'incorrect_rule',
  'conceptual_misunderstanding',
  'missing_prerequisite',
  'equivalent_form_issue',
  'unit_error',
  'graph_reading_error',
  'guessing_pattern',
  'execution_mistake',
  'invalid_format',
  'unclassified',
] as const;

export type DiagnosisCategory = (typeof DIAGNOSIS_CATEGORIES)[number];

export function isDiagnosisCategory(value: unknown): value is DiagnosisCategory {
  return typeof value === 'string' && (DIAGNOSIS_CATEGORIES as readonly string[]).includes(value);
}
