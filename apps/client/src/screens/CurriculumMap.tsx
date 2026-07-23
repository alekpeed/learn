import { Link } from 'react-router-dom';
import type { SkillState } from '@learn/domain';
import { unlockStatus } from '@learn/learning-engine';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { ScreenState } from '../components/ScreenState.js';

/**
 * Curriculum map (Phase 2 + Phase 4). Skills grouped by unit in prerequisite
 * order. Lock state is real: a skill is locked until its prerequisites are
 * provisionally mastered (LRN-003). Status uses an icon + text label, never
 * color alone (doc 07 §3, doc 11 §4).
 */
const STATE_LABEL: Record<SkillState, string> = {
  unknown: 'Not started',
  diagnosed_weak: 'Weak',
  learning: 'Learning',
  practicing: 'Practicing',
  provisionally_mastered: 'Almost mastered',
  mastered: 'Mastered',
  review_due: 'Review due',
  decayed: 'Needs review',
};

const STATE_ICON: Record<SkillState, string> = {
  unknown: '○',
  diagnosed_weak: '!',
  learning: '◐',
  practicing: '◑',
  provisionally_mastered: '◕',
  mastered: '★',
  review_due: '↻',
  decayed: '↻',
};

export function CurriculumMap(): JSX.Element {
  const { package: pkg, errors } = useCurriculum();
  const { progress } = useProgress();

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
              const state = progress.get(skillId)?.state ?? 'unknown';
              const { unlocked, missing } = unlockStatus(skillId, pkg.graph, progress);
              const hasLesson = pkg.lessonBySkill.has(skillId);
              const hasQuestions = (pkg.questionsBySkill.get(skillId) ?? []).length > 0;
              const missingTitles = missing.map((id) => pkg.graph.skills.get(id)?.title ?? id);

              return (
                <li key={skillId} className="skill-node" data-locked={!unlocked}>
                  <span className="skill-status" aria-hidden="true">
                    {unlocked ? STATE_ICON[state] : '🔒'}
                  </span>
                  <div>
                    <span className="skill-title">
                      {hasLesson && unlocked ? (
                        <Link to={`/lesson?skill=${encodeURIComponent(skillId)}`}>
                          {skill.title}
                        </Link>
                      ) : (
                        skill.title
                      )}
                    </span>{' '}
                    <span className="skill-state-label">
                      — {unlocked ? STATE_LABEL[state] : 'Locked'}
                    </span>
                    {!unlocked && missingTitles.length > 0 && (
                      <p className="prereqs">Unlock by mastering: {missingTitles.join(', ')}</p>
                    )}
                    {unlocked && hasQuestions && (
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
