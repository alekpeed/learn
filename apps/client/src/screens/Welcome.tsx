import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearner } from '../state/LearnerContext.js';
import { ScreenState } from '../components/ScreenState.js';

export function Welcome(): JSX.Element {
  const { status, learner, createProfile } = useLearner();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'loading') return <ScreenState status="loading" />;
  if (status === 'error') return <ScreenState status="error" />;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await createProfile(name.trim());
      // Doc 07 §1: Welcome -> Profile -> Goal Selection -> Diagnostic or start
      // from the beginning. Goal Selection can be skipped from there.
      navigate('/goal');
    } finally {
      setBusy(false);
    }
  }

  if (learner) {
    return (
      <section>
        <h1>Welcome back, {learner.display_name}</h1>
        <p>Pick up where you left off.</p>
        <button type="button" onClick={() => navigate('/dashboard')}>
          Continue learning
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Welcome</h1>
      <p>
        Learn mathematics and scientific reasoning from the ground up. Your progress is saved on
        this device.
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="display-name">Your name</label>
        <input
          id="display-name"
          name="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          required
        />
        <button type="submit" disabled={!name.trim() || busy}>
          Start learning
        </button>
      </form>
    </section>
  );
}
