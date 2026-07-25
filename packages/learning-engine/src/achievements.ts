/**
 * Achievements (Phase 25, gamification tier).
 *
 * Deliberately a projection, not a new kind of state. Every achievement is
 * recomputed by folding the existing event log and the existing SkillProgress
 * projection, so nothing here is written, nothing can drift out of sync, and a
 * progress export carries achievements implicitly by carrying the events that
 * earned them (DEC-006). Replaying the same log always yields the same badges,
 * in the same order, with the same earned-at timestamps.
 *
 * The spec excludes competitive leaderboards from the MVP (doc 03), and nothing
 * here compares one learner with another: every rule measures a learner against
 * their own history.
 */
import type { LearningEvent, SkillProgress, AnswerSubmittedPayload } from '@learn/domain';
import { currentStreak } from './activity.js';

export interface Achievement {
  id: string;
  title: string;
  /** What earns it, phrased for the learner. */
  description: string;
  earned: boolean;
  /** Progress toward earning it, 0..1. Always 1 once earned. */
  progress: number;
  /** How far along the learner is, for a "3 of 10" style label. */
  current: number;
  target: number;
  /** ISO timestamp of the event that earned it, when one can be identified. */
  earned_at?: string;
}

interface Rule {
  id: string;
  title: string;
  description: string;
  target: number;
  /**
   * Timestamps of the qualifying moments, oldest first. The rule is earned once
   * there are `target` of them, and earned_at is the target-th.
   */
  moments: (input: AchievementInput) => string[];
}

export interface AchievementInput {
  events: LearningEvent[];
  progress: SkillProgress[];
  /** Now, as an ISO string, so streak rules stay pure and replayable. */
  nowIso: string;
  /** skill_id -> unit_id, so unit-completion can be checked. Optional. */
  unitBySkill?: Map<string, string>;
}

function ordered(events: LearningEvent[]): LearningEvent[] {
  return [...events].sort((a, b) =>
    a.created_at === b.created_at ? a.seq - b.seq : a.created_at < b.created_at ? -1 : 1,
  );
}

function correctAnswers(events: LearningEvent[]): LearningEvent[] {
  return ordered(events).filter(
    (e) => e.type === 'answer_submitted' && (e.payload as AnswerSubmittedPayload).correct === true,
  );
}

/** Timestamps at which each skill first reached a mastered state, oldest first. */
function masteryMoments(events: LearningEvent[]): string[] {
  const seen = new Set<string>();
  const moments: string[] = [];
  for (const e of ordered(events)) {
    if (e.type !== 'skill_state_changed') continue;
    const p = e.payload as { skill_id?: string; to?: string };
    if (!p.skill_id || seen.has(p.skill_id)) continue;
    if (p.to === 'mastered' || p.to === 'provisionally_mastered') {
      seen.add(p.skill_id);
      moments.push(e.created_at);
    }
  }
  return moments;
}

/**
 * A streak is a property of today rather than of any single past event, so it
 * cannot name the moment it was earned. It reports as earned with no timestamp.
 */
function streakMoments(input: AchievementInput, days: number): string[] {
  const streak = currentStreak(input.events, input.nowIso);
  return streak >= days ? Array(days).fill(input.nowIso) : Array(Math.max(0, streak)).fill('');
}

const RULES: Rule[] = [
  {
    id: 'first_correct',
    title: 'First answer right',
    description: 'Answer one question correctly.',
    target: 1,
    moments: (i) => correctAnswers(i.events).map((e) => e.created_at),
  },
  {
    id: 'twenty_five_correct',
    title: 'Twenty-five right',
    description: 'Answer 25 questions correctly.',
    target: 25,
    moments: (i) => correctAnswers(i.events).map((e) => e.created_at),
  },
  {
    id: 'hundred_correct',
    title: 'A hundred right',
    description: 'Answer 100 questions correctly.',
    target: 100,
    moments: (i) => correctAnswers(i.events).map((e) => e.created_at),
  },
  {
    id: 'unaided',
    title: 'On your own',
    description: 'Answer 10 questions correctly at the first attempt without a hint.',
    target: 10,
    moments: (i) =>
      correctAnswers(i.events)
        .filter((e) => {
          const p = e.payload as AnswerSubmittedPayload & { hints_used?: number };
          return (p.hints_used ?? 0) === 0 && p.attempt_number === 1;
        })
        .map((e) => e.created_at),
  },
  {
    id: 'first_mastered',
    title: 'First skill mastered',
    description: 'Reach mastery on one skill.',
    target: 1,
    moments: (i) => masteryMoments(i.events),
  },
  {
    id: 'ten_mastered',
    title: 'Ten skills mastered',
    description: 'Reach mastery on 10 skills.',
    target: 10,
    moments: (i) => masteryMoments(i.events),
  },
  {
    id: 'fifty_mastered',
    title: 'Fifty skills mastered',
    description: 'Reach mastery on 50 skills.',
    target: 50,
    moments: (i) => masteryMoments(i.events),
  },
  {
    id: 'streak_3',
    title: 'Three days running',
    description: 'Practise on three consecutive days.',
    target: 3,
    moments: (i) => streakMoments(i, 3),
  },
  {
    id: 'streak_7',
    title: 'A full week',
    description: 'Practise on seven consecutive days.',
    target: 7,
    moments: (i) => streakMoments(i, 7),
  },
  {
    id: 'misconception_cleared',
    title: 'Habit broken',
    description: 'Clear a misconception you had repeated.',
    target: 1,
    moments: (i) => {
      // A misconception counts as cleared once it recurred and then the learner
      // answered correctly twice running on that skill - the same rule the
      // remediation projection uses.
      const recurred = new Map<string, number>();
      const cleared: string[] = [];
      const done = new Set<string>();
      const streakBySkill = new Map<string, number>();
      for (const e of ordered(i.events)) {
        if (e.type !== 'answer_submitted') continue;
        const p = e.payload as AnswerSubmittedPayload & { misconception_id?: string };
        if (p.correct) {
          const run = (streakBySkill.get(p.skill_id) ?? 0) + 1;
          streakBySkill.set(p.skill_id, run);
          if (run >= 2) {
            for (const [key, count] of recurred) {
              if (count >= 2 && key.startsWith(`${p.skill_id}::`) && !done.has(key)) {
                done.add(key);
                cleared.push(e.created_at);
              }
            }
          }
        } else {
          streakBySkill.set(p.skill_id, 0);
          if (p.misconception_id) {
            const key = `${p.skill_id}::${p.misconception_id}`;
            recurred.set(key, (recurred.get(key) ?? 0) + 1);
          }
        }
      }
      return cleared;
    },
  },
  {
    id: 'unit_complete',
    title: 'Unit finished',
    description: 'Master every skill in one unit.',
    target: 1,
    moments: (i) => {
      if (!i.unitBySkill || i.unitBySkill.size === 0) return [];
      const mastered = new Set(
        i.progress
          .filter((p) => p.state === 'mastered' || p.state === 'provisionally_mastered')
          .map((p) => p.skill_id),
      );
      const byUnit = new Map<string, string[]>();
      for (const [skillId, unitId] of i.unitBySkill) {
        const list = byUnit.get(unitId) ?? [];
        list.push(skillId);
        byUnit.set(unitId, list);
      }
      const complete = [...byUnit.values()].filter(
        (skills) => skills.length > 0 && skills.every((s) => mastered.has(s)),
      );
      // Attribute each completed unit to the latest mastery moment overall; a
      // per-unit timestamp would need per-skill mastery times we do not keep here.
      const moments = masteryMoments(i.events);
      const last = moments[moments.length - 1];
      return complete.map(() => last ?? '');
    },
  },
  {
    id: 'three_subjects',
    title: 'Across the board',
    description: 'Practise skills in three different subjects.',
    target: 3,
    moments: (i) => {
      const seen = new Set<string>();
      const moments: string[] = [];
      for (const e of ordered(i.events)) {
        if (e.type !== 'answer_submitted') continue;
        const subject = (e.payload as AnswerSubmittedPayload).skill_id.split('.')[0];
        if (!subject || seen.has(subject)) continue;
        seen.add(subject);
        moments.push(e.created_at);
      }
      return moments;
    },
  },
];

/**
 * Compute every achievement. Pure: the same input always gives the same output,
 * in a stable order (unearned achievements keep their declaration order after
 * the earned ones, so the list does not jump around as badges are won).
 */
export function projectAchievements(input: AchievementInput): Achievement[] {
  const all = RULES.map((rule) => {
    const moments = rule.moments(input);
    const current = Math.min(moments.length, rule.target);
    const earned = moments.length >= rule.target;
    const at = earned ? moments[rule.target - 1] : undefined;
    return {
      id: rule.id,
      title: rule.title,
      description: rule.description,
      earned,
      progress: rule.target === 0 ? 1 : Math.min(1, moments.length / rule.target),
      current,
      target: rule.target,
      ...(at ? { earned_at: at } : {}),
    };
  });
  // Earned first, most recent first within that; then the rest in declaration order.
  const earned = all.filter((a) => a.earned);
  const rest = all.filter((a) => !a.earned);
  earned.sort((a, b) => (b.earned_at ?? '').localeCompare(a.earned_at ?? ''));
  return [...earned, ...rest];
}

export function earnedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.earned).length;
}
