/**
 * Exact rational arithmetic for equivalence checking (PRC-002/003).
 * Avoids floating-point error so 3/5, 6/10 and 0.6 compare equal.
 */
export interface Rational {
  num: number;
  den: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a === 0 ? 1 : a;
}

export function makeRational(num: number, den: number): Rational | null {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  if (!Number.isInteger(num) || !Number.isInteger(den)) return null;
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return { num: (sign * num) / g, den: Math.abs(den) / g };
}

/**
 * Parse a string into a Rational. Accepts:
 *  - integers: "3", "-4"
 *  - fractions: "3/5", "-2/4", "6 / 10"
 *  - mixed numbers: "1 1/2"
 *  - terminating decimals: "0.6", "-2.25"
 * Returns null if the string is not a valid number.
 */
export function parseRational(input: string): Rational | null {
  const s = input.trim();
  if (s === '') return null;

  // Mixed number: "1 1/2"
  const mixed = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const n = Number(mixed[2]);
    const d = Number(mixed[3]);
    if (d === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return makeRational(sign * (Math.abs(whole) * d + n), d);
  }

  // Fraction: "a/b"
  const frac = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (frac) {
    return makeRational(Number(frac[1]), Number(frac[2]));
  }

  // Decimal or integer
  const dec = s.match(/^-?\d+(\.\d+)?$/);
  if (dec) {
    if (s.includes('.')) {
      const [whole, fraction = ''] = s.replace('-', '').split('.');
      const denom = 10 ** fraction.length;
      const numer = Number(`${whole}${fraction}`);
      return makeRational((s.startsWith('-') ? -1 : 1) * numer, denom);
    }
    return makeRational(Number(s), 1);
  }

  return null;
}

export function rationalsEqual(a: Rational, b: Rational): boolean {
  // Cross-multiply; both are already normalized so this is exact.
  return a.num * b.den === b.num * a.den;
}

export function rationalToNumber(r: Rational): number {
  return r.num / r.den;
}
