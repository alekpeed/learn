import { Link } from 'react-router-dom';
import { isReviewDue } from '@learn/learning-engine';
import { useLearner } from '../state/LearnerContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { useCurriculum } from '../state/CurriculumContext.js';
import { TodayPanel } from '../components/TodayPanel.js';
import { ScreenState } from '../components/ScreenState.js';

export function Dashboard(): JSX.Element {
  const { status, learner } = useLearner();
  const { progress } = useProgress();
  const { package: pkg } = useCurriculum();

  const now = new Date().toISOString();
  const dueCount = [...progress.values()].filter((p) => isReviewDue(p, now)).length;
  const inProgress = [...progress.values()].filter(
    (p) => p.state === 'learning' || p.state === 'practicing',
  );
  const currentTitle = inProgress[0]
    ? (pkg?.graph.skills.get(inProgress[0].skill_id)?.title ?? inProgress[0].skill_id)
    : null;

  return (
    <section>
      <h1>Dashboard</h1>
      {status === 'loading' && <ScreenState status="loading" />}
      {status !== 'loading' && !learner && (
        <ScreenState status="empty" message="No profile yet.">
          <Link to="/">Get started</Link>
        </ScreenState>
      )}
      {learner && (
        <>
          <p>Hello, {learner.display_name}.</p>
          <TodayPanel />
          <ul>
            <li>
              <Link to="/map">Continue learning</Link>
              {currentTitle ? ` — current: ${currentTitle}` : ''}
            </li>
            <li>
              <Link to="/review">Reviews due</Link>: {dueCount}
            </li>
            <li>
              <Link to="/diagnostic">Take a placement check</Link>
            </li>
            <li>
              <Link to="/progress">Your progress</Link>
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
