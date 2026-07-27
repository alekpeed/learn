/**
 * Practice.
 *
 * `/practice?skill=<id>` practises one skill, which is what the mastery model
 * assumes: scores, review scheduling and gating are all per-skill.
 *
 * Bare `/practice` (the nav link) used to fall back to `pkg.questions` - every
 * question in the curriculum in one flat rotation, which served locked skills
 * and so contradicted doc 02's requirement that the system prevent advancement
 * past unstable prerequisites. It now resolves the same skill the dashboard
 * points at: a due review first, then the frontier skill inside the chosen
 * subject. If nothing is in progress it offers a picker rather than guessing.
 */
import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import type { Question } from '@learn/curriculum';
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
 * Bare /practice: send the learner to a specific skill, or let them choose.
 * Redirecting rather than practising in place keeps one code path - the URL
 * always names the skill, so a reload, a bookmark and a deep link all behave
 * the same.
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

  if (chosen) return <Navigate to={`/practice?skill=${encodeURIComponent(chosen)}`} replace />;

  // Nothing in progress. Offer what is actually open rather than everything.
  const open = pkg.order.filter(
    (id) =>
      hasItems(id) &&
      unlockStatus(id, pkg.graph, progress).unlocked &&
      (!focusSkills || focusSkills.has(id)),
  );

  if (open.length === 0) {
    return (
      <section>
        <h1>Practice</h1>
        <ScreenState
          status="empty"
          message="Nothing is unlocked to practise yet. Start with a lesson from the curriculum map."
        >
          <Link to="/map">Open the curriculum map</Link>
        </ScreenState>
      </section>
    );
  }

  const unitTitles = new Map<string, string>();
  for (const course of pkg.courses) {
    for (const unit of course.units) unitTitles.set(unit.unit_id, unit.title);
  }
  const byUnit = new Map<string, string[]>();
  for (const id of open) {
    const unitId = pkg.graph.skills.get(id)?.unit_id ?? '';
    byUnit.set(unitId, [...(byUnit.get(unitId) ?? []), id]);
  }

  return (
    <section>
      <h1>Practice</h1>
      <p>Choose a skill to practise. These are the ones your prerequisites have opened.</p>
      {[...byUnit.entries()].map(([unitId, ids]) => (
        <section key={unitId} aria-label={unitTitles.get(unitId) ?? unitId}>
          <h2>{unitTitles.get(unitId) ?? unitId}</h2>
          <ul className="skill-list">
            {ids.map((id) => {
              const skill = pkg.graph.skills.get(id)!;
              const state = progress.get(id)?.state ?? 'unknown';
              const count = (pkg.questionsBySkill.get(id) ?? []).length;
              return (
                <li key={id} className="skill-node">
                  <div>
                    <span className="skill-title">
                      <Link to={`/practice?skill=${encodeURIComponent(id)}`}>{skill.title}</Link>
                    </span>{' '}
                    <span className="skill-state-label">
                      — {STATE_LABEL[state]}, {count} question{count === 1 ? '' : 's'}
                    </span>
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
