/**
 * Deterministic validators (PRC-001..004). Each takes the learner's raw string
 * answer plus the question's answer_spec and returns a ValidationOutcome.
 * Correctness here is authoritative — AI never overrides it (DEC-003).
 */
import type { AnswerSpec, ValidationOutcome, ValidatorType } from './types.js';
import { parseRational, rationalsEqual, rationalToNumber, type Rational } from './rational.js';

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

export function validateExactChoice(submitted: string, spec: AnswerSpec): ValidationOutcome {
  const value = submitted.trim();
  const normalized = value;
  for (const form of acceptedForms(spec)) {
    if (value === form.trim()) return { correct: true, normalized };
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
