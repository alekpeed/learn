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
