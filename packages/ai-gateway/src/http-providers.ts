/**
 * Real tutor providers (OpenAI, Anthropic, Google Gemini) implementing the same
 * TutorProvider interface as the stub (doc 08 §9 replaceability). They call the
 * provider HTTP API directly with a bring-your-own-key credential (DEC-015).
 *
 * The gateway still validates every response (output validation + fallback), so
 * these providers cannot bypass the isolation guarantees — they only produce
 * candidate text.
 */
import type { TutorProvider, TutorRequest, ProviderResponse } from './types.js';
import type { AiProvider } from '@learn/domain';
import { buildPrompt } from './prompt.js';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface HttpProviderConfig {
  provider: Exclude<AiProvider, 'stub'>;
  apiKey: string;
  model?: string;
}

export const DEFAULT_MODELS: Record<Exclude<AiProvider, 'stub'>, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-5',
  gemini: 'gemini-2.5-flash',
};

const MAX_TOKENS = 600;

function requireFetch(fetchImpl?: FetchLike): FetchLike {
  const f = fetchImpl ?? (globalThis.fetch as FetchLike | undefined);
  if (!f) throw new Error('no fetch implementation available');
  return f;
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  return `provider HTTP ${res.status}: ${text.slice(0, 200)}`;
}

export class OpenAiProvider implements TutorProvider {
  readonly name = 'openai';
  constructor(
    private readonly config: HttpProviderConfig,
    private readonly fetchImpl?: FetchLike,
  ) {}

  isAvailable(): boolean {
    return this.config.apiKey.length > 0;
  }

  async generate(request: TutorRequest): Promise<ProviderResponse> {
    const { system, user } = buildPrompt(request);
    const res = await requireFetch(this.fetchImpl)('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.openai,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { text: data.choices?.[0]?.message?.content ?? '' };
  }
}

export class AnthropicProvider implements TutorProvider {
  readonly name = 'anthropic';
  constructor(
    private readonly config: HttpProviderConfig,
    private readonly fetchImpl?: FetchLike,
  ) {}

  isAvailable(): boolean {
    return this.config.apiKey.length > 0;
  }

  async generate(request: TutorRequest): Promise<ProviderResponse> {
    const { system, user } = buildPrompt(request);
    const res = await requireFetch(this.fetchImpl)('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        // Required for direct browser (BYOK) calls.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.anthropic,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = (await res.json()) as { content?: { text?: string }[] };
    return { text: data.content?.[0]?.text ?? '' };
  }
}

export class GeminiProvider implements TutorProvider {
  readonly name = 'gemini';
  constructor(
    private readonly config: HttpProviderConfig,
    private readonly fetchImpl?: FetchLike,
  ) {}

  isAvailable(): boolean {
    return this.config.apiKey.length > 0;
  }

  async generate(request: TutorRequest): Promise<ProviderResponse> {
    const { system, user } = buildPrompt(request);
    const model = this.config.model || DEFAULT_MODELS.gemini;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;
    const res = await requireFetch(this.fetchImpl)(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
      }),
    });
    if (!res.ok) throw new Error(await readError(res));
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return { text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' };
  }
}

/** Build the concrete provider for a BYOK config. */
export function createHttpProvider(
  config: HttpProviderConfig,
  fetchImpl?: FetchLike,
): TutorProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAiProvider(config, fetchImpl);
    case 'anthropic':
      return new AnthropicProvider(config, fetchImpl);
    case 'gemini':
      return new GeminiProvider(config, fetchImpl);
    default:
      throw new Error(`unknown provider: ${config.provider as string}`);
  }
}
