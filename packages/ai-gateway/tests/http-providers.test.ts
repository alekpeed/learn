import { describe, it, expect } from 'vitest';
import {
  createHttpProvider,
  buildPrompt,
  TutorGateway,
  buildTutorContext,
  type FetchLike,
  type TutorRequest,
} from '../src/index.js';

const REQUEST: TutorRequest = {
  mode: 'explain',
  context: buildTutorContext({
    skill_id: 'math.algebra.one_step_equations',
    skill_title: 'One-Step Equations',
    objective: 'Solve using inverse operations',
    lesson_excerpt: 'Undo addition by subtracting from both sides.',
    correct_answer: '7',
  }),
};

interface Captured {
  url: string;
  init?: RequestInit;
}

function fakeFetch(responseBody: unknown, ok = true, captured?: Captured[]): FetchLike {
  return (url, init) => {
    captured?.push({ url, init });
    return Promise.resolve({
      ok,
      status: ok ? 200 : 401,
      json: () => Promise.resolve(responseBody),
      text: () => Promise.resolve(JSON.stringify(responseBody)),
    } as Response);
  };
}

describe('prompt builder', () => {
  it('includes verified context and forbids revealing the answer in guide mode', () => {
    const p = buildPrompt({ ...REQUEST, mode: 'guide' });
    expect(p.user).toMatch(/One-Step Equations/);
    expect(p.user).toMatch(/Undo addition by subtracting/);
    expect(p.user).toMatch(/do not reveal/i);
    expect(p.system).toMatch(/never change/i);
  });
});

describe('OpenAI provider', () => {
  it('posts to the chat completions endpoint with a bearer token and parses the reply', async () => {
    const captured: Captured[] = [];
    const provider = createHttpProvider(
      { provider: 'openai', apiKey: 'sk-test', model: 'gpt-4o-mini' },
      fakeFetch({ choices: [{ message: { content: 'Here is another way.' } }] }, true, captured),
    );
    const out = await provider.generate(REQUEST);
    expect(out.text).toBe('Here is another way.');
    expect(captured[0]?.url).toContain('api.openai.com');
    expect((captured[0]?.init?.headers as Record<string, string>).authorization).toBe(
      'Bearer sk-test',
    );
  });
});

describe('Anthropic provider', () => {
  it('sends the x-api-key and browser-access headers and parses content', async () => {
    const captured: Captured[] = [];
    const provider = createHttpProvider(
      { provider: 'anthropic', apiKey: 'sk-ant' },
      fakeFetch({ content: [{ text: 'Think of it as a balance.' }] }, true, captured),
    );
    const out = await provider.generate(REQUEST);
    expect(out.text).toBe('Think of it as a balance.');
    const headers = captured[0]?.init?.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant');
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
  });
});

describe('Gemini provider', () => {
  it('puts the key in the query string and parses candidates', async () => {
    const captured: Captured[] = [];
    const provider = createHttpProvider(
      { provider: 'gemini', apiKey: 'g-key' },
      fakeFetch(
        { candidates: [{ content: { parts: [{ text: 'A related example…' }] } }] },
        true,
        captured,
      ),
    );
    const out = await provider.generate(REQUEST);
    expect(out.text).toBe('A related example…');
    expect(captured[0]?.url).toContain('generativelanguage.googleapis.com');
    expect(captured[0]?.url).toContain('key=g-key');
  });
});

describe('errors and gateway integration', () => {
  it('throws on a non-ok response', async () => {
    const provider = createHttpProvider(
      { provider: 'openai', apiKey: 'bad' },
      fakeFetch({ error: 'unauthorized' }, false),
    );
    await expect(provider.generate(REQUEST)).rejects.toThrow(/HTTP 401/);
  });

  it('a provider error falls back through the gateway without throwing', async () => {
    const provider = createHttpProvider(
      { provider: 'openai', apiKey: 'bad' },
      fakeFetch({ error: 'unauthorized' }, false),
    );
    const gw = new TutorGateway(provider);
    const result = await gw.ask(REQUEST);
    expect(result.status).toBe('fallback');
    expect(result.text).toMatch(/still work/i);
  });

  it('the gateway still rejects a real provider that leaks the answer in guided mode', async () => {
    const provider = createHttpProvider(
      { provider: 'openai', apiKey: 'ok' },
      fakeFetch({ choices: [{ message: { content: 'The answer is 7.' } }] }),
    );
    const gw = new TutorGateway(provider);
    const result = await gw.ask({ ...REQUEST, mode: 'guide' });
    expect(result.status).toBe('fallback');
    expect(result.text).not.toContain('The answer is 7');
  });
});
