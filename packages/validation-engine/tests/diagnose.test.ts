import { describe, it, expect } from 'vitest';
import { diagnose } from '../src/index.js';

describe('error diagnosis (PRC-007)', () => {
  it('maps a declared common wrong answer to its misconception', () => {
    const out = diagnose({
      validator: 'fraction',
      submitted: '3/10',
      answer_spec: { correct_answer: '3/5' },
      common_wrong_answers: [
        { value: '3/10', misconception_id: 'mc.math.fractions.add_denominators' },
      ],
    });
    expect(out.category).toBe('conceptual_misunderstanding');
    expect(out.misconception_id).toBe('mc.math.fractions.add_denominators');
  });

  it('detects a sign error', () => {
    const out = diagnose({
      validator: 'numeric',
      submitted: '-5',
      answer_spec: { correct_answer: 5 },
    });
    expect(out.category).toBe('sign_error');
  });

  it('detects a place-value error', () => {
    const out = diagnose({
      validator: 'numeric',
      submitted: '400',
      answer_spec: { correct_answer: 40 },
    });
    expect(out.category).toBe('place_value_error');
  });

  it('detects a near-miss arithmetic error', () => {
    const out = diagnose({
      validator: 'numeric',
      submitted: '41',
      answer_spec: { correct_answer: 40 },
    });
    expect(out.category).toBe('arithmetic_error');
  });

  it('flags invalid format', () => {
    const out = diagnose({
      validator: 'numeric',
      submitted: 'cat',
      answer_spec: { correct_answer: 40 },
      reason: 'not a number',
    });
    expect(out.category).toBe('invalid_format');
  });

  it('flags a unit error', () => {
    const out = diagnose({
      validator: 'unit',
      submitted: '40 kg',
      answer_spec: { correct_answer: '40 cm' },
      reason: 'unit mismatch',
    });
    expect(out.category).toBe('unit_error');
  });

  it('falls back to unclassified', () => {
    const out = diagnose({
      validator: 'numeric',
      submitted: '999',
      answer_spec: { correct_answer: 40 },
    });
    expect(out.category).toBe('unclassified');
  });
});
