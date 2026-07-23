import { describe, it, expect } from 'vitest';
import { emptyMasteryScores, DEFAULT_MASTERY_THRESHOLDS } from '@learn/domain';
import {
  scoreAttempt,
  updateRetention,
  quality,
  hintFactor,
  attemptFactor,
  meetsAllThresholds,
  type AttemptEvidence,
} from '../src/index.js';

function attempt(over: Partial<AttemptEvidence> = {}): AttemptEvidence {
  return {
    correct: true,
    difficulty: 3,
    hints_used: 0,
    attempt_number: 1,
    dimensions: ['accuracy'],
    is_transfer: false,
    ...over,
  };
}

describe('quality factors (MASTERY_SCORING §3)', () => {
  it('is 1 only for a first-try, hint-free correct answer', () => {
    expect(quality({ correct: true, hints_used: 0, attempt_number: 1 })).toBe(1);
    expect(quality({ correct: false, hints_used: 0, attempt_number: 1 })).toBe(0);
    expect(hintFactor(6)).toBeCloseTo(0.1, 5);
    expect(attemptFactor(5)).toBe(0);
  });
});

describe('one correct answer cannot create mastery (exit criterion)', () => {
  it('a single perfect d3 answer leaves accuracy far below threshold', () => {
    const scores = scoreAttempt(emptyMasteryScores(), attempt({ difficulty: 3 }));
    expect(scores.accuracy).toBe(19); // 0.25 * 76
    expect(scores.accuracy).toBeLessThan(DEFAULT_MASTERY_THRESHOLDS.accuracy);
    expect(meetsAllThresholds(scores, DEFAULT_MASTERY_THRESHOLDS)).toBe(false);
  });

  it('only-easy practice cannot reach the accuracy threshold', () => {
    let scores = emptyMasteryScores();
    for (let i = 0; i < 50; i++) scores = scoreAttempt(scores, attempt({ difficulty: 1 }));
    // Ceiling for d1 is 52; accuracy asymptotes there, below the 85 threshold.
    expect(scores.accuracy).toBeLessThanOrEqual(52);
    expect(scores.accuracy).toBeLessThan(DEFAULT_MASTERY_THRESHOLDS.accuracy);
  });
});

describe('hints reduce independence evidence', () => {
  it('a hinted correct answer raises independence less than a clean one', () => {
    const clean = scoreAttempt(emptyMasteryScores(), attempt({ hints_used: 0 }));
    const hinted = scoreAttempt(emptyMasteryScores(), attempt({ hints_used: 3 }));
    expect(hinted.independence).toBeLessThan(clean.independence);
  });
});

describe('failure lowers scores', () => {
  it('an incorrect answer reduces accuracy', () => {
    const start = { ...emptyMasteryScores(), accuracy: 50 };
    const after = scoreAttempt(start, attempt({ correct: false, difficulty: 2 }));
    expect(after.accuracy).toBeLessThan(50);
  });
});

describe('retention (delayed review)', () => {
  it('successful delayed recall raises retention; failure lowers it', () => {
    const start = { ...emptyMasteryScores(), retention: 40 };
    const up = updateRetention(start, {
      success: true,
      quality: 1,
      difficulty: 4,
      interval_days_at_review: 7,
      overdue_days: 0,
    });
    expect(up.retention).toBeGreaterThan(40);

    const down = updateRetention(start, {
      success: false,
      quality: 0,
      difficulty: 4,
      interval_days_at_review: 7,
      overdue_days: 3,
    });
    expect(down.retention).toBeLessThan(40);
  });
});
