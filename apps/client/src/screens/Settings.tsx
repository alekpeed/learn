import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TextSize, Contrast } from '@learn/domain';
import { useLearner } from '../state/LearnerContext.js';
import { useProgress } from '../state/ProgressContext.js';
import { DataSettings } from '../components/DataSettings.js';
import { AiTutorSettings } from '../components/AiTutorSettings.js';
import { ScreenState } from '../components/ScreenState.js';

const TEXT_SIZES: TextSize[] = ['small', 'medium', 'large', 'x-large'];

export function Settings(): JSX.Element {
  const { status, learner, updateSettings, resetAll, reload } = useLearner();
  const { refresh } = useProgress();
  const navigate = useNavigate();
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (status === 'loading' || !learner) {
    return (
      <section>
        <h1>Settings</h1>
        <ScreenState
          status={status === 'loading' ? 'loading' : 'empty'}
          message={status === 'loading' ? undefined : 'Create a profile first.'}
        />
      </section>
    );
  }

  const a11y = learner.accessibility_settings;
  const prefs = learner.preferences;

  async function doReset(): Promise<void> {
    await resetAll();
    navigate('/');
  }

  return (
    <section>
      <h1>Settings</h1>

      <fieldset>
        <legend>Accessibility</legend>

        <label htmlFor="text-size">Text size</label>
        <select
          id="text-size"
          value={a11y.text_size}
          onChange={(e) =>
            updateSettings({ accessibility_settings: { text_size: e.target.value as TextSize } })
          }
        >
          {TEXT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label htmlFor="contrast">Contrast</label>
        <select
          id="contrast"
          value={a11y.contrast}
          onChange={(e) =>
            updateSettings({ accessibility_settings: { contrast: e.target.value as Contrast } })
          }
        >
          <option value="normal">normal</option>
          <option value="high">high</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={a11y.reduced_motion}
            onChange={(e) =>
              updateSettings({ accessibility_settings: { reduced_motion: e.target.checked } })
            }
          />
          Reduce motion
        </label>
      </fieldset>

      <fieldset>
        <legend>Learning</legend>
        <label htmlFor="daily-goal">Daily goal (questions per day)</label>
        <input
          id="daily-goal"
          type="number"
          min={1}
          max={100}
          value={prefs.daily_goal_questions}
          onChange={(e) =>
            updateSettings({
              preferences: { daily_goal_questions: Math.max(1, Number(e.target.value) || 1) },
            })
          }
        />
        <label>
          <input
            type="checkbox"
            checked={prefs.sound}
            onChange={(e) => updateSettings({ preferences: { sound: e.target.checked } })}
          />
          Sound
        </label>
        <label>
          <input
            type="checkbox"
            checked={prefs.ai_tutor_enabled}
            onChange={(e) =>
              updateSettings({ preferences: { ai_tutor_enabled: e.target.checked } })
            }
          />
          AI tutor (optional; learning works without it)
        </label>
        {prefs.ai_tutor_enabled && (
          <AiTutorSettings
            provider={prefs.ai_provider}
            model={prefs.ai_model}
            onChange={(changes) => updateSettings({ preferences: changes })}
          />
        )}
      </fieldset>

      <fieldset>
        <legend>Data</legend>
        <DataSettings
          onImported={async () => {
            await reload();
            await refresh();
          }}
        />
        {!confirmingReset ? (
          <button type="button" onClick={() => setConfirmingReset(true)}>
            Reset local data…
          </button>
        ) : (
          <div role="alertdialog" aria-label="Confirm reset">
            <p>This permanently deletes your local profile and progress. This cannot be undone.</p>
            <button type="button" onClick={doReset}>
              Yes, delete everything
            </button>
            <button type="button" onClick={() => setConfirmingReset(false)}>
              Cancel
            </button>
          </div>
        )}
      </fieldset>
    </section>
  );
}
