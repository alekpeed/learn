import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isReviewDue, quality, daysBetween } from '@learn/learning-engine';
import { useCurriculum } from '../state/CurriculumContext.js';
import { useLearner } from '../state/LearnerContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { QuestionView } from '../components/QuestionView.js';
import { ScreenState } from '../components/ScreenState.js';
import { practiceRepository } from '../data/repository.js';

/**
 * Review queue (UX-006 + LRN-006). Lists skills whose next_review_at has passed
 * and lets the learner review one. Completing a review records a
 * review_completed event; the projection reschedules and the item leaves the
 * queue (review dates update correctly — Phase 4 exit criterion).
 */
export function ReviewQueue(): JSX.Element {
  const { package: pkg } = useCurriculum();
  const { learner } = useLearner();
  const { progress, refresh } = useProgress();
  const [now] = useState(() => new Date().toISOString());
  const [active, setActive] = useState<string | null>(null);

  const due = useMemo(() => {
    if (!pkg) return [];
    return [...progress.values()].filter(
      (p) => isReviewDue(p, now) && (pkg.questionsBySkill.get(p.skill_id)?.length ?? 0) > 0,
    );
  }, [pkg, progress, now]);

  if (!pkg) {
    return (
      <section>
        <h1>Review Queue</h1>
        <ScreenState status="error" message="Curriculum failed to load." />
      </section>
    );
  }

  if (due.length === 0) {
    return (
      <section>
        <h1>Review Queue</h1>
        <ScreenState status="empty" message="Nothing is due for review right now.">
          <Link to="/map">Back to curriculum map</Link>
        </ScreenState>
      </section>
    );
  }

  const activeSkill = active ?? due[0]!.skill_id;
  const question = pkg.questionsBySkill.get(activeSkill)?.[0];
  const progressForActive = progress.get(activeSkill);

  async function completeReview(snapshot: { hintsUsed: number; attempts: number }): Promise<void> {
    if (!learner || !progressForActive) return;
    const q = quality({
      correct: true,
      hints_used: snapshot.hintsUsed,
      attempt_number: snapshot.attempts,
    });
    const overdue = progressForActive.next_review_at
      ? Math.max(0, daysBetween(progressForActive.next_review_at, now))
      : 0;
    await practiceRepository.submitReview(learner.learner_id, {
      skill_id: activeSkill,
      success: q >= 0.6,
      quality: q,
      difficulty: question?.difficulty ?? 2,
      interval_days_at_review: progressForActive.last_interval_days,
      overdue_days: overdue,
    });
    await refresh();
    setActive(null);
  }

  return (
    <section>
      <h1>Review Queue</h1>
      <p className="progress-note">
        {due.length} skill{due.length === 1 ? '' : 's'} due for review.
      </p>
      <h2>{pkg.graph.skills.get(activeSkill)?.title ?? activeSkill}</h2>
      {question ? (
        <QuestionView
          key={activeSkill}
          question={question}
          learnerId={learner?.learner_id ?? null}
          onSolved={completeReview}
          nextLabel="Complete review"
        />
      ) : (
        <ScreenState status="empty" message="No review question available for this skill." />
      )}
    </section>
  );
}
