/**
 * Prerequisite gating (LRN-003) and remediation routing (LRN-004).
 * A skill unlocks when its required prerequisites are at least provisionally
 * mastered (doc 04 §14). On a prerequisite failure, route to the *lowest*
 * unstable prerequisite (doc 04 §5).
 */
import type { SkillProgress, SkillState } from '@learn/domain';
import type { SkillGraph } from '@learn/curriculum';

const SATISFIED_STATES: ReadonlySet<SkillState> = new Set(['provisionally_mastered', 'mastered']);

function isSatisfied(skillId: string, progress: Map<string, SkillProgress>): boolean {
  const p = progress.get(skillId);
  return p !== undefined && SATISFIED_STATES.has(p.state);
}

export interface UnlockStatus {
  unlocked: boolean;
  /** Required prerequisites not yet satisfied (empty when unlocked). */
  missing: string[];
}

export function unlockStatus(
  skillId: string,
  graph: SkillGraph,
  progress: Map<string, SkillProgress>,
): UnlockStatus {
  const prereqs = graph.prerequisites.get(skillId) ?? [];
  const missing = prereqs.filter((p) => graph.skills.has(p) && !isSatisfied(p, progress));
  return { unlocked: missing.length === 0, missing };
}

/**
 * Find the lowest unstable prerequisite to remediate: walk the prerequisite
 * chain and return the deepest unsatisfied skill whose own prerequisites are all
 * satisfied — the first place the learner can actually make progress.
 * Returns null if everything required is already satisfied.
 */
export function findRemediationTarget(
  skillId: string,
  graph: SkillGraph,
  progress: Map<string, SkillProgress>,
): string | null {
  const visited = new Set<string>();

  function search(id: string): string | null {
    const prereqs = (graph.prerequisites.get(id) ?? []).filter((p) => graph.skills.has(p));
    for (const prereq of prereqs) {
      if (visited.has(prereq)) continue;
      visited.add(prereq);
      if (!isSatisfied(prereq, progress)) {
        // Descend first; the lowest unstable prerequisite wins.
        const deeper = search(prereq);
        return deeper ?? prereq;
      }
    }
    return null;
  }

  return search(skillId);
}
