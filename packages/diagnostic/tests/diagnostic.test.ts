import { describe, it, expect } from 'vitest';
import {
  startDiagnostic,
  currentSkill,
  recordResult,
  skipCurrent,
  isComplete,
  summarize,
  type DiagnosticState,
} from '../src/index.js';

const ORDER = ['s0', 's1', 's2', 's3', 's4', 's5', 's6'];

/** Drive the diagnostic where the learner can do skills with index < boundary. */
function runToCompletion(order: string[], boundary: number): DiagnosticState {
  let state = startDiagnostic(order);
  let guard = 0;
  while (!isComplete(state) && guard++ < 100) {
    const skill = currentSkill(state)!;
    const idx = order.indexOf(skill);
    state = recordResult(state, idx < boundary);
  }
  return state;
}

describe('adaptive diagnostic (DIA-002/003)', () => {
  it('begins near the middle of the order', () => {
    const state = startDiagnostic(ORDER);
    expect(currentSkill(state)).toBe('s3'); // floor((0+6)/2)
  });

  it('samples rather than testing every skill', () => {
    const state = runToCompletion(ORDER, 4);
    expect(state.history.length).toBeLessThan(ORDER.length);
  });

  it('finds a plausible starting point at the ability boundary (exit criterion)', () => {
    // Learner can do s0..s3 but not s4+. Recommend s4.
    const state = runToCompletion(ORDER, 4);
    const summary = summarize(state);
    expect(summary.recommendedSkillId).toBe('s4');
    expect(summary.strong).toContain('s3');
    expect(summary.weak).toContain('s4');
  });

  it('recommends the beginning when the learner fails from the start', () => {
    const state = runToCompletion(ORDER, 0);
    expect(summarize(state).recommendedSkillId).toBe('s0');
  });

  it('recommends the most advanced skill when everything is strong', () => {
    const state = runToCompletion(ORDER, ORDER.length);
    const summary = summarize(state);
    expect(summary.recommendedSkillId).toBe('s6');
    expect(summary.weak).toHaveLength(0);
  });

  it('leaves untested skills unknown — never marks them weak (exit criterion)', () => {
    const state = runToCompletion(ORDER, 4);
    const summary = summarize(state);
    const probed = new Set(state.history.map((h) => h.skill_id));
    for (const skill of ORDER) {
      if (!probed.has(skill)) {
        expect(summary.strong).not.toContain(skill);
        expect(summary.weak).not.toContain(skill);
      }
    }
  });

  it('supports skipping without judging the skill', () => {
    let state = startDiagnostic(ORDER);
    const skipped = currentSkill(state)!;
    state = skipCurrent(state);
    const summary = summarize(state);
    expect(summary.strong).not.toContain(skipped);
    expect(summary.weak).not.toContain(skipped);
    expect(state.history[0]?.result).toBe('skipped');
  });

  it('handles an empty order', () => {
    const state = startDiagnostic([]);
    expect(isComplete(state)).toBe(true);
    expect(summarize(state).recommendedSkillId).toBeNull();
  });
});
