/**
 * Author-gated review of AI-proposed practice questions (Phase 19, DEC-005/010).
 *
 * Every candidate shown here has already survived deterministic screening. This
 * screen exists for the checks a machine cannot make: is the answer actually
 * right, and is this worth a learner's time. Nothing is published until items
 * are explicitly ticked and the publish button is pressed, and publishing
 * revalidates the whole course before it replaces anything.
 */
import { useState } from 'react';
import type { Question } from '@learn/curriculum';
import {
  buildDraftPrompt,
  parseDraftCandidates,
  TutorGateway,
  type TutorContext,
} from '@learn/ai-gateway';
import type { ModuleStore } from '@learn/persistence';
import { useCurriculum } from '../state/CurriculumContext.js';
import { screenDrafts, type ScreeningOutcome } from '../authoring/screenDraft.js';
import { publishApprovedDrafts, publishedCourseName } from '../authoring/publishDrafts.js';
import { moduleStore as defaultStore } from '../data/repository.js';

export function DraftReview({
  gateway,
  store = defaultStore,
}: {
  gateway: TutorGateway;
  store?: ModuleStore;
}): JSX.Element {
  const { package: pkg, activeModuleName, reloadModules } = useCurriculum();
  const [skillId, setSkillId] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ScreeningOutcome | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const skills = pkg?.skills ?? [];

  async function onPropose(): Promise<void> {
    if (!pkg || !skillId) return;
    setBusy(true);
    setOutcome(null);
    setApproved(new Set());
    setStatus(null);
    setErrors([]);

    const skill = pkg.graph.skills.get(skillId);
    const context: TutorContext = {
      skill_id: skillId,
      skill_title: skill?.title ?? skillId,
      objective: skill?.objectives[0],
      lesson_excerpt: pkg.lessonBySkill.get(skillId)?.components[0]?.body,
    };

    const result = await gateway.ask({
      mode: 'extend',
      context,
      question: buildDraftPrompt({ context, count: 3 }),
    });

    const candidates = parseDraftCandidates(result.text);
    if (candidates.length === 0) {
      setErrors(['The tutor did not return anything usable. Nothing was added.']);
      setBusy(false);
      return;
    }
    setOutcome(screenDrafts(candidates, skillId, pkg));
    setBusy(false);
  }

  function toggle(id: string): void {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onPublish(): Promise<void> {
    if (!pkg || !outcome) return;
    const additions: Question[] = outcome.accepted
      .map((a) => a.question)
      .filter((q) => approved.has(q.question_id));
    if (additions.length === 0) return;

    setBusy(true);
    const name = publishedCourseName(activeModuleName);
    const result = await publishApprovedDrafts(pkg, additions, name, store);
    setBusy(false);

    if (!result.ok) {
      setErrors(['These questions were not published:', ...result.errors]);
      return;
    }
    setStatus(
      `Published ${result.questionCount} question${result.questionCount === 1 ? '' : 's'} into "${name}".`,
    );
    setOutcome(null);
    setApproved(new Set());
    await reloadModules();
  }

  return (
    <section aria-label="Draft practice questions">
      <h2>Draft questions with the tutor</h2>
      <p className="card-note">
        The tutor can suggest practice questions. Suggestions are checked automatically, then
        nothing is added until you approve it. Approving rebuilds and revalidates the whole course,
        so a bad question cannot get in.
      </p>

      {errors.length > 0 && (
        <div className="feedback" role="alert" data-status="error">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
      {status && (
        <p className="feedback" role="status" data-status="success">
          {status}
        </p>
      )}

      <label htmlFor="draft-skill">Skill to write questions for</label>
      <select id="draft-skill" value={skillId} onChange={(e) => setSkillId(e.target.value)}>
        <option value="">Choose a skill</option>
        {skills.map((s) => (
          <option key={s.skill_id} value={s.skill_id}>
            {s.title}
          </option>
        ))}
      </select>
      <button type="button" onClick={onPropose} disabled={!skillId || busy}>
        {busy ? 'Working...' : 'Suggest questions'}
      </button>

      {outcome && (
        <div className="draft-outcome">
          <h3>
            {outcome.accepted.length} passed the automatic checks
            {outcome.rejected.length > 0 && `, ${outcome.rejected.length} rejected`}
          </h3>

          {outcome.accepted.length === 0 && (
            <p className="card-note">
              Nothing to review. Try again, or write the question yourself.
            </p>
          )}

          <ul className="draft-list">
            {outcome.accepted.map(({ question, notes }) => (
              <li key={question.question_id} className="draft-item">
                <label>
                  <input
                    type="checkbox"
                    checked={approved.has(question.question_id)}
                    onChange={() => toggle(question.question_id)}
                  />
                  Approve this question
                </label>
                <p className="draft-prompt">{question.prompt}</p>
                <p className="draft-answer">
                  Answer: <strong>{String(question.answer_spec.correct_answer)}</strong> (
                  {question.validator})
                </p>
                {question.explanation && <p className="explanation">{question.explanation}</p>}
                {notes.length > 0 && (
                  <ul className="draft-notes">
                    {notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          {outcome.rejected.length > 0 && (
            <details className="draft-rejected">
              <summary>Why {outcome.rejected.length} were rejected</summary>
              <ul>
                {outcome.rejected.map((r) => (
                  <li key={r.index}>{r.problems.join('; ')}</li>
                ))}
              </ul>
            </details>
          )}

          <button type="button" onClick={onPublish} disabled={approved.size === 0 || busy}>
            Publish {approved.size} approved question{approved.size === 1 ? '' : 's'}
          </button>
        </div>
      )}
    </section>
  );
}
