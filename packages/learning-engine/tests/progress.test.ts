import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@learn/domain';
import { projectProgress } from '../src/index.js';

let seq = 0;
function ev(type: LearningEvent['type'], payload: Record<string, unknown>): LearningEvent {
  seq += 1;
  return {
    event_id: `e${seq}`,
    type,
    learner_id: 'L1',
    created_at: '2026-07-23T00:00:00.000Z',
    seq,
    payload,
  };
}

/** A clean, hard, correct attempt that feeds all four immediate dimensions. */
function strongAttempt(skillId: string): LearningEvent {
  return ev('answer_submitted', {
    question_id: `${skillId}.q`,
    skill_id: skillId,
    submitted_answer: 'x',
    normalized_answer: 'x',
    correct: true,
    attempt_number: 1,
    hints_used: 0,
    difficulty: 5,
    response_time_ms: 1000,
    dimensions: ['understanding'],
    is_transfer: true,
  });
}

function masterSkill(skillId: string, n = 8): LearningEvent[] {
  return Array.from({ length: n }, () => strongAttempt(skillId));
}

describe('progress projection (DEC-006, exit criteria)', () => {
  it('one answer does not create mastery', () => {
    const progress = projectProgress([strongAttempt('math.u.a')]);
    const p = progress.get('math.u.a')!;
    expect(p.state).not.toBe('provisionally_mastered');
    expect(p.state).not.toBe('mastered');
  });

  it('sustained strong practice reaches provisional mastery and schedules a review', () => {
    const progress = projectProgress(masterSkill('math.u.a'));
    const p = progress.get('math.u.a')!;
    expect(p.state).toBe('provisionally_mastered');
    expect(p.next_review_at).not.toBeNull();
    expect(p.review_index).toBe(0);
  });

  it('a single delayed review confirms the delayed-review flag but not full mastery', () => {
    const events = [
      ...masterSkill('math.u.a'),
      ev('review_completed', {
        skill_id: 'math.u.a',
        success: true,
        quality: 1,
        difficulty: 5,
        interval_days_at_review: 7,
        overdue_days: 0,
      }),
    ];
    const p = projectProgress(events).get('math.u.a')!;
    expect(p.delayed_review_confirmed).toBe(true);
    // Retention rises gradually; one review is not enough to cross the threshold.
    expect(p.state).toBe('provisionally_mastered');
    expect(p.review_index).toBe(1); // promoted from 0
  });

  it('repeated successful delayed reviews build retention to full mastery', () => {
    const review = () =>
      ev('review_completed', {
        skill_id: 'math.u.a',
        success: true,
        quality: 1,
        difficulty: 5,
        interval_days_at_review: 7,
        overdue_days: 0,
      });
    const events = [...masterSkill('math.u.a'), ...Array.from({ length: 6 }, review)];
    const p = projectProgress(events).get('math.u.a')!;
    expect(p.scores.retention).toBeGreaterThanOrEqual(75);
    expect(p.state).toBe('mastered');
  });

  it('is reproducible: replaying the same events yields identical progress', () => {
    const events = masterSkill('math.u.a');
    expect(projectProgress(events).get('math.u.a')).toEqual(
      projectProgress(events).get('math.u.a'),
    );
  });

  it('a review failure shortens the interval', () => {
    const events = [
      ...masterSkill('math.u.a'),
      ev('review_completed', {
        skill_id: 'math.u.a',
        success: true,
        quality: 1,
        difficulty: 5,
        interval_days_at_review: 7,
        overdue_days: 0,
      }),
      ev('review_completed', {
        skill_id: 'math.u.a',
        success: false,
        quality: 0,
        difficulty: 5,
        interval_days_at_review: 14,
        overdue_days: 0,
      }),
    ];
    const p = projectProgress(events).get('math.u.a')!;
    // Promoted 0 -> 1, then a failure drops two rungs, floored at 0.
    expect(p.review_index).toBe(0);
  });
});
