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

let selection: Selection = { provider: 'stub' };
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

class DelegatingTutorProvider implements TutorProvider {
  readonly name = 'client';

  isAvailable(): boolean {
    if (!online) return false;
    if (selection.provider === 'stub') return true;
    return getApiKey(selection.provider).length > 0;
  }

  generate(request: TutorRequest): Promise<ProviderResponse> {
    if (selection.provider === 'stub') return stub.generate(request);
    const provider = createHttpProvider({
      provider: selection.provider,
      apiKey: getApiKey(selection.provider),
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
