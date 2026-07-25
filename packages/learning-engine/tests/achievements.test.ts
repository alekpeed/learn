import { describe, it, expect } from 'vitest';
import type { LearningEvent, SkillProgress } from '@learn/domain';
import { emptySkillProgress } from '@learn/domain';
import { projectAchievements, earnedCount, type AchievementInput } from '../src/index.js';

let seq = 0;

function answer(
  skillId: string,
  correct: boolean,
  day: string,
  extra: Record<string, unknown> = {},
): LearningEvent {
  seq += 1;
  return {
    event_id: `e${seq}`,
    type: 'answer_submitted',
    learner_id: 'L1',
    created_at: `${day}T10:00:00.000Z`,
    seq,
    payload: {
      question_id: `${skillId}.q${seq}`,
      skill_id: skillId,
      submitted_answer: 'x',
      normalized_answer: 'x',
      correct,
      attempt_number: 1,
      hints_used: 0,
      ...extra,
    },
  };
}

function mastered(skillId: string, day: string): LearningEvent {
  seq += 1;
  return {
    event_id: `e${seq}`,
    type: 'skill_state_changed',
    learner_id: 'L1',
    created_at: `${day}T12:00:00.000Z`,
    seq,
    payload: { skill_id: skillId, from: 'practicing', to: 'mastered', reason: 'test' },
  };
}

function input(events: LearningEvent[], over: Partial<AchievementInput> = {}): AchievementInput {
  return { events, progress: [], nowIso: '2026-07-25T12:00:00.000Z', ...over };
}

function byId(list: ReturnType<typeof projectAchievements>, id: string) {
  const found = list.find((a) => a.id === id);
  if (!found) throw new Error(`no achievement ${id}`);
  return found;
}

describe('achievements are a projection (Phase 25)', () => {
  it('earns nothing from an empty log', () => {
    const out = projectAchievements(input([]));
    expect(earnedCount(out)).toBe(0);
    expect(out.every((a) => a.progress === 0)).toBe(true);
  });

  it('earns the first correct answer and records when', () => {
    const events = [
      answer('math.a.b', false, '2026-07-20'),
      answer('math.a.b', true, '2026-07-21'),
    ];
    const first = byId(projectAchievements(input(events)), 'first_correct');
    expect(first.earned).toBe(true);
    expect(first.earned_at).toBe('2026-07-21T10:00:00.000Z');
  });

  it('reports partial progress toward a count', () => {
    const events = Array.from({ length: 10 }, () => answer('math.a.b', true, '2026-07-21'));
    const a = byId(projectAchievements(input(events)), 'twenty_five_correct');
    expect(a.earned).toBe(false);
    expect(a.current).toBe(10);
    expect(a.target).toBe(25);
    expect(a.progress).toBeCloseTo(0.4);
  });

  it('dates a count-based badge to the qualifying answer, not the latest one', () => {
    const events = [
      ...Array.from({ length: 24 }, () => answer('math.a.b', true, '2026-07-20')),
      answer('math.a.b', true, '2026-07-21'), // the 25th
      answer('math.a.b', true, '2026-07-22'), // later, must not move the date
    ];
    const a = byId(projectAchievements(input(events)), 'twenty_five_correct');
    expect(a.earned).toBe(true);
    expect(a.earned_at).toBe('2026-07-21T10:00:00.000Z');
  });

  it('counts the first mastery of each skill only once', () => {
    const events = [
      mastered('math.a.one', '2026-07-20'),
      mastered('math.a.one', '2026-07-21'), // re-entering mastery must not double count
      mastered('math.a.two', '2026-07-22'),
    ];
    const out = projectAchievements(input(events));
    expect(byId(out, 'first_mastered').earned).toBe(true);
    expect(byId(out, 'ten_mastered').current).toBe(2);
  });

  it('only counts unaided answers for the independence badge', () => {
    const withHints = Array.from({ length: 10 }, () =>
      answer('math.a.b', true, '2026-07-21', { hints_used: 2 }),
    );
    const secondAttempt = Array.from({ length: 10 }, () =>
      answer('math.a.b', true, '2026-07-21', { attempt_number: 2 }),
    );
    expect(byId(projectAchievements(input(withHints)), 'unaided').current).toBe(0);
    expect(byId(projectAchievements(input(secondAttempt)), 'unaided').current).toBe(0);

    const clean = Array.from({ length: 10 }, () => answer('math.a.b', true, '2026-07-21'));
    expect(byId(projectAchievements(input(clean)), 'unaided').earned).toBe(true);
  });

  it('counts consecutive days for a streak', () => {
    const events = [
      answer('math.a.b', true, '2026-07-23'),
      answer('math.a.b', true, '2026-07-24'),
      answer('math.a.b', true, '2026-07-25'),
    ];
    const out = projectAchievements(input(events));
    expect(byId(out, 'streak_3').earned).toBe(true);
    expect(byId(out, 'streak_7').earned).toBe(false);
  });

  it('does not count a broken run as a streak', () => {
    const events = [
      answer('math.a.b', true, '2026-07-20'),
      answer('math.a.b', true, '2026-07-21'),
      // 22nd and 23rd missed
      answer('math.a.b', true, '2026-07-24'),
      answer('math.a.b', true, '2026-07-25'),
    ];
    expect(byId(projectAchievements(input(events)), 'streak_3').earned).toBe(false);
  });

  it('counts distinct subjects, not distinct skills', () => {
    const sameSubject = [
      answer('math.a.one', true, '2026-07-21'),
      answer('math.b.two', true, '2026-07-21'),
      answer('math.c.three', true, '2026-07-21'),
    ];
    expect(byId(projectAchievements(input(sameSubject)), 'three_subjects').current).toBe(1);

    const across = [
      answer('math.a.one', true, '2026-07-21'),
      answer('science.a.one', true, '2026-07-21'),
      answer('physics.a.one', true, '2026-07-21'),
    ];
    expect(byId(projectAchievements(input(across)), 'three_subjects').earned).toBe(true);
  });

  it('earns unit completion only when every skill in the unit is mastered', () => {
    const unitBySkill = new Map([
      ['math.u.one', 'math.u'],
      ['math.u.two', 'math.u'],
    ]);
    const partial: SkillProgress[] = [{ ...emptySkillProgress('math.u.one'), state: 'mastered' }];
    expect(
      byId(projectAchievements(input([], { progress: partial, unitBySkill })), 'unit_complete')
        .earned,
    ).toBe(false);

    const full: SkillProgress[] = [
      { ...emptySkillProgress('math.u.one'), state: 'mastered' },
      { ...emptySkillProgress('math.u.two'), state: 'provisionally_mastered' },
    ];
    expect(
      byId(projectAchievements(input([], { progress: full, unitBySkill })), 'unit_complete').earned,
    ).toBe(true);
  });

  it('earns a cleared misconception after two correct answers on that skill', () => {
    const events = [
      answer('math.a.b', false, '2026-07-20', { misconception_id: 'mc.x' }),
      answer('math.a.b', false, '2026-07-20', { misconception_id: 'mc.x' }),
      answer('math.a.b', true, '2026-07-21'),
      answer('math.a.b', true, '2026-07-21'),
    ];
    expect(byId(projectAchievements(input(events)), 'misconception_cleared').earned).toBe(true);
  });

  it('does not clear a misconception that only occurred once', () => {
    const events = [
      answer('math.a.b', false, '2026-07-20', { misconception_id: 'mc.x' }),
      answer('math.a.b', true, '2026-07-21'),
      answer('math.a.b', true, '2026-07-21'),
    ];
    expect(byId(projectAchievements(input(events)), 'misconception_cleared').earned).toBe(false);
  });

  it('is reproducible: replaying the same log gives an identical result', () => {
    const events = [
      answer('math.a.b', true, '2026-07-24'),
      answer('science.a.b', true, '2026-07-25'),
      mastered('math.a.b', '2026-07-25'),
    ];
    const first = projectAchievements(input(events));
    const again = projectAchievements(input([...events].reverse()));
    expect(again).toEqual(first);
  });

  it('lists earned achievements before unearned ones', () => {
    const events = [answer('math.a.b', true, '2026-07-25')];
    const out = projectAchievements(input(events));
    const firstUnearned = out.findIndex((a) => !a.earned);
    const lastEarned = out.map((a) => a.earned).lastIndexOf(true);
    expect(lastEarned).toBeLessThan(firstUnearned);
  });
});
