/**
 * Practice.
 *
 * `/practice?skill=<id>` practises one skill, which is what the mastery model
 * assumes: scores, review scheduling and gating are all per-skill.
 *
 * Bare `/practice` (the nav link) used to fall back to `pkg.questions` - every
 * question in the curriculum in one flat rotation, which served locked skills
 * and so contradicted doc 02's requirement that the system prevent advancement
 * past unstable prerequisites. It is now a sectioned index of the curriculum,
 * with the resolved next skill offered at the top.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { CoursePackage, Question } from '@learn/curriculum';
import { rotateForPractice, selectTodaysSession, unlockStatus } from '@learn/learning-engine';
import type { SkillState } from '@learn/domain';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useLearner } from '../state/LearnerContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { useSubjectSkills } from '../state/useSubjectSkills.js';
import { QuestionView } from '../components/QuestionView.js';
import { ScreenState } from '../components/ScreenState.js';

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

export function PracticeScreen(): JSX.Element {
  const [params] = useSearchParams();
  const skillId = params.get('skill');
  return skillId ? <SkillPractice skillId={skillId} /> : <PracticeEntry />;
}

/**
 * Bare /practice: the curriculum, by section.
 *
 * Units are the sections a learner actually thinks in, and the curriculum is
 * already shaped that way - course, then unit, then skill - so this screen shows
 * that shape rather than hiding it behind a redirect. The resolved next skill
 * sits at the top as one click, so the common case is still fast, but the
 * sections underneath make it clear what practice is drawn from and what is
 * still shut.
 *
 * Locked skills are listed, not hidden. Seeing that Trigonometry exists and what
 * it waits on is the point; the entry is plain text rather than a link, so the
 * prerequisite rule in doc 02 holds.
 */
function PracticeEntry(): JSX.Element {
  const { package: pkg, errors } = useCurriculum();
  const { learner, status: learnerStatus } = useLearner();
  const { progress, misconceptions, projectedFor, loading } = useProgress();
  const focusSkills = useSubjectSkills();
  const [now] = useState(() => new Date().toISOString());

  if (!pkg) {
    return (
      <section>
        <h1>Practice</h1>
        <ScreenState status="error" message={`Curriculum failed to load: ${errors.join('; ')}`} />
      </section>
    );
  }

  // Same gate as the rotation below: the projection has to be for this learner
  // before it can be trusted, or the frontier is computed against nothing.
  if (loading || learnerStatus !== 'ready' || (learner?.learner_id ?? null) !== projectedFor) {
    return (
      <section>
        <h1>Practice</h1>
        <ScreenState status="loading" />
      </section>
    );
  }

  const hasItems = (id: string): boolean => (pkg.questionsBySkill.get(id) ?? []).length > 0;
  const session = selectTodaysSession(
    progress,
    pkg.graph,
    pkg.order,
    now,
    misconceptions,
    focusSkills,
  );
  // A due review is time-sensitive, so it outranks the frontier.
  const nextWithItems = session.nextSkill && hasItems(session.nextSkill) ? session.nextSkill : null;
  const chosen = session.dueSkills.find(hasItems) ?? nextWithItems;

  /*
   * Sections come from the chosen subject's course. With no subject chosen the
   * whole curriculum is listed, which is the behaviour that predates subject
   * selection - and the sections make even that legible, which the old flat
   * rotation did not.
   */
  const courses = focusSkills
    ? pkg.courses.filter((c) =>
        c.units.some((u) => focusSkills.has(unitFirstSkill(pkg, u.unit_id))),
      )
    : pkg.courses;
  const shown = courses.length > 0 ? courses : pkg.courses;

  const chosenUnit = chosen ? pkg.graph.skills.get(chosen)?.unit_id : undefined;
  const chosenTitle = chosen ? (pkg.graph.skills.get(chosen)?.title ?? chosen) : null;
  const isReview = chosen ? session.dueSkills.includes(chosen) : false;

  return (
    <section>
      <h1>Practice</h1>

      {chosen && (
        <div className="check-panel">
          <h2>{isReview ? 'Due for review' : 'Where you are'}</h2>
          <p>
            {isReview
              ? `${chosenTitle} is due for review. Reviews come first because they are the ones at risk of slipping.`
              : `${chosenTitle} is the next skill your prerequisites have opened.`}
          </p>
          <p className="question-actions">
            <Link to={`/practice?skill=${encodeURIComponent(chosen)}`}>Practise {chosenTitle}</Link>
          </p>
        </div>
      )}

      <p>
        Or pick any section below. A skill is listed with the number of questions behind it; locked
        ones show what they are waiting on.
      </p>

      {shown.map((course) => (
        <section key={course.course_id} aria-label={course.title}>
          {shown.length > 1 && <h2>{course.title}</h2>}
          {[...course.units]
            .sort((a, b) => a.order - b.order)
            .map((unit) => {
              const ids = pkg.order.filter(
                (id) => pkg.graph.skills.get(id)?.unit_id === unit.unit_id && hasItems(id),
              );
              if (ids.length === 0) return null;
              const items = ids.reduce(
                (n, id) => n + (pkg.questionsBySkill.get(id) ?? []).length,
                0,
              );
              const done = ids.filter((id) => {
                const s = progress.get(id)?.state;
                return s === 'mastered' || s === 'provisionally_mastered';
              }).length;
              return (
                <details
                  key={unit.unit_id}
                  className="unit-section"
                  open={unit.unit_id === chosenUnit}
                >
                  <summary>
                    <span className="unit-title">{unit.title}</span>{' '}
                    <span className="skill-state-label">
                      — {ids.length} skills, {items} questions, {done} mastered
                    </span>
                  </summary>
                  <ul className="skill-list">
                    {ids.map((id) => {
                      const skill = pkg.graph.skills.get(id)!;
                      const state = progress.get(id)?.state ?? 'unknown';
                      const count = (pkg.questionsBySkill.get(id) ?? []).length;
                      const { unlocked, missing } = unlockStatus(id, pkg.graph, progress);
                      const missingTitles = missing.map((m) => pkg.graph.skills.get(m)?.title ?? m);
                      return (
                        <li key={id} className="skill-node" data-locked={!unlocked}>
                          <span className="skill-status" aria-hidden="true">
                            {unlocked ? '' : '🔒'}
                          </span>
                          <div>
                            <span className="skill-title">
                              {unlocked ? (
                                <Link to={`/practice?skill=${encodeURIComponent(id)}`}>
                                  {skill.title}
                                </Link>
                              ) : (
                                skill.title
                              )}
                            </span>{' '}
                            <span className="skill-state-label">
                              — {unlocked ? STATE_LABEL[state] : 'Locked'}, {count} question
                              {count === 1 ? '' : 's'}
                            </span>
                            {!unlocked && missingTitles.length > 0 && (
                              <p className="prereqs">
                                Unlock by mastering: {missingTitles.join(', ')}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
        </section>
      ))}
    </section>
  );
}

/** Any skill in a unit, used only to test whether a unit is inside the subject. */
function unitFirstSkill(pkg: CoursePackage, unitId: string): string {
  for (const [skillId, skill] of pkg.graph.skills) {
    if (skill.unit_id === unitId) return skillId;
  }
  return '';
}

function SkillPractice({ skillId }: { skillId: string }): JSX.Element {
  const { package: pkg, errors } = useCurriculum();
  const { learner, status: learnerStatus } = useLearner();
  const { refresh, exposure, projectedFor, loading } = useProgress();
  const [params] = useSearchParams();
  // Deep link to one question, e.g. from a shared link or a bookmark. The named
  // question is pinned first; the rest of the rotation follows behind it.
  const pinnedId = params.get('q');
  const [index, setIndex] = useState(0);

  /*
   * The order is computed once per visit and then held. Recomputing as answers
   * land would reshuffle the remaining questions under the learner mid-session,
   * because answering one changes its exposure.
   */
  const [ordered, setOrdered] = useState<Question[] | null>(null);
  useEffect(() => {
    setOrdered(null);
    setIndex(0);
  }, [skillId, pinnedId]);
  useEffect(() => {
    /*
     * Wait until the projection is for THIS learner. ProgressContext settles
     * once with no learner before the profile loads, so `loading` alone can be
     * false against an empty exposure map - and because the order is frozen
     * after the first computation, that would silently restore the old fixed
     * ordering with no visible symptom.
     */
    if (loading || ordered || !pkg || learnerStatus !== 'ready') return;
    if ((learner?.learner_id ?? null) !== projectedFor) return;
    const pool = pkg.questionsBySkill.get(skillId) ?? [];
    const rotated = rotateForPractice(pool, exposure);
    const pinned = pinnedId ? rotated.find((x) => x.question_id === pinnedId) : undefined;
    setOrdered(pinned ? [pinned, ...rotated.filter((x) => x !== pinned)] : rotated);
  }, [loading, ordered, pkg, skillId, pinnedId, exposure, learnerStatus, learner, projectedFor]);

  if (!pkg) {
    return (
      <section>
        <h1>Practice</h1>
        <ScreenState status="error" message={`Curriculum failed to load: ${errors.join('; ')}`} />
      </section>
    );
  }

  // Null means the order has not been settled yet; empty means there is
  // genuinely nothing to practise. Distinguishing them avoids flashing "no
  // questions" while the log is still being read.
  if (ordered === null) {
    return (
      <section>
        <h1>Practice</h1>
        <ScreenState status="loading" />
      </section>
    );
  }

  const questions = ordered;
  const title = pkg.graph.skills.get(skillId)?.title ?? skillId;

  if (questions.length === 0) {
    return (
      <section>
        <h1>Practice</h1>
        <ScreenState status="empty" message="No practice questions for this selection.">
          <Link to="/map">Back to curriculum map</Link>
        </ScreenState>
      </section>
    );
  }

  const question = questions[Math.min(index, questions.length - 1)]!;
  const hasNext = index < questions.length - 1;

  return (
    <section>
      <h1>Practice</h1>
      <p className="progress-note">
        {title}: question {Math.min(index + 1, questions.length)} of {questions.length}
      </p>
      <QuestionView
        key={question.question_id}
        question={question}
        learnerId={learner?.learner_id ?? null}
        onSolved={() => {
          void refresh();
          if (hasNext) setIndex((i) => i + 1);
        }}
        nextLabel={hasNext ? 'Next question' : 'Finish'}
      />
      {!hasNext && <p className="progress-note">That is the last question in this set.</p>}
      <p className="skill-actions">
        <Link to={`/mastery-check?skill=${encodeURIComponent(skillId)}`}>
          Take the mastery check for this skill
        </Link>{' '}
        <Link to="/map">Practise something else</Link>
      </p>
    </section>
  );
}
