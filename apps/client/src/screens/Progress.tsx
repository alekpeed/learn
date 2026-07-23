import type { MasteryDimension } from '@learn/domain';
import { MASTERY_DIMENSIONS } from '@learn/domain';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { ScreenState } from '../components/ScreenState.js';

const DIMENSION_LABEL: Record<MasteryDimension, string> = {
  understanding: 'Understanding',
  accuracy: 'Accuracy',
  independence: 'Independence',
  retention: 'Retention',
  transfer: 'Transfer',
};

/** Progress details at the skill level (doc 02 §10) — not one course percentage. */
export function Progress(): JSX.Element {
  const { package: pkg } = useCurriculum();
  const { progress, loading } = useProgress();

  if (loading) {
    return (
      <section>
        <h1>Your Progress</h1>
        <ScreenState status="loading" />
      </section>
    );
  }

  const started = [...progress.values()].filter((p) => p.attempt_count > 0);

  return (
    <section>
      <h1>Your Progress</h1>
      {started.length === 0 ? (
        <ScreenState
          status="empty"
          message="No practice yet. Start a skill from the curriculum map."
        />
      ) : (
        <ul className="progress-list">
          {started.map((p) => {
            const title = pkg?.graph.skills.get(p.skill_id)?.title ?? p.skill_id;
            return (
              <li key={p.skill_id} className="progress-item">
                <h2>
                  {title} — <span className="skill-state-label">{p.state.replace(/_/g, ' ')}</span>
                </h2>
                <dl className="score-grid">
                  {MASTERY_DIMENSIONS.map((d: MasteryDimension) => (
                    <div key={d} className="score-cell">
                      <dt>{DIMENSION_LABEL[d]}</dt>
                      <dd>
                        <meter min={0} max={100} value={Math.round(p.scores[d])}>
                          {Math.round(p.scores[d])}
                        </meter>{' '}
                        {Math.round(p.scores[d])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
