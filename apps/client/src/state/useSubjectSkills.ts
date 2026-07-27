/**
 * The set of skills belonging to the subject chosen at Goal Selection (doc 07).
 *
 * Shared so the dashboard and the practice screen cannot drift apart about what
 * "my subject" means. Returns undefined when no subject is chosen or the chosen
 * course is not installed - callers treat that as "the whole curriculum", which
 * is the behaviour that predates subject selection.
 */
import { useMemo } from 'react';
import { useCurriculum } from './CurriculumContext.js';
import { useOptionalLearner } from './LearnerContext.js';

export function useSubjectSkills(): ReadonlySet<string> | undefined {
  const { package: pkg } = useCurriculum();
  const learner = useOptionalLearner()?.learner ?? null;
  const courseId = learner?.current_course_id;

  return useMemo(() => {
    if (!pkg || !courseId) return undefined;
    const course = pkg.courses.find((c) => c.course_id === courseId);
    if (!course) return undefined;
    const units = new Set(course.units.map((u) => u.unit_id));
    const ids = new Set<string>();
    for (const [skillId, skill] of pkg.graph.skills) {
      if (units.has(skill.unit_id)) ids.add(skillId);
    }
    return ids;
  }, [pkg, courseId]);
}
