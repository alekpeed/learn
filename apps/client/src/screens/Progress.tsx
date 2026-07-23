import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MasteryDimension, LearningEvent } from '@learn/domain';
import { MASTERY_DIMENSIONS } from '@learn/domain';
import {
  summarizeProgress,
  masteryByUnit,
  dimensionAverages,
  currentStreak,
  type UnitMeta,
} from '@learn/learning-engine';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { useOptionalLearner } from '../state/LearnerContext.js';
import { eventStore } from '../data/repository.js';
import { DimensionRadar } from '../components/charts/DimensionRadar.js';
import { UnitBars } from '../components/charts/UnitBars.js';
import { ScreenState } from '../components/ScreenState.js';

const DIMENSION_LABEL: Record<MasteryDimension, string> = {
  understanding: 'Understanding',
  accuracy: 'Accuracy',
  independence: 'Independence',
  retention: 'Retention',
  transfer: 'Transfer',
};

/** Visual progress dashboard (doc 02 §10) — mastery by unit, strengths, and what's due. */
export function Progress(): JSX.Element {
  const { package: pkg } = useCurriculum();
  const { progress, loading } = useProgress();
  const learner = useOptionalLearner()?.learner ?? null;
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [now] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (!learner) return;
    let active = true;
    eventStore.getByLearner(learner.learner_id).then((e) => active && setEvents(e));
    return () => {
      active = false;
    };
  }, [learner, progress]);

  if (loading || !pkg) {
    return (
      <section>
        <h1>Your Progress</h1>
        <ScreenState status="loading" />
      </section>
    );
  }

  const summary = summarizeProgress(progress, pkg.graph, now);

  if (summary.started === 0) {
    return (
      <section>
        <h1>Your Progress</h1>
        <ScreenState
          status="empty"
          message="No practice yet. Start a skill from the curriculum map."
        >
          <Link to="/map">Open the curriculum map</Link>
        </ScreenState>
      </section>
    );
  }

  const units: UnitMeta[] = pkg.courses.flatMap((c) => c.units);
  const unitRows = masteryByUnit(progress, pkg.graph, units);
  const dims = dimensionAverages(progress, pkg.graph);
  const streak = currentStreak(events, now);
  const started = [...progress.values()].filter((p) => p.attempt_count > 0);

  const tiles = [
    { label: 'Skills mastered', value: `${summary.mastered}`, sub: `of ${summary.totalSkills}` },
    { label: 'In progress', value: `${summary.inProgress}`, sub: 'being learned' },
    { label: 'Reviews due', value: `${summary.dueReview}`, sub: 'to keep fresh' },
    {
      label: 'Day streak',
      value: `${streak}`,
      sub: streak === 1 ? 'day' : 'days',
    },
  ];

  return (
    <section className="progress-dashboard">
      <h1>Your Progress</h1>

      <ul className="stat-tiles" aria-label="Progress at a glance">
        {tiles.map((t) => (
          <li key={t.label} className="stat-tile">
            <span className="stat-value">{t.value}</span>
            <span className="stat-label">{t.label}</span>
            <span className="stat-sub">{t.sub}</span>
          </li>
        ))}
      </ul>

      {summary.dueReview > 0 && (
        <p className="dashboard-cta" role="status">
          <Link to="/review">
            Review {summary.dueReview} skill{summary.dueReview === 1 ? '' : 's'} due now →
          </Link>
        </p>
      )}

      <div className="dashboard-grid">
        <section className="dashboard-card" aria-labelledby="by-unit-h">
          <h2 id="by-unit-h">Mastery by unit</h2>
          <UnitBars units={unitRows} />
        </section>

        <section className="dashboard-card" aria-labelledby="strengths-h">
          <h2 id="strengths-h">Your strengths</h2>
          <p className="card-note">Average across the five mastery dimensions.</p>
          <DimensionRadar scores={dims} />
        </section>
      </div>

      <section className="dashboard-card" aria-labelledby="detail-h">
        <h2 id="detail-h">Skill detail</h2>
        <ul className="progress-list">
          {started.map((p) => {
            const title = pkg.graph.skills.get(p.skill_id)?.title ?? p.skill_id;
            return (
              <li key={p.skill_id} className="progress-item">
                <h3>
                  {title} — <span className="skill-state-label">{p.state.replace(/_/g, ' ')}</span>
                </h3>
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
      </section>
    </section>
  );
}
