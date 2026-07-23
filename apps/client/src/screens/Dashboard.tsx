import { Link } from 'react-router-dom';
import { useLearner } from '../state/LearnerContext.js';
import { ScreenState } from '../components/ScreenState.js';

export function Dashboard(): JSX.Element {
  const { status, learner } = useLearner();

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
          <p>Hello, {learner.display_name}. Curriculum and progress arrive in later phases.</p>
          <ul>
            <li>
              <Link to="/lesson">Continue learning</Link>
            </li>
            <li>
              <Link to="/review">Reviews due</Link>
            </li>
            <li>
              <Link to="/map">Curriculum map</Link>
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
