/**
 * Mastery-by-unit as a set of labelled horizontal bars. Each bar is a native
 * progressbar (keyboard/AT friendly) whose fill encodes the share of skills
 * mastered; the trailing text carries the exact counts.
 */
import type { UnitProgress } from '@learn/learning-engine';

export function UnitBars({ units }: { units: UnitProgress[] }): JSX.Element {
  return (
    <ul className="unit-bars">
      {units.map((u) => {
        const pct = u.total > 0 ? Math.round((u.mastered / u.total) * 100) : 0;
        return (
          <li key={u.unitId} className="unit-bar-row">
            <div className="unit-bar-head">
              <span className="unit-bar-title">{u.title}</span>
              <span className="unit-bar-count">
                {u.mastered}/{u.total} mastered
              </span>
            </div>
            <div
              className="unit-bar"
              role="progressbar"
              aria-valuenow={u.mastered}
              aria-valuemin={0}
              aria-valuemax={u.total}
              aria-label={`${u.title}: ${u.mastered} of ${u.total} skills mastered`}
            >
              <span className="unit-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
