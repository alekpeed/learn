/**
 * Exact symbolic values for trigonometry and precalculus (Phase 23).
 *
 * Trig answers are exact surds and multiples of pi - sqrt(3)/2, pi/6, 2sqrt(3)/3 -
 * none of which `parseRational` can represent, so before this module an exact
 * answer had no deterministic validator at all. An ExactValue is
 *
 *     (num / den) * sqrt(radicand) * pi^piExp
 *
 * kept in a canonical form: radicand square-free, no radical left in the
 * denominator, fraction reduced, sign on the numerator. Equality is therefore
 * structural and exact, so 1/sqrt(2), sqrt(2)/2 and sqrt(8)/4 all compare equal
 * with no floating-point tolerance anywhere - which is what doc 06 section 9
 * means by accepting mathematically equivalent forms while preserving exactness.
 *
 * Deliberately NOT supported: mixed numbers (a trig value is never one), nested
 * or non-integer radicands, and sums of unlike terms such as 1 + sqrt(2). Items
 * needing a sum use a different question type.
 */
import { makeRational, parseRational, type Rational } from './rational.js';

export interface ExactValue {
  /** Rational coefficient numerator; carries the sign. */
  num: number;
  /** Rational coefficient denominator; always positive. */
  den: number;
  /** Square-free integer under the radical. 1 means there is no radical. */
  radicand: number;
  /** Power of pi. 0 for an algebraic value, 1 for a radian measure. */
  piExp: number;
}

/**
 * Accepted spellings of "this has no value", so tan 90 can be asked and graded
 * as a genuine exact-value item instead of being forced into multiple choice.
 */
const UNDEFINED_FORMS = ['undefined', 'not defined', 'undefinable', 'dne', 'does not exist'];

export function isUndefinedForm(input: unknown): boolean {
  const s = (typeof input === 'string' ? input : String(input)).trim().toLowerCase();
  return UNDEFINED_FORMS.includes(s.replace(/\s+/g, ' '));
}

interface Group {
  coef: Rational;
  radicand: number;
  piExp: number;
}

/** Parse one side of the fraction bar: an optional integer/decimal times sqrt(k) times pi. */
function parseGroup(raw: string): Group | null {
  let s = raw.replace(/\*/g, '').replace(/\s+/g, '').toLowerCase();
  if (s === '') return null;

  let piExp = 0;
  if (s.includes('pi')) {
    // A single pi factor only; "pipi" is not a value we author.
    if (s.indexOf('pi') !== s.lastIndexOf('pi')) return null;
    s = s.replace('pi', '');
    piExp = 1;
  }

  let radicand = 1;
  const sqrtMatch = s.match(/sqrt\((\d+)\)/);
  if (sqrtMatch) {
    if (s.indexOf('sqrt(') !== s.lastIndexOf('sqrt(')) return null;
    radicand = Number(sqrtMatch[1]);
    s = s.replace(sqrtMatch[0], '');
  }
  // Anything left that looks like notation we did not consume is a parse failure,
  // never a silently ignored factor.
  if (/[a-z(){}[\]^]/.test(s)) return null;

  let coef: Rational | null;
  if (s === '' || s === '+') coef = { num: 1, den: 1 };
  else if (s === '-') coef = { num: -1, den: 1 };
  else coef = parseRational(s);
  if (!coef) return null;

  return { coef, radicand, piExp };
}

const ONE: Group = { coef: { num: 1, den: 1 }, radicand: 1, piExp: 0 };
const ZERO: ExactValue = { num: 0, den: 1, radicand: 1, piExp: 0 };

/**
 * Parse an exact value. Accepts integers and decimals ("3", "-0.5"), fractions
 * ("1/2"), surds ("sqrt(3)", "sqrt(3)/2", "2sqrt(3)/3", "1/sqrt(2)"), and
 * multiples of pi ("pi", "pi/6", "5pi/4", "2pi"). Returns null if the string is
 * not an exact value of that shape.
 */
export function parseExactValue(input: string): ExactValue | null {
  const s = input.trim();
  if (s === '') return null;

  const parts = s.split('/');
  if (parts.length > 2) return null;

  const numerator = parseGroup(parts[0] as string);
  if (!numerator) return null;
  const denominator = parts.length === 2 ? parseGroup(parts[1] as string) : ONE;
  if (!denominator) return null;

  // sqrt(0) and a zero coefficient both make the whole value zero.
  if (numerator.radicand === 0 || numerator.coef.num === 0) return ZERO;
  if (denominator.radicand === 0 || denominator.coef.num === 0) return null;

  // (a/b * sqrt(p)) / (c/d * sqrt(q)) = (a d) / (b c q) * sqrt(p q),
  // which is where the denominator gets rationalized.
  let coefNum = numerator.coef.num * denominator.coef.den;
  const coefDen = numerator.coef.den * denominator.coef.num * denominator.radicand;
  let radicand = numerator.radicand * denominator.radicand;

  for (let f = 2; f * f <= radicand; f += 1) {
    while (radicand % (f * f) === 0) {
      radicand /= f * f;
      coefNum *= f;
    }
  }

  const reduced = makeRational(coefNum, coefDen);
  if (!reduced) return null;

  return {
    num: reduced.num,
    den: reduced.den,
    radicand,
    piExp: numerator.piExp - denominator.piExp,
  };
}

/** Both are canonical, so exact equality is a field-by-field comparison. */
export function exactValuesEqual(a: ExactValue, b: ExactValue): boolean {
  return a.num === b.num && a.den === b.den && a.radicand === b.radicand && a.piExp === b.piExp;
}

/** Canonical text form, stored on the attempt as the normalized answer. */
export function formatExactValue(v: ExactValue): string {
  if (v.num === 0) return '0';
  const abs = Math.abs(v.num);
  const sign = v.num < 0 ? '-' : '';
  const factors: string[] = [];
  if (abs !== 1 || (v.radicand === 1 && v.piExp === 0)) factors.push(String(abs));
  if (v.radicand !== 1) factors.push(`sqrt(${v.radicand})`);
  if (v.piExp === 1) factors.push('pi');
  else if (v.piExp !== 0) factors.push(`pi^${v.piExp}`);
  const top = factors.join('*');
  return v.den === 1 ? `${sign}${top}` : `${sign}${top}/${v.den}`;
}

/** Decimal value, for generator-side cross-checks against Math.sin and friends. */
export function exactValueToNumber(v: ExactValue): number {
  return (v.num / v.den) * Math.sqrt(v.radicand) * Math.PI ** v.piExp;
}
