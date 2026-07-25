/**
 * Deterministic validators (PRC-001..004). Each takes the learner's raw string
 * answer plus the question's answer_spec and returns a ValidationOutcome.
 * Correctness here is authoritative — AI never overrides it (DEC-003).
 */
import type { AnswerSpec, ValidationOutcome, ValidatorType } from './types.js';
import { parseRational, rationalsEqual, rationalToNumber, type Rational } from './rational.js';
import { exactValuesEqual, formatExactValue, isUndefinedForm, parseExactValue } from './surd.js';

const DEFAULT_TOLERANCE = 1e-9;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value);
}

/** All accepted answer strings: the correct answer plus any equivalents. */
function acceptedForms(spec: AnswerSpec): string[] {
  return [spec.correct_answer, ...(spec.accepted_equivalents ?? [])].map(asString);
}

function numericValue(input: string): number | null {
  const r = parseRational(input);
  if (r) return rationalToNumber(r);
  const n = Number(input.trim());
  return Number.isFinite(n) ? n : null;
}

export function validateNumeric(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const value = numericValue(submitted);
  if (value === null) {
    return { correct: false, normalized: submitted.trim(), reason: 'not a number' };
  }
  const tolerance = spec.tolerance ?? DEFAULT_TOLERANCE;
  const normalized = String(value);
  for (const form of acceptedForms(spec)) {
    const target = numericValue(form);
    if (target !== null && Math.abs(value - target) <= tolerance) {
      return { correct: true, normalized };
    }
  }
  return { correct: false, normalized };
}

export function validateDecimal(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const decimals = spec.rounding?.decimals;
  if (decimals === undefined) return validateNumeric(submitted, spec);

  const value = numericValue(submitted);
  if (value === null) {
    return { correct: false, normalized: submitted.trim(), reason: 'not a number' };
  }
  const round = (n: number) => Number(n.toFixed(decimals));
  const rounded = round(value);
  const normalized = rounded.toFixed(decimals);
  for (const form of acceptedForms(spec)) {
    const target = numericValue(form);
    if (target !== null && round(target) === rounded) {
      return { correct: true, normalized };
    }
  }
  return { correct: false, normalized };
}

export function validateFraction(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const value = parseRational(submitted);
  if (!value) {
    return { correct: false, normalized: submitted.trim(), reason: 'not a fraction or number' };
  }
  const normalized = value.den === 1 ? String(value.num) : `${value.num}/${value.den}`;
  for (const form of acceptedForms(spec)) {
    const target = parseRational(form);
    if (target && rationalsEqual(value, target)) {
      return { correct: true, normalized };
    }
  }
  return { correct: false, normalized };
}

/** Normalize "60%", "60 %", "60" to a percent number (60). */
function percentValue(input: string): number | null {
  const s = input.trim().replace(/%$/, '').trim();
  return numericValue(s);
}

export function validatePercentage(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const value = percentValue(submitted);
  if (value === null) {
    return { correct: false, normalized: submitted.trim(), reason: 'not a percentage' };
  }
  const tolerance = spec.tolerance ?? 1e-6;
  const normalized = `${value}%`;
  for (const form of acceptedForms(spec)) {
    const target = percentValue(form);
    if (target !== null && Math.abs(value - target) <= tolerance) {
      return { correct: true, normalized };
    }
  }
  return { correct: false, normalized };
}

/** Length + mass conversion families, expressed in a common base unit. */
const UNIT_FAMILIES: Record<string, Record<string, number>> = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000 },
  mass: { mg: 0.000001, g: 0.001, kg: 1 },
  time: { ms: 0.001, s: 1, min: 60, h: 3600 },
};

function findFamily(unit: string): Record<string, number> | null {
  for (const family of Object.values(UNIT_FAMILIES)) {
    if (unit in family) return family;
  }
  return null;
}

function parseQuantity(input: string): { value: number; unit: string } | null {
  const m = input.trim().match(/^(-?\d+(?:\.\d+)?(?:\/-?\d+)?)\s*([a-zA-Z]+)$/);
  if (!m) return null;
  const value = numericValue(m[1] as string);
  if (value === null) return null;
  return { value, unit: (m[2] as string).toLowerCase() };
}

export function validateUnit(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const submittedQ = parseQuantity(submitted);
  if (!submittedQ) {
    return {
      correct: false,
      normalized: submitted.trim(),
      reason: 'expected a number with a unit',
    };
  }
  const normalized = `${submittedQ.value} ${submittedQ.unit}`;

  const targets = acceptedForms(spec)
    .map(parseQuantity)
    .filter((q): q is { value: number; unit: string } => q !== null);
  const tolerance = spec.tolerance ?? 1e-6;

  for (const target of targets) {
    const family = findFamily(target.unit);
    const submittedFamily = findFamily(submittedQ.unit);
    if (family && submittedFamily && family === submittedFamily) {
      const toBase = (q: { value: number; unit: string }) => q.value * (family[q.unit] as number);
      if (Math.abs(toBase(submittedQ) - toBase(target)) <= tolerance) {
        return { correct: true, normalized };
      }
    } else if (
      submittedQ.unit === target.unit &&
      Math.abs(submittedQ.value - target.value) <= tolerance
    ) {
      return { correct: true, normalized };
    }
  }

  // Distinguish a unit mismatch (right number, wrong unit) for better feedback.
  const numberMatches = targets.some((t) => Math.abs(t.value - submittedQ.value) <= tolerance);
  return {
    correct: false,
    normalized,
    reason: numberMatches ? 'unit mismatch' : undefined,
  };
}

/** Split a `|`-delimited selection/order into trimmed, non-empty parts. */
function parseList(input: string): string[] {
  return input
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim());
  if (typeof value === 'string') return parseList(value);
  return [];
}

/** Multi-select: the chosen set must equal the correct set (order-independent). */
export function validateMultiSelect(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const chosen = parseList(submitted);
  const normalized = [...chosen].sort().join('|');
  if (chosen.length === 0) {
    return { correct: false, normalized, reason: 'nothing selected' };
  }
  const target = toStringArray(spec.correct_answer);
  const setEq =
    chosen.length === target.length &&
    new Set(chosen).size === new Set([...chosen, ...target]).size;
  return { correct: setEq, normalized };
}

/** Ordering: the submitted sequence must match the correct order exactly. */
export function validateOrdering(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const order = parseList(submitted);
  const normalized = order.join('|');
  const target = toStringArray(spec.correct_answer);
  const correct = order.length === target.length && order.every((v, i) => v === target[i]);
  return { correct, normalized };
}

/** Parse an ordered pair like "(3, 4)", "3,4", or "-2, 5" into [x, y]. */
function parsePoint(input: string): [number, number] | null {
  const cleaned = input.trim().replace(/^\(/, '').replace(/\)$/, '');
  const parts = cleaned.split(',').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const x = numericValue(parts[0] as string);
  const y = numericValue(parts[1] as string);
  if (x === null || y === null) return null;
  return [x, y];
}

/** Coordinate point: both coordinates must match (within tolerance). */
export function validatePoint(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const point = parsePoint(submitted);
  if (!point) {
    return {
      correct: false,
      normalized: submitted.trim(),
      reason: 'expected an ordered pair like (x, y)',
    };
  }
  const normalized = `(${point[0]}, ${point[1]})`;
  const tolerance = spec.tolerance ?? DEFAULT_TOLERANCE;
  for (const form of acceptedForms(spec)) {
    const target = parsePoint(form);
    if (
      target &&
      Math.abs(point[0] - target[0]) <= tolerance &&
      Math.abs(point[1] - target[1]) <= tolerance
    ) {
      return { correct: true, normalized };
    }
  }
  return { correct: false, normalized };
}

export function validateExactChoice(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const value = submitted.trim();
  const normalized = value;
  for (const form of acceptedForms(spec)) {
    if (value === form.trim()) return { correct: true, normalized };
  }
  return { correct: false, normalized };
}

/**
 * Exact symbolic value: surds and multiples of pi (Phase 23).
 *
 * An approximation of an irrational value grades wrong rather than raising a
 * format error - 0.866 is a real misconception about what "exact" asks for, so
 * it deserves the normal wrong-answer feedback path. An exact decimal still
 * grades correct, because 0.5 and 1/2 are the same number.
 */
export function validateExactValue(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const raw = submitted.trim();

  if (isUndefinedForm(raw)) {
    return { correct: acceptedForms(spec).some(isUndefinedForm), normalized: 'undefined' };
  }

  const value = parseExactValue(raw);
  if (!value) {
    return {
      correct: false,
      normalized: raw,
      reason: 'expected an exact value such as 1/2, sqrt(3)/2, or pi/6',
    };
  }

  const normalized = formatExactValue(value);
  for (const form of acceptedForms(spec)) {
    if (isUndefinedForm(form)) continue;
    const target = parseExactValue(form);
    if (target && exactValuesEqual(value, target)) return { correct: true, normalized };
  }
  return { correct: false, normalized };
}

const VALIDATORS: Record<
  ValidatorType,
  (submitted: string, spec: AnswerSpec) => ValidationOutcome
> = {
  numeric: validateNumeric,
  decimal: validateDecimal,
  fraction: validateFraction,
  percentage: validatePercentage,
  unit: validateUnit,
  exact_choice: validateExactChoice,
  structured: validateExactChoice,
  multi_select: validateMultiSelect,
  ordering: validateOrdering,
  point: validatePoint,
  exact_value: validateExactValue,
};

export function validateAnswer(
  validator: ValidatorType,
  submitted: string,
  spec: AnswerSpec,
): ValidationOutcome {
  const fn = VALIDATORS[validator];
  if (!fn) {
    return {
      correct: false,
      normalized: submitted.trim(),
      reason: `unknown validator: ${validator}`,
    };
  }
  return fn(submitted, spec);
}
