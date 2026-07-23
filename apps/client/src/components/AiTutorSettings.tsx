/**
 * BYOK AI-tutor configuration (DEC-015). Lets the learner pick a provider and
 * paste their own API key. The key is saved to localStorage (per provider) and
 * never enters the event log or an export. The built-in stub needs no key.
 */
import { useReducer, useState } from 'react';
import type { AiProvider } from '@learn/domain';
import { DEFAULT_MODELS } from '@learn/ai-gateway';
import { getApiKey, setApiKey, clearApiKey, hasApiKey } from '../data/aiCredentials.js';

const PROVIDER_LABELS: Record<AiProvider, string> = {
  stub: 'Built-in (offline, no key)',
  openai: 'OpenAI',
  anthropic: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
};

const PROVIDER_ORDER: AiProvider[] = ['stub', 'openai', 'anthropic', 'gemini'];

export function AiTutorSettings({
  provider,
  model,
  onChange,
}: {
  provider: AiProvider;
  model: string | undefined;
  onChange: (changes: { ai_provider?: AiProvider; ai_model?: string }) => void;
}): JSX.Element {
  const [keyInput, setKeyInput] = useState('');
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const needsKey = provider !== 'stub';
  const keySaved = needsKey && hasApiKey(provider);

  function saveKey(): void {
    if (!keyInput.trim()) return;
    setApiKey(provider, keyInput.trim());
    setKeyInput('');
    bump();
  }

  function removeKey(): void {
    clearApiKey(provider);
    bump();
  }

  return (
    <div className="ai-settings">
      <label htmlFor="ai-provider">Tutor provider</label>
      <select
        id="ai-provider"
        value={provider}
        onChange={(e) => onChange({ ai_provider: e.target.value as AiProvider })}
      >
        {PROVIDER_ORDER.map((p) => (
          <option key={p} value={p}>
            {PROVIDER_LABELS[p]}
          </option>
        ))}
      </select>

      {needsKey && (
        <>
          <label htmlFor="ai-model">Model (optional)</label>
          <input
            id="ai-model"
            value={model ?? ''}
            placeholder={DEFAULT_MODELS[provider]}
            onChange={(e) => onChange({ ai_model: e.target.value })}
            autoComplete="off"
          />

          <label htmlFor="ai-key">API key</label>
          <input
            id="ai-key"
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            autoComplete="off"
            placeholder={keySaved ? 'A key is saved for this provider' : 'Paste your API key'}
          />
          <div className="question-actions">
            <button type="button" onClick={saveKey} disabled={!keyInput.trim()}>
              Save key
            </button>
            {keySaved && (
              <button type="button" onClick={removeKey}>
                Remove key
              </button>
            )}
          </div>
          <p className="progress-note" role="status">
            {keySaved
              ? `A ${PROVIDER_LABELS[provider]} key is saved on this device.`
              : `Add your ${PROVIDER_LABELS[provider]} key to use it.`}
          </p>
          <p className="progress-note">
            Your key is stored only in this browser and is sent directly to the provider when you
            ask the tutor. Don’t use this on a shared device. It is never included in a progress
            export.
          </p>
        </>
      )}
    </div>
  );
}

export { getApiKey };
