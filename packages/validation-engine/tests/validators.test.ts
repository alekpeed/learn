import { describe, it, expect } from 'vitest';
import {
  validateAnswer,
  validateNumeric,
  validateFraction,
  validatePercentage,
  validateDecimal,
  validateUnit,
  parseRational,
  rationalsEqual,
  parseExactValue,
  exactValuesEqual,
  formatExactValue,
  exactValueToNumber,
} from '../src/index.js';

describe('rational parsing', () => {
  it('parses integers, fractions, decimals, and mixed numbers', () => {
    expect(parseRational('3')).toEqual({ num: 3, den: 1 });
    expect(parseRational('6/10')).toEqual({ num: 3, den: 5 });
    expect(parseRational('0.6')).toEqual({ num: 3, den: 5 });
    expect(parseRational('1 1/2')).toEqual({ num: 3, den: 2 });
    expect(parseRational('-2/4')).toEqual({ num: -1, den: 2 });
    expect(parseRational('abc')).toBeNull();
  });

  it('treats equivalent fractions as equal', () => {
    expect(rationalsEqual(parseRational('3/5')!, parseRational('6/10')!)).toBe(true);
    expect(rationalsEqual(parseRational('3/5')!, parseRational('0.6')!)).toBe(true);
  });
});

describe('numeric validator', () => {
  it('accepts equal values in different forms', () => {
    const spec = { correct_answer: 40 };
    expect(validateNumeric('40', spec).correct).toBe(true);
    expect(validateNumeric('40.0', spec).correct).toBe(true);
    expect(validateNumeric('41', spec).correct).toBe(false);
  });

  it('respects tolerance', () => {
    const spec = { correct_answer: 3.14, tolerance: 0.01 };
    expect(validateNumeric('3.15', spec).correct).toBe(true);
    expect(validateNumeric('3.2', spec).correct).toBe(false);
  });

  it('reports non-numbers', () => {
    expect(validateNumeric('cat', { correct_answer: 1 }).reason).toBe('not a number');
  });
});

describe('fraction validator (PRC-002 equivalence)', () => {
  const spec = { correct_answer: '3/5' };
  it('accepts equivalent fractions and decimals', () => {
    expect(validateFraction('3/5', spec).correct).toBe(true);
    expect(validateFraction('6/10', spec).correct).toBe(true);
    expect(validateFraction('0.6', spec).correct).toBe(true);
  });
  it('rejects non-equivalent answers and normalizes', () => {
    const out = validateFraction('2/5', spec);
    expect(out.correct).toBe(false);
    expect(out.normalized).toBe('2/5');
  });
});

describe('percentage validator (PRC-003)', () => {
  const spec = { correct_answer: '60%' };
  it('accepts 60, 60%, and spaced forms', () => {
    expect(validatePercentage('60', spec).correct).toBe(true);
    expect(validatePercentage('60%', spec).correct).toBe(true);
    expect(validatePercentage('60 %', spec).correct).toBe(true);
    expect(validatePercentage('50%', spec).correct).toBe(false);
  });
});

describe('decimal validator with rounding (PRC-003)', () => {
  const spec = { correct_answer: 0.33, rounding: { decimals: 2 } };
  it('rounds before comparing', () => {
    expect(validateDecimal('0.333', spec).correct).toBe(true);
    expect(validateDecimal('0.33', spec).correct).toBe(true);
    expect(validateDecimal('0.34', spec).correct).toBe(false);
  });
});

describe('unit validator (PRC-004)', () => {
  it('accepts equivalent units within a family', () => {
    const spec = { correct_answer: '1 m' };
    expect(validateUnit('100 cm', spec).correct).toBe(true);
    expect(validateUnit('1000 mm', spec).correct).toBe(true);
    expect(validateUnit('1 m', spec).correct).toBe(true);
  });
  it('flags a right number with the wrong unit', () => {
    const out = validateUnit('40 kg', { correct_answer: '40 cm' });
    expect(out.correct).toBe(false);
    expect(out.reason).toBe('unit mismatch');
  });
  it('requires a unit', () => {
    expect(validateUnit('40', { correct_answer: '40 cm' }).reason).toBe(
      'expected a number with a unit',
    );
  });
});

describe('multi-select validator', () => {
  const spec = { correct_answer: ['meter', 'kilogram', 'second'] };
  it('accepts the correct set regardless of order', () => {
    expect(validateAnswer('multi_select', 'second|meter|kilogram', spec).correct).toBe(true);
  });
  it('rejects a wrong or incomplete set', () => {
    expect(validateAnswer('multi_select', 'meter|kilogram', spec).correct).toBe(false);
    expect(validateAnswer('multi_select', 'meter|kilogram|foot', spec).correct).toBe(false);
    expect(validateAnswer('multi_select', '', spec).reason).toBe('nothing selected');
  });
});

describe('ordering validator', () => {
  const spec = { correct_answer: ['observe', 'question', 'hypothesize', 'test'] };
  it('accepts the exact order', () => {
    expect(validateAnswer('ordering', 'observe|question|hypothesize|test', spec).correct).toBe(
      true,
    );
  });
  it('rejects a wrong order', () => {
    expect(validateAnswer('ordering', 'question|observe|hypothesize|test', spec).correct).toBe(
      false,
    );
  });
});

describe('point validator', () => {
  const spec = { correct_answer: '(3, 4)' };
  it('accepts the matching ordered pair in several formats', () => {
    expect(validateAnswer('point', '(3, 4)', spec).correct).toBe(true);
    expect(validateAnswer('point', '3,4', spec).correct).toBe(true);
    expect(validateAnswer('point', '3, 4', spec).correct).toBe(true);
  });
  it('accepts negative and zero coordinates', () => {
    expect(validateAnswer('point', '(-2, 5)', { correct_answer: '(-2, 5)' }).correct).toBe(true);
    expect(validateAnswer('point', '(0, 0)', { correct_answer: '(0,0)' }).correct).toBe(true);
  });
  it('rejects a swapped or wrong pair', () => {
    expect(validateAnswer('point', '(4, 3)', spec).correct).toBe(false);
    expect(validateAnswer('point', '(3, 5)', spec).correct).toBe(false);
  });
  it('reports a bad format', () => {
    expect(validateAnswer('point', '3', spec).reason).toMatch(/ordered pair/);
  });
});

describe('dispatch + exact choice', () => {
  it('routes by validator type', () => {
    expect(validateAnswer('exact_choice', '>', { correct_answer: '>' }).correct).toBe(true);
    expect(validateAnswer('exact_choice', '<', { correct_answer: '>' }).correct).toBe(false);
  });
  it('reports unknown validators without throwing', () => {
    const out = validateAnswer('mystery' as never, 'x', { correct_answer: 'x' });
    expect(out.correct).toBe(false);
    expect(out.reason).toMatch(/unknown validator/);
  });
});

describe('exact value parsing (surds and pi)', () => {
  it('parses integers, fractions and decimals', () => {
    expect(parseExactValue('3')).toEqual({ num: 3, den: 1, radicand: 1, piExp: 0 });
    expect(parseExactValue('-1')).toEqual({ num: -1, den: 1, radicand: 1, piExp: 0 });
    expect(parseExactValue('1/2')).toEqual({ num: 1, den: 2, radicand: 1, piExp: 0 });
    expect(parseExactValue('0.5')).toEqual({ num: 1, den: 2, radicand: 1, piExp: 0 });
  });

  it('collapses every zero form to one canonical zero', () => {
    const zero = { num: 0, den: 1, radicand: 1, piExp: 0 };
    expect(parseExactValue('0')).toEqual(zero);
    expect(parseExactValue('0/5')).toEqual(zero);
    expect(parseExactValue('sqrt(0)')).toEqual(zero);
    expect(parseExactValue('0pi')).toEqual(zero);
  });

  it('makes the radicand square-free', () => {
    expect(parseExactValue('sqrt(8)')).toEqual({ num: 2, den: 1, radicand: 2, piExp: 0 });
    expect(parseExactValue('sqrt(12)')).toEqual({ num: 2, den: 1, radicand: 3, piExp: 0 });
    expect(parseExactValue('sqrt(4)')).toEqual({ num: 2, den: 1, radicand: 1, piExp: 0 });
  });

  it('rationalizes a radical in the denominator', () => {
    expect(parseExactValue('1/sqrt(2)')).toEqual(parseExactValue('sqrt(2)/2'));
    expect(parseExactValue('2/sqrt(3)')).toEqual(parseExactValue('2sqrt(3)/3'));
    expect(parseExactValue('1/sqrt(3)')).toEqual(parseExactValue('sqrt(3)/3'));
  });

  it('parses multiples of pi and reduces them', () => {
    expect(parseExactValue('pi')).toEqual({ num: 1, den: 1, radicand: 1, piExp: 1 });
    expect(parseExactValue('pi/6')).toEqual({ num: 1, den: 6, radicand: 1, piExp: 1 });
    expect(parseExactValue('4pi/6')).toEqual(parseExactValue('2pi/3'));
    expect(parseExactValue('-pi/2')).toEqual({ num: -1, den: 2, radicand: 1, piExp: 1 });
  });

  it('accepts optional whitespace and explicit multiplication', () => {
    expect(parseExactValue(' 2 * sqrt(3) / 3 ')).toEqual(parseExactValue('2sqrt(3)/3'));
    expect(parseExactValue('5 pi / 4')).toEqual(parseExactValue('5pi/4'));
  });

  it('rejects notation it cannot represent exactly', () => {
    expect(parseExactValue('sqrt(-1)')).toBeNull();
    expect(parseExactValue('sqrt(2)+1')).toBeNull();
    expect(parseExactValue('1/0')).toBeNull();
    expect(parseExactValue('x')).toBeNull();
    expect(parseExactValue('1/2/3')).toBeNull();
    expect(parseExactValue('')).toBeNull();
    expect(parseExactValue('sqrt2')).toBeNull();
  });

  it('keeps pi and a surd distinct from each other', () => {
    expect(exactValuesEqual(parseExactValue('pi/6')!, parseExactValue('1/6')!)).toBe(false);
    expect(exactValuesEqual(parseExactValue('sqrt(3)/2')!, parseExactValue('3/2')!)).toBe(false);
  });

  it('formats canonically', () => {
    expect(formatExactValue(parseExactValue('1/sqrt(2)')!)).toBe('sqrt(2)/2');
    expect(formatExactValue(parseExactValue('4pi/6')!)).toBe('2*pi/3');
    expect(formatExactValue(parseExactValue('sqrt(4)')!)).toBe('2');
    expect(formatExactValue(parseExactValue('0/9')!)).toBe('0');
    expect(formatExactValue(parseExactValue('-1')!)).toBe('-1');
  });

  it('agrees with floating point on the values trig actually uses', () => {
    const cases: Array<[string, number]> = [
      ['sqrt(3)/2', Math.sin((60 * Math.PI) / 180)],
      ['sqrt(2)/2', Math.sin((45 * Math.PI) / 180)],
      ['1/2', Math.sin((30 * Math.PI) / 180)],
      ['sqrt(3)', Math.tan((60 * Math.PI) / 180)],
      ['sqrt(3)/3', Math.tan((30 * Math.PI) / 180)],
      ['pi/6', (30 * Math.PI) / 180],
      ['5pi/4', (225 * Math.PI) / 180],
    ];
    for (const [text, expected] of cases) {
      expect(exactValueToNumber(parseExactValue(text)!)).toBeCloseTo(expected, 12);
    }
  });
});

describe('exact value validator', () => {
  it('accepts every equivalent exact form of the same value', () => {
    const spec = { correct_answer: 'sqrt(2)/2' };
    for (const form of ['sqrt(2)/2', '1/sqrt(2)', 'sqrt(8)/4', ' sqrt(2) / 2 ']) {
      expect(validateAnswer('exact_value', form, spec).correct).toBe(true);
    }
  });

  it('accepts an exact decimal but rejects an approximation of a surd', () => {
    expect(validateAnswer('exact_value', '0.5', { correct_answer: '1/2' }).correct).toBe(true);
    const approx = validateAnswer('exact_value', '0.866', { correct_answer: 'sqrt(3)/2' });
    expect(approx.correct).toBe(false);
    // Wrong, not unparseable: it takes the normal wrong-answer path.
    expect(approx.reason).toBeUndefined();
  });

  it('grades radian answers', () => {
    const spec = { correct_answer: 'pi/6' };
    expect(validateAnswer('exact_value', 'pi/6', spec).correct).toBe(true);
    expect(validateAnswer('exact_value', '2pi/12', spec).correct).toBe(true);
    expect(validateAnswer('exact_value', 'pi/3', spec).correct).toBe(false);
    expect(validateAnswer('exact_value', '30', spec).correct).toBe(false);
  });

  it('grades undefined, so tan 90 can be asked directly', () => {
    const spec = { correct_answer: 'undefined' };
    expect(validateAnswer('exact_value', 'undefined', spec).correct).toBe(true);
    expect(validateAnswer('exact_value', 'not defined', spec).correct).toBe(true);
    expect(validateAnswer('exact_value', 'DNE', spec).correct).toBe(true);
    expect(validateAnswer('exact_value', '0', spec).correct).toBe(false);
    // And a defined answer is not satisfied by claiming it is undefined.
    expect(validateAnswer('exact_value', 'undefined', { correct_answer: '1/2' }).correct).toBe(
      false,
    );
  });

  it('honours accepted_equivalents', () => {
    const spec = { correct_answer: 'sqrt(3)/3', accepted_equivalents: ['1/sqrt(3)'] };
    expect(validateAnswer('exact_value', '1/sqrt(3)', spec).correct).toBe(true);
  });

  it('explains an unparseable answer instead of marking it wrong silently', () => {
    const out = validateAnswer('exact_value', 'about a half', { correct_answer: '1/2' });
    expect(out.correct).toBe(false);
    expect(out.reason).toMatch(/exact value/);
  });

  it('normalizes the stored answer', () => {
    expect(
      validateAnswer('exact_value', '1/sqrt(2)', { correct_answer: 'sqrt(2)/2' }).normalized,
    ).toBe('sqrt(2)/2');
  });
});
