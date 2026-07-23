/**
 * Tutor gateway (AI-001/005/006, doc 08 AI Tutor Gateway). Orchestrates a
 * provider behind output validation and fallback. It returns display text only
 * and never writes verified state (DEC-005) — this package cannot even import a
 * write path.
 *
 * Fallback (doc 10 §7): if the provider is unavailable, errors, or produces
 * output that fails validation, the learner still gets a safe, verified-content
 * response and a clear status. `ask` never throws.
 */
import type { TutorProvider, TutorRequest, TutorResult } from './types.js';
import { verifiedContextIds } from './context.js';
import { validateTutorOutput } from './validate.js';

function fallbackText(request: TutorRequest, unavailable: boolean): string {
  const { context } = request;
  const lead = unavailable
    ? 'The AI tutor is unavailable right now.'
    : 'The AI tutor could not produce a safe response.';
  const parts = [`${lead} Your lesson and practice still work.`];
  if (context.lesson_excerpt) parts.push(`From your lesson: ${context.lesson_excerpt}`);
  if (context.objective) parts.push(`Goal: ${context.objective}`);
  parts.push('Try the progressive hints on the practice screen.');
  return parts.join('\n\n');
}

export interface TutorGatewayOptions {
  /** Sink for observability; must not receive secrets or full conversations. */
  log?: (event: { level: 'info' | 'warn'; message: string }) => void;
}

export class TutorGateway {
  constructor(
    private readonly provider: TutorProvider,
    private readonly options: TutorGatewayOptions = {},
  ) {}

  private log(level: 'info' | 'warn', message: string): void {
    this.options.log?.({ level, message });
  }

  async ask(request: TutorRequest): Promise<TutorResult> {
    const ids = verifiedContextIds(request.context);
    const base = { mode: request.mode, provider: this.provider.name, verified_context_ids: ids };

    if (!this.provider.isAvailable()) {
      this.log('info', 'tutor provider unavailable; serving fallback');
      return { ...base, text: fallbackText(request, true), status: 'unavailable' };
    }

    let raw: string;
    try {
      const response = await this.provider.generate(request);
      raw = response.text;
    } catch {
      this.log('warn', 'tutor provider threw; serving fallback');
      return { ...base, text: fallbackText(request, true), status: 'fallback' };
    }

    const check = validateTutorOutput(raw, request);
    if (!check.ok) {
      this.log('warn', `tutor output rejected: ${check.reason ?? 'unknown'}`);
      return { ...base, text: fallbackText(request, false), status: 'fallback' };
    }

    return { ...base, text: raw.trim(), status: 'ok' };
  }
}
