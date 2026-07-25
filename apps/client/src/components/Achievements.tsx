/**
 * Achievements card (Phase 25 gamification tier).
 *
 * Every badge is recomputed from the event log each time this renders, so there
 * is nothing stored to go stale and nothing to migrate. Progress toward an
 * unearned badge is shown as text and a meter, never colour alone.
 *
 * Nothing here compares one learner with another: the spec excludes competitive
 * leaderboards, and on a local-first app there would be nobody to compare with.
 */
import type { Achievement } from '@learn/learning-engine';

function formatDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function Achievements({ achievements }: { achievements: Achievement[] }): JSX.Element {
  const earned = achievements.filter((a) => a.earned);

  return (
    <section className="dashboard-card" aria-labelledby="achievements-h">
      <h2 id="achievements-h">Achievements</h2>
      <p className="progress-note">
        {earned.length} of {achievements.length} earned.
      </p>
      <ul className="achievement-list">
        {achievements.map((a) => {
          const when = formatDate(a.earned_at);
          return (
            <li key={a.id} className="achievement" data-earned={a.earned}>
              <span className="achievement-mark" aria-hidden="true">
                {a.earned ? '★' : '☆'}
              </span>
              <div>
                <p className="achievement-title">
                  {a.title}
                  <span className="achievement-state">
                    {a.earned ? (when ? ` earned ${when}` : ' earned') : ' not yet earned'}
                  </span>
                </p>
                <p className="achievement-desc">{a.description}</p>
                {!a.earned && a.target > 1 && (
                  <p className="achievement-progress">
                    {a.current} of {a.target}
                    <progress value={a.current} max={a.target}>
                      {a.current} of {a.target}
                    </progress>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
