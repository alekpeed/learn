/**
 * Sticking points (Phase 17): the specific misunderstandings a learner keeps
 * repeating, with the author's correction and a way to act on it.
 *
 * This is the payoff of tagging wrong answers in content. A skill-level score
 * says "fractions are shaky"; this says "you are adding denominators", which is
 * the thing a learner can actually fix. Everything shown is projected from the
 * event log and read from the curriculum catalog - nothing is generated.
 */
import { Link } from 'react-router-dom';
import type { MisconceptionOccurrence } from '@learn/learning-engine';
import { useCurriculum } from '../state/CurriculumContext.js';

export function StickingPoints({
  misconceptions,
}: {
  misconceptions: MisconceptionOccurrence[];
}): JSX.Element {
  const { package: pkg } = useCurriculum();
  const active = misconceptions.filter((m) => m.active);

  if (active.length === 0) {
    return (
      <div className="dashboard-card">
        <h2>Sticking points</h2>
        <p className="card-note">
          Nothing recurring right now. A mistake shows up here once it happens more than once on the
          same skill.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h2>Sticking points</h2>
      <p className="card-note">
        Mistakes you have made more than once. These clear once you get the skill right twice in a
        row.
      </p>
      <ul className="sticking-list">
        {active.map((m) => {
          const record = pkg?.misconceptionById.get(m.misconception_id);
          const skill = pkg?.graph.skills.get(m.skill_id);
          if (!record) return null;
          return (
            <li key={`${m.skill_id} ${m.misconception_id}`} className="sticking-item">
              <h3>{skill?.title ?? m.skill_id}</h3>
              <p className="sticking-what">{record.description}</p>
              <p className="sticking-fix">{record.corrective_explanation}</p>
              <p className="sticking-actions">
                <Link to={`/practice?skill=${encodeURIComponent(m.skill_id)}`}>Practice this</Link>
                <span className="sticking-count">
                  {' '}
                  seen {m.occurrences} times
                  {m.correct_since > 0 ? `, ${m.correct_since} right since` : ''}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
