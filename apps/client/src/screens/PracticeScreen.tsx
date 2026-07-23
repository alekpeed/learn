import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useLearner } from '../state/LearnerContext.js';
import { QuestionView } from '../components/QuestionView.js';
import { ScreenState } from '../components/ScreenState.js';

export function PracticeScreen(): JSX.Element {
  const { package: pkg, errors } = useCurriculum();
  const { learner } = useLearner();
  const [params] = useSearchParams();
  const skillId = params.get('skill');
  const [index, setIndex] = useState(0);

  if (!pkg) {
    return (
      <section>
        <h1>Practice</h1>
        <ScreenState status="error" message={`Curriculum failed to load: ${errors.join('; ')}`} />
      </section>
    );
  }

  const questions = skillId ? (pkg.questionsBySkill.get(skillId) ?? []) : pkg.questions;

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
        onSolved={hasNext ? () => setIndex((i) => i + 1) : undefined}
      />
      {!hasNext && <p className="progress-note">That is the last question in this set.</p>}
    </section>
  );
}
