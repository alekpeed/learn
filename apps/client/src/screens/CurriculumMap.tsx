import { Link } from 'react-router-dom';
import { useCurriculum } from '../state/CurriculumContext.js';
import { ScreenState } from '../components/ScreenState.js';

/**
 * Curriculum map (Phase 2 exit: "skill relationships display correctly").
 * Renders skills grouped by unit in prerequisite (topological) order, showing
 * each skill's prerequisites by title. Status uses an icon + text label, never
 * color alone (doc 07 §3, doc 11 §4). Mastery-driven locking arrives in Phase 4;
 * for now a skill with unmet prerequisites is shown as "locked" with the reason.
 */
export function CurriculumMap(): JSX.Element {
  const { package: pkg, errors } = useCurriculum();

  if (!pkg) {
    return (
      <section>
        <h1>Curriculum Map</h1>
        <ScreenState status="error" message={`Curriculum failed to load: ${errors.join('; ')}`} />
      </section>
    );
  }

  const unitTitles = new Map<string, string>();
  for (const course of pkg.courses) {
    for (const unit of course.units) unitTitles.set(unit.unit_id, unit.title);
  }

  // Group skills by unit, preserving topological order.
  const byUnit = new Map<string, string[]>();
  for (const skillId of pkg.order) {
    const skill = pkg.graph.skills.get(skillId);
    if (!skill) continue;
    const list = byUnit.get(skill.unit_id) ?? [];
    list.push(skillId);
    byUnit.set(skill.unit_id, list);
  }

  return (
    <section>
      <h1>Curriculum Map</h1>
      <p>Skills are shown in the order you can learn them. Each skill lists what it builds on.</p>

      {[...byUnit.entries()].map(([unitId, skillIds]) => (
        <section key={unitId} aria-label={unitTitles.get(unitId) ?? unitId}>
          <h2>{unitTitles.get(unitId) ?? unitId}</h2>
          <ul className="skill-list">
            {skillIds.map((skillId) => {
              const skill = pkg.graph.skills.get(skillId)!;
              const prereqTitles = skill.prerequisites.map(
                (p) =>
                  pkg.graph.skills.get(p.prerequisite_skill_id)?.title ?? p.prerequisite_skill_id,
              );
              const locked = prereqTitles.length > 0;
              const hasLesson = pkg.lessonBySkill.has(skillId);
              const hasQuestions = (pkg.questionsBySkill.get(skillId) ?? []).length > 0;
              return (
                <li key={skillId} className="skill-node" data-locked={locked}>
                  <span className="skill-status" aria-hidden="true">
                    {locked ? '🔒' : '✓'}
                  </span>
                  <div>
                    <span className="skill-title">
                      {hasLesson ? (
                        <Link to={`/lesson?skill=${encodeURIComponent(skillId)}`}>
                          {skill.title}
                        </Link>
                      ) : (
                        skill.title
                      )}
                    </span>
                    <span className="visually-hidden">
                      {locked ? ' (locked — prerequisites needed)' : ' (available)'}
                    </span>
                    {prereqTitles.length > 0 && (
                      <p className="prereqs">Builds on: {prereqTitles.join(', ')}</p>
                    )}
                    {hasQuestions && (
                      <p className="skill-actions">
                        <Link to={`/practice?skill=${encodeURIComponent(skillId)}`}>
                          Practice {skill.title}
                        </Link>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </section>
  );
}
