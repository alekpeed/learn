/**
 * Progress-dashboard projections (Version 1). Pure aggregations over the
 * SkillProgress projection — no side effects, no rendering. Kept here so the
 * numbers a learner sees are derived deterministically and can be unit-tested
 * independently of the UI.
 */
import type { SkillProgress, MasteryScores, MasteryDimension } from '@learn/domain';
import { MASTERY_DIMENSIONS, emptyMasteryScores } from '@learn/domain';
import type { SkillGraph } from '@learn/curriculum';
import { isReviewDue } from './state.js';

/** A skill's overall mastery: the mean of its five dimension scores, in [0,100]. */
export function overallScore(scores: MasteryScores): number {
  const sum = MASTERY_DIMENSIONS.reduce((acc, d) => acc + scores[d], 0);
  return sum / MASTERY_DIMENSIONS.length;
}

export type ProgressBucket = 'mastered' | 'in_progress' | 'needs_work' | 'not_started';

/** Collapse the eight-state machine into the four buckets the dashboard shows. */
export function bucketFor(state: SkillProgress['state']): ProgressBucket {
  switch (state) {
    case 'mastered':
    case 'provisionally_mastered':
      return 'mastered';
    case 'learning':
    case 'practicing':
    case 'review_due':
      return 'in_progress';
    case 'diagnosed_weak':
    case 'decayed':
      return 'needs_work';
    default:
      return 'not_started';
  }
}

export interface ProgressSummary {
  totalSkills: number;
  started: number;
  mastered: number;
  inProgress: number;
  needsWork: number;
  notStarted: number;
  dueReview: number;
  /** Mean overall score across started skills, in [0,100]; 0 when none started. */
  avgOverall: number;
}

/** Headline counts across every skill in the graph. */
export function summarizeProgress(
  progress: Map<string, SkillProgress>,
  graph: SkillGraph,
  now: string,
): ProgressSummary {
  let mastered = 0;
  let inProgress = 0;
  let needsWork = 0;
  let notStarted = 0;
  let dueReview = 0;
  let started = 0;
  let scoreSum = 0;

  for (const skillId of graph.skills.keys()) {
    const p = progress.get(skillId);
    if (!p || p.state === 'unknown') {
      notStarted += 1;
      continue;
    }
    switch (bucketFor(p.state)) {
      case 'mastered':
        mastered += 1;
        break;
      case 'in_progress':
        inProgress += 1;
        break;
      case 'needs_work':
        needsWork += 1;
        break;
      default:
        notStarted += 1;
    }
    if (p.attempt_count > 0) {
      started += 1;
      scoreSum += overallScore(p.scores);
    }
    if (isReviewDue(p, now)) dueReview += 1;
  }

  return {
    totalSkills: graph.skills.size,
    started,
    mastered,
    inProgress,
    needsWork,
    notStarted,
    dueReview,
    avgOverall: started > 0 ? scoreSum / started : 0,
  };
}

export interface UnitProgress {
  unitId: string;
  title: string;
  order: number;
  total: number;
  mastered: number;
  started: number;
  /** Mean overall score across started skills in the unit, in [0,100]. */
  avgOverall: number;
}

export interface UnitMeta {
  unit_id: string;
  title: string;
  order: number;
}

/**
 * Mastery grouped by unit, ordered by the curriculum's unit order. Units carry
 * their title/order from the course manifest; a skill whose unit is unknown is
 * grouped under its raw unit id at the end.
 */
export function masteryByUnit(
  progress: Map<string, SkillProgress>,
  graph: SkillGraph,
  units: UnitMeta[],
): UnitProgress[] {
  const meta = new Map(units.map((u) => [u.unit_id, u]));
  const groups = new Map<string, string[]>();
  for (const skill of graph.skills.values()) {
    const list = groups.get(skill.unit_id);
    if (list) list.push(skill.skill_id);
    else groups.set(skill.unit_id, [skill.skill_id]);
  }

  const rows: UnitProgress[] = [];
  for (const [unitId, skillIds] of groups) {
    let mastered = 0;
    let started = 0;
    let scoreSum = 0;
    for (const skillId of skillIds) {
      const p = progress.get(skillId);
      if (!p) continue;
      if (bucketFor(p.state) === 'mastered') mastered += 1;
      if (p.attempt_count > 0) {
        started += 1;
        scoreSum += overallScore(p.scores);
      }
    }
    const m = meta.get(unitId);
    rows.push({
      unitId,
      title: m?.title ?? unitId,
      order: m?.order ?? Number.MAX_SAFE_INTEGER,
      total: skillIds.length,
      mastered,
      started,
      avgOverall: started > 0 ? scoreSum / started : 0,
    });
  }

  rows.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return rows;
}

/**
 * Mean of each mastery dimension across started skills — the shape of a
 * learner's strengths and gaps. Returns zeros when nothing is started.
 */
export function dimensionAverages(
  progress: Map<string, SkillProgress>,
  graph: SkillGraph,
): MasteryScores {
  const sums = emptyMasteryScores();
  let n = 0;
  for (const skillId of graph.skills.keys()) {
    const p = progress.get(skillId);
    if (!p || p.attempt_count === 0) continue;
    n += 1;
    for (const d of MASTERY_DIMENSIONS) sums[d] += p.scores[d];
  }
  if (n > 0) {
    for (const d of MASTERY_DIMENSIONS) sums[d] = sums[d] / n;
  }
  return sums as Record<MasteryDimension, number>;
}
