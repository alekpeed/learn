import { describe, it, expect } from 'vitest';
import { reschedule, initialSchedule, addDays, LADDER_DAYS } from '../src/index.js';

const T0 = '2026-07-23T00:00:00.000Z';

describe('review scheduler (REVIEW_SCHEDULING)', () => {
  it('starts a new skill at a short interval (index 0)', () => {
    const s = initialSchedule(T0);
    expect(s.ladder_index).toBe(0);
    expect(s.next_review_at).toBe(T0);
  });

  it('success promotes one rung and lengthens the interval', () => {
    const s = reschedule(3, true, T0); // 7d -> 14d
    expect(s.ladder_index).toBe(4);
    expect(s.last_interval_days).toBe(14);
    expect(s.next_review_at).toBe(addDays(T0, 14));
  });

  it('failure drops two rungs and shortens the interval', () => {
    const s = reschedule(5, false, T0); // 30d -> 7d
    expect(s.ladder_index).toBe(3);
    expect(s.last_interval_days).toBe(7);
  });

  it('never exceeds the ladder bounds', () => {
    expect(reschedule(6, true, T0).ladder_index).toBe(6);
    expect(reschedule(0, false, T0).ladder_index).toBe(0);
  });

  it('success never shortens and failure never lengthens', () => {
    for (let i = 0; i < LADDER_DAYS.length; i++) {
      const before = LADDER_DAYS[i]!;
      expect(reschedule(i, true, T0).last_interval_days).toBeGreaterThanOrEqual(before);
      expect(reschedule(i, false, T0).last_interval_days).toBeLessThanOrEqual(before);
    }
  });
});
