/**
 * Mastery Check (doc 07 "Mastery Check", doc 04 step 9 of 10).
 *
 * The spec asks for five things, and each maps to something visible here:
 *
 *   No ordinary hints        - QuestionView runs in mode="check", which removes
 *                              the hint button and the tutor panel.
 *   Clear start and finish   - an explicit start panel saying what is coming,
 *                              and an explicit result panel at the end.
 *   Mixed item forms         - selectMasteryCheckItems spreads across question
 *                              types before it spreads across difficulty.
 *   Immediate result         - the verdict appears as soon as the last item is
 *                              answered, with no navigation in between.
 *   Specific recommendation  - gradeMasteryCheck names the misconception, the
 *                              missed items, or the dimension that fell short.
 *
 * Answers are recorded as ordinary `answer_submitted` events, so the existing
 * scorer promotes the skill on its own terms and the verdict is read back out of
 * the normal projection (DEC-006). A check writes no privileged state.
 */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Question } from '@learn/curriculum';
import { DEFAULT_MASTERY_THRESHOLDS } from '@learn/domain';
import {
  selectMasteryCheckItems,
  gradeMasteryCheck,
  projectProgress,
  MASTERY_CHECK_SIZE,
  type CheckAnswer,
  type MasteryCheckResult,
} from '@learn/learning-engine';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useLearner } from '../state/LearnerContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { QuestionView } from '../components/QuestionView.js';
import { ScreenState } from '../components/ScreenState.js';
import { RemediationNote } from '../components/RemediationNote.js';
import { eventStore, practiceRepository } from '../data/repository.js';

type Phase = 'idle' | 'running' | 'finished';

export function MasteryCheckScreen(): JSX.Element {
  const { package: pkg, errors } = useCurriculum();
  const { learner } = useLearner();
  const { progress, exposure, refresh } = useProgress();
  const [params] = useSearchParams();
  const skillId = params.get('skill');

  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<CheckAnswer[]>([]);
  const [result, setResult] = useState<MasteryCheckResult | null>(null);

  const skill = skillId ? pkg?.graph.skills.get(skillId) : undefined;
  const pool = useMemo(
    () => (skillId ? (pkg?.questionsBySkill.get(skillId) ?? []) : []),
    [pkg, skillId],
  );

  if (!pkg) {
    return (
      <section>
        <h1>Mastery Check</h1>
        <ScreenState status="error" message={`Curriculum failed to load: ${errors.join('; ')}`} />
      </section>
    );
  }

  if (!skillId || !skill) {
    return (
      <section>
        <h1>Mastery Check</h1>
        <ScreenState
          status="empty"
          message="Choose a skill to be checked on. Open a skill from the curriculum map and start its check from there."
        >
          <Link to="/map">Open the curriculum map</Link>
        </ScreenState>
      </section>
    );
  }

  if (pool.length === 0) {
    return (
      <section>
        <h1>Mastery Check</h1>
        <ScreenState status="empty" message="This skill has no questions to check yet." />
      </section>
    );
  }

  function start(): void {
    const chosen = selectMasteryCheckItems(pool, exposure, MASTERY_CHECK_SIZE);
    setItems(chosen as Question[]);
    setIndex(0);
    setAnswers([]);
    setResult(null);
    setPhase('running');
    if (learner && skillId) {
      void practiceRepository.startMasteryCheck(learner.learner_id, {
        skill_id: skillId,
        question_ids: chosen.map((q) => q.question_id),
      });
    }
  }

  async function record(answer: CheckAnswer): Promise<void> {
    const all = [...answers, answer];
    setAnswers(all);

    /*
     * Advancing on its own here would be indistinguishable from a misfire: with
     * no feedback shown, the question would simply be replaced the instant
     * Submit was pressed. The learner moves on themselves, once they have seen
     * that the answer was taken.
     */
    if (all.length < items.length) return;

    /*
     * Last item. Project straight from the log rather than waiting on the
     * context: refresh() sets React state, and the value captured in this
     * closure would still be the pre-check one, so the verdict would be graded
     * against progress that predates the answers it is judging.
     */
    const thresholds = skill?.mastery_thresholds ?? DEFAULT_MASTERY_THRESHOLDS;
    const latest = learner
      ? projectProgress(await eventStore.getByLearner(learner.learner_id), () => thresholds).get(
          skillId as string,
        )
      : undefined;
    const graded = gradeMasteryCheck(all, latest, thresholds);
    // Bring the rest of the app in line with what the check just recorded.
    void refresh();
    setResult(graded);
    setPhase('finished');
    if (learner && skillId) {
      void practiceRepository.completeMasteryCheck(learner.learner_id, {
        skill_id: skillId,
        outcome: graded.outcome,
        correct: graded.correct,
        total: graded.total,
      });
    }
  }

  const title = skill.title;

  if (phase === 'idle') {
    return (
      <section>
        <h1>Mastery Check</h1>
        <div className="check-panel">
          <h2>{title}</h2>
          <p>
            A mastery check is {Math.min(MASTERY_CHECK_SIZE, pool.length)} questions of mixed kinds,
            answered without hints. You will not see whether each answer was right until the end.
          </p>
          <p className="progress-note">
            Nothing is at stake: a check you do not pass simply tells you what to work on, and you
            can take it again.
          </p>
          <button type="button" onClick={start}>
            Start the check
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'running') {
    const question = items[index];
    if (!question) return <ScreenState status="loading" />;
    const answered = answers.length > index;
    return (
      <section>
        <h1>Mastery Check</h1>
        <p className="progress-note">
          {title}: question {index + 1} of {items.length}. No hints during a check.
        </p>
        <QuestionView
          key={question.question_id}
          question={question}
          learnerId={learner?.learner_id ?? null}
          mode="check"
          onAnswered={(r) =>
            void record({
              question_id: question.question_id,
              skill_id: question.skill_id,
              correct: r.correct,
              ...(r.misconceptionId ? { misconception_id: r.misconceptionId } : {}),
            })
          }
        />
        {answered && (
          <div className="question-actions">
            <button type="button" onClick={() => setIndex((i) => i + 1)}>
              Next question
            </button>
          </div>
        )}
      </section>
    );
  }

  const passed = result?.outcome === 'passed';
  return (
    <section>
      <h1>Mastery Check</h1>
      <div className="check-panel" role="status" data-outcome={result?.outcome}>
        <h2>{passed ? `Passed: ${title}` : `Not yet: ${title}`}</h2>
        <p>
          You answered {result?.correct} of {result?.total} correctly.
        </p>
        <p>{result?.recommendation}</p>

        {result && result.misconceptions.length > 0 && (
          <div>
            {result.misconceptions.map((id) => (
              <RemediationNote key={id} misconceptionId={id} recurring={false} />
            ))}
          </div>
        )}

        {result && result.shortfalls.length > 0 && (
          <>
            <h3>Still below the level this skill needs</h3>
            <ul>
              {result.shortfalls.map((s) => (
                <li key={s.dimension}>
                  {s.dimension}: {Math.round(s.score)} of {s.threshold} needed
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="question-actions">
          <button type="button" onClick={start}>
            Take it again
          </button>
          <Link to={`/practice?skill=${skillId}`}>Practise this skill</Link>{' '}
          <Link to="/map">Back to the curriculum map</Link>
        </div>
      </div>
    </section>
  );
}
