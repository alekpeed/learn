import { describe, it, expect } from 'vitest';
import type { LearningEvent } from '@learn/domain';
import { emptySkillProgress } from '@learn/domain';
import { buildGraph } from '@learn/curriculum';
import { selectTodaysSession } from '../src/session.js';
import {
  projectMisconceptions,
  activeMisconceptions,
  skillsNeedingRemediation,
  RECURRENCE_THRESHOLD,
  CLEARING_STREAK,
} from '../src/misconceptions.js';

let seq = 0;
function attempt(
  skillId: string,
  correct: boolean,
  misconceptionId?: string,
  day = ++seq,
): LearningEvent {
  return {
    event_id: `e${day}-${skillId}-${misconceptionId ?? 'none'}`,
    type: 'answer_submitted',
    learner_id: 'l1',
    created_at: `2026-07-${String(day).padStart(2, '0')}T00:00:00.000Z`,
    seq: day,
    payload: {
      skill_id: skillId,
      correct,
      ...(misconceptionId ? { misconception_id: misconceptionId } : {}),
    },
  };
}

const SKILL = 'math.fractions.add_like_denominators';
const MC = 'mc.math.fractions.add_numerators_and_denominators';

/** A minimal valid skill; only the graph shape matters to session selection. */
function skill(id: string) {
  return {
    skill_id: id,
    unit_id: 'u',
    title: id,
    summary: '',
    objectives: [],
    prerequisites: [],
    mastery_thresholds: {
      understanding: 80,
      accuracy: 85,
      independence: 80,
      retention: 75,
      transfer: 70,
    },
    content_version: '0.1.0',
  };
}

describe('misconception projection (Phase 17)', () => {
  it('records a single slip without treating it as a habit', () => {
    const [found] = projectMisconceptions([attempt(SKILL, false, MC, 1)]);
    expect(found?.occurrences).toBe(1);
    expect(found?.recurring).toBe(false);
    expect(found?.active).toBe(false);
  });

  it('treats the same misconception twice as recurring and active', () => {
    const found = projectMisconceptions([
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, false, MC, 2),
    ]);
    expect(found[0]?.occurrences).toBe(RECURRENCE_THRESHOLD);
    expect(found[0]?.recurring).toBe(true);
    expect(found[0]?.active).toBe(true);
    expect(found[0]?.first_seen_at).not.toBe(found[0]?.last_seen_at);
  });

  it('does not clear on a single lucky correct answer', () => {
    const found = projectMisconceptions([
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, false, MC, 2),
      attempt(SKILL, true, undefined, 3),
    ]);
    expect(found[0]?.correct_since).toBe(1);
    expect(found[0]?.resolved).toBe(false);
    expect(found[0]?.active).toBe(true);
  });

  it('clears after a streak of correct answers on the skill', () => {
    const events = [attempt(SKILL, false, MC, 1), attempt(SKILL, false, MC, 2)];
    for (let i = 0; i < CLEARING_STREAK; i += 1) {
      events.push(attempt(SKILL, true, undefined, 3 + i));
    }
    const found = projectMisconceptions(events);
    expect(found[0]?.resolved).toBe(true);
    expect(found[0]?.active).toBe(false);
    expect(activeMisconceptions(events)).toEqual([]);
  });

  it('reopens when the misconception comes back after clearing', () => {
    const found = projectMisconceptions([
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, false, MC, 2),
      attempt(SKILL, true, undefined, 3),
      attempt(SKILL, true, undefined, 4),
      attempt(SKILL, false, MC, 5),
    ]);
    expect(found[0]?.occurrences).toBe(3);
    expect(found[0]?.correct_since).toBe(0);
    expect(found[0]?.active).toBe(true);
  });

  it('keeps the same misconception separate per skill', () => {
    const other = 'math.fractions.subtract_like_denominators';
    const found = projectMisconceptions([
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, false, MC, 2),
      attempt(other, false, MC, 3),
    ]);
    expect(found).toHaveLength(2);
    expect(found.find((m) => m.skill_id === other)?.recurring).toBe(false);
  });

  it('does not let a correct answer on one skill clear another skill', () => {
    const events = [
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, false, MC, 2),
      attempt('math.algebra.equality', true, undefined, 3),
      attempt('math.algebra.equality', true, undefined, 4),
    ];
    expect(projectMisconceptions(events)[0]?.resolved).toBe(false);
  });

  it('ignores attempts recorded before misconceptions were tracked', () => {
    // Wrong answers with no misconception_id (pre-Phase-17 events, or slips the
    // diagnoser could not classify) are not evidence in either direction.
    const events = [attempt(SKILL, false, undefined, 1), attempt(SKILL, false, undefined, 2)];
    expect(projectMisconceptions(events)).toEqual([]);
  });

  it('orders active misconceptions most recently seen first', () => {
    const a = 'mc.math.fractions.bigger_denominator_bigger_fraction';
    const events = [
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, false, MC, 2),
      attempt('math.fractions.comparing_fractions', false, a, 3),
      attempt('math.fractions.comparing_fractions', false, a, 4),
    ];
    expect(activeMisconceptions(events).map((m) => m.misconception_id)).toEqual([a, MC]);
  });

  it('is deterministic: replaying the same log gives the same answer', () => {
    const events = [
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, true, undefined, 2),
      attempt(SKILL, false, MC, 3),
    ];
    expect(projectMisconceptions(events)).toEqual(projectMisconceptions(events));
  });

  it('lists the skills that need remediation', () => {
    const events = [
      attempt(SKILL, false, MC, 1),
      attempt(SKILL, false, MC, 2),
      attempt('math.algebra.equality', false, 'mc.math.algebra.changed_one_side_only', 3),
    ];
    // The algebra slip has only happened once, so it is not yet a habit.
    expect(skillsNeedingRemediation(events)).toEqual([SKILL]);
  });

  it('ignores events that are not attempts', () => {
    const review: LearningEvent = {
      event_id: 'r1',
      type: 'review_completed',
      learner_id: 'l1',
      created_at: '2026-07-01T00:00:00.000Z',
      seq: 99,
      payload: { skill_id: SKILL, success: true },
    };
    expect(projectMisconceptions([review])).toEqual([]);
  });
});

describe('remediation in session selection (Phase 17)', () => {
  it('puts a skill with an active misconception ahead of the frontier', () => {
    const graph = buildGraph([skill(SKILL), skill('math.algebra.equality')]);
    const order = [SKILL, 'math.algebra.equality'];
    const progress = new Map([
      [SKILL, { ...emptySkillProgress(SKILL), state: 'practicing' as const }],
      [
        'math.algebra.equality',
        { ...emptySkillProgress('math.algebra.equality'), state: 'learning' as const },
      ],
    ]);

    const events = [attempt(SKILL, false, MC, 1), attempt(SKILL, false, MC, 2)];
    const session = selectTodaysSession(
      progress,
      graph,
      order,
      '2026-07-23T00:00:00Z',
      projectMisconceptions(events),
    );
    expect(session.remediationSkills).toEqual([SKILL]);
    expect(session.nextSkill).toBe(SKILL);
  });

  it('behaves exactly as before when no projection is passed', () => {
    const graph = buildGraph([skill(SKILL)]);
    const progress = new Map([
      [SKILL, { ...emptySkillProgress(SKILL), state: 'learning' as const }],
    ]);
    const session = selectTodaysSession(progress, graph, [SKILL], '2026-07-23T00:00:00Z');
    expect(session.remediationSkills).toEqual([]);
    expect(session.nextSkill).toBe(SKILL);
  });
});
