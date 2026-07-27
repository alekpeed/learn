import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Question } from '@learn/curriculum';
import { rotateForPractice } from '@learn/learning-engine';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useLearner } from '../state/LearnerContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { QuestionView } from '../components/QuestionView.js';
import { ScreenState } from '../components/ScreenState.js';

export function PracticeScreen(): JSX.Element {
  const { package: pkg, errors } = useCurriculum();
  const { learner, status: learnerStatus } = useLearner();
  const { refresh, exposure, projectedFor, loading } = useProgress();
  const [params] = useSearchParams();
  const skillId = params.get('skill');
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
    const pool = skillId ? (pkg.questionsBySkill.get(skillId) ?? []) : pkg.questions;
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
        Question {Math.min(index + 1, questions.length)} of {questions.length}
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
      {skillId && (
        <p className="skill-actions">
          <Link to={`/mastery-check?skill=${encodeURIComponent(skillId)}`}>
            Take the mastery check for this skill
          </Link>
        </p>
      )}
    </section>
  );
}
