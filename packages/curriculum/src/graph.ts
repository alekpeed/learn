/**
 * Skill dependency graph (DEC-002). Pure graph algorithms used by the loader:
 * missing-reference detection, cycle reporting, and topological ordering
 * (CUR-002 acceptance).
 */
import type { Skill } from './types.js';

export interface SkillGraph {
  /** skill_id -> Skill */
  skills: Map<string, Skill>;
  /** skill_id -> required prerequisite skill_ids */
  prerequisites: Map<string, string[]>;
  /** skill_id -> skill_ids that depend on it */
  dependents: Map<string, string[]>;
}

export function buildGraph(skills: Skill[]): SkillGraph {
  const skillMap = new Map<string, Skill>();
  const prerequisites = new Map<string, string[]>();
  const dependents = new Map<string, string[]>();

  for (const skill of skills) {
    skillMap.set(skill.skill_id, skill);
    prerequisites.set(skill.skill_id, []);
    if (!dependents.has(skill.skill_id)) dependents.set(skill.skill_id, []);
  }

  for (const skill of skills) {
    for (const prereq of skill.prerequisites) {
      prerequisites.get(skill.skill_id)?.push(prereq.prerequisite_skill_id);
      if (!dependents.has(prereq.prerequisite_skill_id)) {
        dependents.set(prereq.prerequisite_skill_id, []);
      }
      dependents.get(prereq.prerequisite_skill_id)?.push(skill.skill_id);
    }
  }

  return { skills: skillMap, prerequisites, dependents };
}

/** Prerequisite IDs that do not resolve to a skill in the package. */
export function findMissingReferences(graph: SkillGraph): string[] {
  const missing = new Set<string>();
  for (const [, prereqs] of graph.prerequisites) {
    for (const prereqId of prereqs) {
      if (!graph.skills.has(prereqId)) missing.add(prereqId);
    }
  }
  return [...missing].sort();
}

/**
 * Detect a dependency cycle. Returns the skill IDs forming the first cycle
 * found, or null if the graph is acyclic. Ignores edges to unknown skills
 * (those are reported separately as missing references).
 */
export function findCycle(graph: SkillGraph): string[] | null {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  const stack: string[] = [];

  for (const id of graph.skills.keys()) color.set(id, WHITE);

  function visit(node: string): string[] | null {
    color.set(node, GRAY);
    stack.push(node);
    for (const prereq of graph.prerequisites.get(node) ?? []) {
      if (!graph.skills.has(prereq)) continue; // missing ref, handled elsewhere
      const c = color.get(prereq);
      if (c === GRAY) {
        const start = stack.indexOf(prereq);
        return stack.slice(start).concat(prereq);
      }
      if (c === WHITE) {
        const found = visit(prereq);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(node, BLACK);
    return null;
  }

  for (const id of graph.skills.keys()) {
    if (color.get(id) === WHITE) {
      const cycle = visit(id);
      if (cycle) return cycle;
    }
  }
  return null;
}

/**
 * Kahn's topological sort: prerequisites always precede their dependents.
 * Returns null if the graph has a cycle (call findCycle for the detail).
 */
export function topologicalOrder(graph: SkillGraph): string[] | null {
  const indegree = new Map<string, number>();
  for (const id of graph.skills.keys()) indegree.set(id, 0);
  for (const [id, prereqs] of graph.prerequisites) {
    const known = prereqs.filter((p) => graph.skills.has(p));
    indegree.set(id, known.length);
  }

  const queue = [...graph.skills.keys()].filter((id) => indegree.get(id) === 0).sort();
  const order: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift() as string;
    order.push(node);
    for (const dependent of graph.dependents.get(node) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) {
        queue.push(dependent);
        queue.sort();
      }
    }
  }

  return order.length === graph.skills.size ? order : null;
}
