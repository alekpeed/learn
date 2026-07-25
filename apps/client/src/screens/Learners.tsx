/**
 * Learners screen (Phase 25 multi-learner tier).
 *
 * Several people sharing one device, each with their own progress. The storage
 * layer has keyed every event by learner since Phase 1, so this screen is
 * mostly a way to reach what was already there - no data migration was needed.
 *
 * This is the local, single-device subset of what the roadmap calls a teacher
 * dashboard: an adult can see each learner's progress side by side on the
 * family computer. Real classrooms need accounts and a server, which this app
 * does not have; nothing here reaches beyond the device.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Learner, MasteryScores } from '@learn/domain';
import { DEFAULT_MASTERY_THRESHOLDS } from '@learn/domain';
import { projectProgress, summarizeProgress, type ThresholdLookup } from '@learn/learning-engine';
import { useLearner } from '../state/LearnerContext.js';
import { useCurriculum } from '../state/CurriculumContext.js';
import { ScreenState } from '../components/ScreenState.js';
import { eventStore } from '../data/repository.js';

interface Row {
  learner: Learner;
  mastered: number;
  started: number;
  total: number;
}

export function Learners(): JSX.Element {
  const { learner, learners, createProfile, switchTo, deleteLearner, status } = useLearner();
  const { package: pkg } = useCurriculum();
  const [name, setName] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const thresholds = useMemo<ThresholdLookup>(() => {
    return (skillId: string): MasteryScores =>
      pkg?.graph.skills.get(skillId)?.mastery_thresholds ?? DEFAULT_MASTERY_THRESHOLDS;
  }, [pkg]);

  // Each learner's summary is projected from that learner's own events through
  // exactly the same functions that drive their own Progress screen, so there
  // is no second, divergent definition of "started" or "mastered" to drift.
  useEffect(() => {
    let cancelled = false;
    if (!pkg) return;
    const now = new Date().toISOString();
    Promise.all(
      learners.map(async (l): Promise<Row> => {
        const events = await eventStore.getByLearner(l.learner_id);
        const summary = summarizeProgress(projectProgress(events, thresholds), pkg.graph, now);
        return {
          learner: l,
          mastered: summary.mastered,
          started: summary.started,
          total: summary.totalSkills,
        };
      }),
    )
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [learners, pkg, thresholds]);

  async function onAdd(e: FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await createProfile(trimmed);
      setName('');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return (
      <section>
        <h1>Learners</h1>
        <ScreenState status="loading" />
      </section>
    );
  }

  return (
    <section>
      <h1>Learners</h1>
      <p>
        Each person using this device has their own profile and their own progress. Everything stays
        on this device.
      </p>

      {learners.length === 0 ? (
        <ScreenState status="empty" message="No profiles yet. Add one below to get started." />
      ) : (
        <table className="learner-table">
          <caption className="visually-hidden">Profiles on this device and their progress</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Skills started</th>
              <th scope="col">Skills mastered</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {learners.map((l) => {
              const row = rows?.find((r) => r.learner.learner_id === l.learner_id);
              const active = l.learner_id === learner?.learner_id;
              return (
                <tr key={l.learner_id}>
                  <th scope="row">
                    {l.display_name}
                    {active && <span className="badge-active"> in use</span>}
                  </th>
                  <td>{row ? `${row.started} of ${row.total}` : '-'}</td>
                  <td>{row ? row.mastered : '-'}</td>
                  <td className="learner-actions">
                    {!active && (
                      <button type="button" onClick={() => void switchTo(l.learner_id)}>
                        Switch to {l.display_name}
                      </button>
                    )}
                    {confirming === l.learner_id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirming(null);
                            void deleteLearner(l.learner_id);
                          }}
                        >
                          Confirm delete
                        </button>
                        <button type="button" onClick={() => setConfirming(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConfirming(l.learner_id)}>
                        Delete {l.display_name}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {confirming && (
        <p role="alert">
          Deleting a profile removes that person&apos;s progress from this device permanently. This
          cannot be undone.
        </p>
      )}

      <form onSubmit={(e) => void onAdd(e)}>
        <fieldset>
          <legend>Add a learner</legend>
          <label htmlFor="new-learner-name">Name</label>
          <input
            id="new-learner-name"
            name="new-learner-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" disabled={!name.trim() || busy}>
            Add learner
          </button>
        </fieldset>
      </form>
    </section>
  );
}
