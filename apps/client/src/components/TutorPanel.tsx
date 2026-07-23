/**
 * Ask-tutor panel (doc 07 Lesson: "Ask tutor"). Off by default (DEC-010); when
 * disabled it points to Settings and reminds the learner that lessons and
 * practice work without it. When enabled, it calls the isolated tutor gateway,
 * which returns display text only — never a change to verified state.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  buildTutorContext,
  type TutorContextInput,
  type TutorMode,
  type TutorResult,
} from '@learn/ai-gateway';
import { useOptionalLearner } from '../state/LearnerContext.js';
import { tutorGateway } from '../data/tutor.js';

const MODE_LABELS: Record<TutorMode, string> = {
  explain: 'Explain differently',
  guide: 'Guide me',
  compare: 'Compare methods',
  diagnose: 'Why was I wrong?',
  extend: 'Take it further',
};

export function TutorPanel({
  context,
  modes = ['explain', 'guide'],
}: {
  context: TutorContextInput;
  modes?: TutorMode[];
}): JSX.Element {
  const learnerCtx = useOptionalLearner();
  const enabled = learnerCtx?.learner?.preferences.ai_tutor_enabled ?? false;
  const [result, setResult] = useState<TutorResult | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <aside className="tutor-panel" aria-label="AI tutor">
        <p className="progress-note">
          The AI tutor is off. Turn it on in <Link to="/settings">Settings</Link>. Your lessons,
          hints, and practice work without it.
        </p>
      </aside>
    );
  }

  async function ask(mode: TutorMode): Promise<void> {
    setBusy(true);
    try {
      setResult(await tutorGateway.ask({ mode, context: buildTutorContext(context) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="tutor-panel" aria-label="AI tutor">
      <h2>Ask the tutor</h2>
      <div className="question-actions">
        {modes.map((mode) => (
          <button key={mode} type="button" onClick={() => ask(mode)} disabled={busy}>
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>
      {result && (
        <div
          className="tutor-response"
          role="region"
          aria-label="Tutor response"
          aria-live="polite"
          data-status={result.status}
        >
          {result.status !== 'ok' && (
            <p className="progress-note">
              {result.status === 'unavailable'
                ? 'Tutor unavailable — showing your verified lesson material.'
                : 'Showing verified material instead of the tutor response.'}
            </p>
          )}
          {result.text.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </aside>
  );
}
