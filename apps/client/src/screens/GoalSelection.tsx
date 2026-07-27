/**
 * Goal Selection (doc 07 §1 flow, §2 "Goal Selection"). The spec lists five
 * things to collect and this screen collects exactly those:
 *
 *   Subject                - which installed course to focus on
 *   Starting preference    - walk from the beginning, or place with a diagnostic
 *   Session duration       - how long a sitting is
 *   Study frequency        - days per week
 *   Optional learning goal - free text, never interpreted by the app
 *
 * Everything here is a preference, so it is written through the ordinary
 * `settings_changed` event and can be changed later from Settings. Nothing on
 * this screen is required: "Skip for now" leaves the defaults in place, because
 * a learner who wants to start learning should not be held at a form.
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Learner, SessionDuration, StartingPoint } from '@learn/domain';
import { useLearner } from '../state/LearnerContext.js';
import { useCurriculum } from '../state/CurriculumContext.js';
import { ScreenState } from '../components/ScreenState.js';

const DURATIONS: { value: SessionDuration; label: string }[] = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 'custom', label: 'something else' },
];

const FREQUENCIES = [1, 2, 3, 4, 5, 6, 7];

export function GoalSelection(): JSX.Element {
  const { status, learner } = useLearner();

  if (status === 'loading') return <ScreenState status="loading" />;
  if (!learner) {
    return (
      <section>
        <h1>Goal Selection</h1>
        <ScreenState status="empty" message="Create a profile first." />
      </section>
    );
  }

  /*
   * The form is a separate component so its initial values are read from a
   * learner that has already loaded. Seeding the fields in the parent would
   * capture the pre-load defaults - and useState initialisers do not re-run -
   * so reopening the screen would quietly show 15 minutes to someone who had
   * saved 30.
   */
  return <GoalForm learner={learner} />;
}

function GoalForm({ learner }: { learner: Learner }): JSX.Element {
  const { updateSettings } = useLearner();
  const { package: pkg } = useCurriculum();
  const navigate = useNavigate();

  const prefs = learner.preferences;
  const [courseId, setCourseId] = useState<string>(learner.current_course_id ?? '');
  const [startingPoint, setStartingPoint] = useState<StartingPoint>(
    prefs.starting_point ?? 'beginning',
  );
  const [duration, setDuration] = useState<SessionDuration>(prefs.session_duration ?? 15);
  const [customMinutes, setCustomMinutes] = useState<number>(prefs.custom_duration_minutes ?? 20);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(prefs.study_days_per_week ?? 5);
  const [goalText, setGoalText] = useState<string>(prefs.learning_goal ?? '');
  const [busy, setBusy] = useState(false);

  // The first course is the default when nothing has been chosen, so the select
  // never shows a blank option the learner has to notice.
  const courses = pkg?.courses ?? [];
  const selectedCourse = courseId || (courses[0]?.course_id ?? '');

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await updateSettings({
        ...(selectedCourse ? { current_course_id: selectedCourse } : {}),
        preferences: {
          starting_point: startingPoint,
          session_duration: duration,
          ...(duration === 'custom' ? { custom_duration_minutes: customMinutes } : {}),
          study_days_per_week: daysPerWeek,
          learning_goal: goalText.trim(),
        },
      });
      navigate(startingPoint === 'diagnostic' ? '/diagnostic' : '/dashboard');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1>Goal Selection</h1>
      <p>
        A few choices to shape what you are offered. None of it is fixed - you can change any of it
        in Settings later.
      </p>

      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Subject</legend>
          <label htmlFor="goal-subject">What do you want to work on?</label>
          <select
            id="goal-subject"
            value={selectedCourse}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.title}
              </option>
            ))}
          </select>
          <p className="progress-note">
            Reviews that fall due in other subjects still come back - a subject decides what is
            offered next, not what is hidden.
          </p>
        </fieldset>

        <fieldset>
          <legend>Where to start</legend>
          <label className="choice">
            <input
              type="radio"
              name="starting-point"
              value="beginning"
              checked={startingPoint === 'beginning'}
              onChange={() => setStartingPoint('beginning')}
            />
            Start from the beginning
          </label>
          <label className="choice">
            <input
              type="radio"
              name="starting-point"
              value="diagnostic"
              checked={startingPoint === 'diagnostic'}
              onChange={() => setStartingPoint('diagnostic')}
            />
            Take a short diagnostic first, so I skip what I already know
          </label>
        </fieldset>

        <fieldset>
          <legend>How you want to study</legend>
          <label htmlFor="goal-duration">How long is a sitting?</label>
          <select
            id="goal-duration"
            value={String(duration)}
            onChange={(e) =>
              setDuration(
                e.target.value === 'custom'
                  ? 'custom'
                  : (Number(e.target.value) as SessionDuration),
              )
            }
          >
            {DURATIONS.map((d) => (
              <option key={String(d.value)} value={String(d.value)}>
                {d.label}
              </option>
            ))}
          </select>

          {duration === 'custom' && (
            <>
              <label htmlFor="goal-custom-minutes">Minutes per sitting</label>
              <input
                id="goal-custom-minutes"
                type="number"
                min={1}
                max={240}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value) || 1))}
              />
            </>
          )}

          <label htmlFor="goal-frequency">Days per week</label>
          <select
            id="goal-frequency"
            value={String(daysPerWeek)}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          >
            {FREQUENCIES.map((n) => (
              <option key={n} value={String(n)}>
                {n === 7 ? 'every day' : `${n} day${n === 1 ? '' : 's'} a week`}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <legend>Your goal (optional)</legend>
          <label htmlFor="goal-text">What are you working towards?</label>
          <textarea
            id="goal-text"
            rows={3}
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="e.g. get comfortable with algebra before starting the course in September"
          />
        </fieldset>

        <div className="question-actions">
          <button type="submit" disabled={busy}>
            {startingPoint === 'diagnostic' ? 'Save and take the diagnostic' : 'Save and start'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')}>
            Skip for now
          </button>
        </div>
      </form>
    </section>
  );
}
