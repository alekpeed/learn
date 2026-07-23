import { describe, it, expect } from 'vitest';
import {
  SKILL_STATES,
  isSkillState,
  MASTERY_DIMENSIONS,
  clampScore,
  emptyMasteryScores,
  DEFAULT_MASTERY_THRESHOLDS,
  isLearningEventType,
  AppError,
  toAppError,
} from '../src/index.js';

describe('skill state', () => {
  it('has the eight spec states', () => {
    expect(SKILL_STATES).toHaveLength(8);
    expect(isSkillState('mastered')).toBe(true);
    expect(isSkillState('nonsense')).toBe(false);
  });
});

describe('mastery', () => {
  it('defines five dimensions with default thresholds', () => {
    expect(MASTERY_DIMENSIONS).toHaveLength(5);
    expect(DEFAULT_MASTERY_THRESHOLDS.accuracy).toBe(85);
    expect(emptyMasteryScores().transfer).toBe(0);
  });

  it('clamps scores into [0,100]', () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(42)).toBe(42);
    expect(clampScore(Number.NaN)).toBe(0);
  });
});

describe('events', () => {
  it('recognizes known event types', () => {
    expect(isLearningEventType('answer_submitted')).toBe(true);
    expect(isLearningEventType('made_up')).toBe(false);
  });
});

describe('errors', () => {
  it('wraps unknown errors without losing category', () => {
    const err = toAppError(new Error('boom'));
    expect(err).toBeInstanceOf(AppError);
    expect(err.category).toBe('unexpected');
    expect(err.userMessage).toMatch(/progress has been saved/i);
  });

  it('passes AppError through unchanged', () => {
    const original = new AppError({ category: 'not_found', userMessage: 'Missing' });
    expect(toAppError(original)).toBe(original);
  });
});
