/**
 * Remediation for a detected misconception (Phase 17).
 *
 * When the deterministic diagnoser matches an authored wrong answer, it names a
 * misconception; this looks that up in the curriculum catalog and shows the
 * author's corrective explanation. Nothing here is generated - the text is
 * content, so remediation works offline, with the AI tutor off, and reads the
 * same way every time.
 */
import { Link } from 'react-router-dom';
import { useOptionalCurriculum } from '../state/CurriculumContext.js';

export function RemediationNote({
  misconceptionId,
  /** True once the learner has hit this same trap more than once. */
  recurring = false,
}: {
  misconceptionId: string | undefined;
  recurring?: boolean;
}): JSX.Element | null {
  const pkg = useOptionalCurriculum()?.package;
  if (!misconceptionId) return null;

  const record = pkg?.misconceptionById.get(misconceptionId);
  // Content the loader would have rejected; render nothing rather than an empty box.
  if (!record) return null;

  const prereq = record.recommended_prerequisite_check;
  const prereqTitle = prereq ? pkg?.graph.skills.get(prereq)?.title : undefined;

  return (
    <section className="remediation" aria-label="How to fix this" data-recurring={recurring}>
      <h3>{recurring ? 'This one keeps coming up' : 'What went wrong'}</h3>
      <p>{record.corrective_explanation}</p>
      {recurring && prereq && prereqTitle && (
        <p className="remediation-prereq">
          It often helps to go back over{' '}
          <Link to={`/lesson?skill=${encodeURIComponent(prereq)}`}>{prereqTitle}</Link>.
        </p>
      )}
    </section>
  );
}
