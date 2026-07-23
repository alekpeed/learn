import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { DiagnosticSummary } from '@learn/diagnostic';
import { useCurriculum } from '../state/CurriculumContext.js';
import { ScreenState } from '../components/ScreenState.js';

/**
 * Diagnostic results (DIA-005, doc 07 Diagnostic Results): strong, weak, and
 * unknown areas, the recommended starting skill with an explanation, and an
 * override so the learner can choose a different starting point.
 */
export function DiagnosticResults(): JSX.Element {
  const { package: pkg } = useCurriculum();
  const location = useLocation();
  const navigate = useNavigate();
  const summary = location.state as DiagnosticSummary | null;

  const title = (id: string) => pkg?.graph.skills.get(id)?.title ?? id;
  const [override, setOverride] = useState<string>(summary?.recommendedSkillId ?? '');

  if (!summary) {
    return (
      <section>
        <h1>Diagnostic Results</h1>
        <ScreenState status="empty" message="No diagnostic results yet.">
          <Link to="/diagnostic">Take the diagnostic</Link>
        </ScreenState>
      </section>
    );
  }

  const untested = pkg
    ? pkg.order.filter((id) => !summary.strong.includes(id) && !summary.weak.includes(id))
    : [];

  function start(skillId: string): void {
    // Prefer a lesson if one exists, otherwise go to practice.
    const target = pkg?.lessonBySkill.has(skillId)
      ? `/lesson?skill=${encodeURIComponent(skillId)}`
      : `/practice?skill=${encodeURIComponent(skillId)}`;
    navigate(target);
  }

  return (
    <section>
      <h1>Diagnostic Results</h1>

      <p>{summary.explanation}</p>

      {summary.recommendedSkillId && (
        <div className="feedback" data-status="success" role="status">
          <p>
            Recommended starting point: <strong>{title(summary.recommendedSkillId)}</strong>
          </p>
          <button type="button" onClick={() => start(summary.recommendedSkillId!)}>
            Start here
          </button>
        </div>
      )}

      <h2>Strong areas</h2>
      {summary.strong.length ? (
        <ul>
          {summary.strong.map((id) => (
            <li key={id}>{title(id)}</li>
          ))}
        </ul>
      ) : (
        <p className="progress-note">None identified yet.</p>
      )}

      <h2>Weak areas</h2>
      {summary.weak.length ? (
        <ul>
          {summary.weak.map((id) => (
            <li key={id}>{title(id)}</li>
          ))}
        </ul>
      ) : (
        <p className="progress-note">None identified.</p>
      )}

      <h2>Not yet tested</h2>
      {untested.length ? (
        <ul>
          {untested.map((id) => (
            <li key={id}>{title(id)}</li>
          ))}
        </ul>
      ) : (
        <p className="progress-note">Everything available was tested.</p>
      )}

      {pkg && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (override) start(override);
          }}
        >
          <h2>Prefer to start somewhere else?</h2>
          <label htmlFor="override">Choose a starting skill</label>
          <select id="override" value={override} onChange={(e) => setOverride(e.target.value)}>
            {pkg.order.map((id) => (
              <option key={id} value={id}>
                {title(id)}
              </option>
            ))}
          </select>
          <div className="question-actions">
            <button type="submit" disabled={!override}>
              Start here instead
            </button>
            <Link to="/map">Or browse the curriculum map</Link>
          </div>
        </form>
      )}
    </section>
  );
}
