/**
 * The app's tutor gateway. A delegating provider picks the concrete tutor at
 * call time from the learner's selection (built-in stub or a BYOK HTTP provider)
 * and the online status. The gateway still validates output and never touches
 * verified state.
 */
import {
  TutorGateway,
  StubTutorProvider,
  createHttpProvider,
  type TutorProvider,
  type TutorRequest,
  type ProviderResponse,
} from '@learn/ai-gateway';
import type { AiProvider } from '@learn/domain';
import { getApiKey } from './aiCredentials.js';

interface Selection {
  provider: AiProvider;
  model?: string;
}

/**
 * OpenAI is the default choice, so a learner who enables the tutor only has to
 * paste a key. Until a key is saved we serve the built-in stub rather than
 * reporting the tutor unavailable, so the app is useful out of the box.
 */
let selection: Selection = { provider: 'openai' };
let online = true;

/** Set which provider/model the tutor should use (from learner preferences). */
export function setAiSelection(next: Selection): void {
  selection = next;
}

/** Pause/resume AI when the browser goes offline/online. */
export function setAiOnline(value: boolean): void {
  online = value;
}

const stub = new StubTutorProvider();

/** A BYOK provider can only be used once the learner has saved a key for it. */
function byokKey(): string {
  return selection.provider === 'stub' ? '' : getApiKey(selection.provider);
}

class DelegatingTutorProvider implements TutorProvider {
  readonly name = 'client';

  isAvailable(): boolean {
    // The stub needs no key, so the tutor is available whenever we are online:
    // a BYOK provider without a key simply falls back to it.
    return online;
  }

  generate(request: TutorRequest): Promise<ProviderResponse> {
    const apiKey = byokKey();
    if (selection.provider === 'stub' || apiKey.length === 0) {
      return stub.generate(request);
    }
    const provider = createHttpProvider({
      provider: selection.provider,
      apiKey,
      model: selection.model,
    });
    return provider.generate(request);
  }
}

export const tutorProvider = new DelegatingTutorProvider();
export const tutorGateway = new TutorGateway(tutorProvider, {
  log: (event) => {
    if (event.level === 'warn') console.warn('[tutor]', event.message);
  },
});
