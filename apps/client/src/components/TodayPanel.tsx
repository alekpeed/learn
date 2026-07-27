/**
 * Today's study plan (Version 1). Shows the daily-goal progress, the current
 * streak, and what to do next: due reviews and the next skill to work on.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LearningEvent } from '@learn/domain';
import {
  answeredOn,
  currentStreak,
  projectMisconceptions,
  selectTodaysSession,
} from '@learn/learning-engine';
import { useOptionalLearner } from '../state/LearnerContext.js';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { useSubjectSkills } from '../state/useSubjectSkills.js';
import { eventStore } from '../data/repository.js';

export function TodayPanel(): JSX.Element | null {
  const learner = useOptionalLearner()?.learner ?? null;
  const { package: pkg } = useCurriculum();
  const { progress } = useProgress();
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [now] = useState(() => new Date().toISOString());
  // Shared with the practice screen so the two cannot disagree about what the
  // chosen subject covers.
  const focusSkills = useSubjectSkills();

  useEffect(() => {
    if (!learner) return;
    let active = true;
    eventStore.getByLearner(learner.learner_id).then((e) => active && setEvents(e));
    return () => {
      active = false;
    };
  }, [learner, progress]);

  if (!learner || !pkg) return null;

  const goal = learner.preferences.daily_goal_questions;
  const done = answeredOn(events, now);
  const streak = currentStreak(events, now);
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  // Passing the misconception projection lets a skill the learner keeps getting
  // wrong the same way outrank the frontier as the next thing to do (Phase 17).
  const session = selectTodaysSession(
    progress,
    pkg.graph,
    pkg.order,
    now,
    projectMisconceptions(events),
    focusSkills,
  );
  const nextTitle = session.nextSkill
    ? (pkg.graph.skills.get(session.nextSkill)?.title ?? session.nextSkill)
    : null;
  const nextHasLesson = session.nextSkill ? pkg.lessonBySkill.has(session.nextSkill) : false;

  return (
    <section className="today-panel" aria-label="Today's plan">
      <div className="today-head">
        <h2>Today</h2>
        <span className="streak" title="Consecutive days practiced">
          {streak > 0 ? `🔥 ${streak}-day streak` : 'Start a streak today'}
        </span>
      </div>

      <p className="today-goal">
        <span className="visually-hidden">Daily goal progress: </span>
        {done} of {goal} questions
      </p>
      <div
        className="goal-bar"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label="Daily goal"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      {done >= goal && goal > 0 && (
        <p className="progress-note" role="status">
          Daily goal reached — nice work.
        </p>
      )}

      <ul className="today-actions">
        {session.dueSkills.length > 0 && (
          <li>
            <Link to="/review">
              Review {session.dueSkills.length} due skill
              {session.dueSkills.length === 1 ? '' : 's'}
            </Link>
          </li>
        )}
        {session.nextSkill && (
          <li>
            <Link
              to={
                nextHasLesson
                  ? `/lesson?skill=${encodeURIComponent(session.nextSkill)}`
                  : `/practice?skill=${encodeURIComponent(session.nextSkill)}`
              }
            >
              Continue: {nextTitle}
            </Link>
          </li>
        )}
        {session.dueSkills.length === 0 && !session.nextSkill && (
          <li>
            <Link to="/map">Explore the curriculum map</Link>
          </li>
        )}
      </ul>
    </section>
  );
}
