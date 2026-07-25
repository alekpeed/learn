# Session Handoff - Ground-Up Learning App

_Last updated: 2026-07-25 - branch `claude/learning-app-next-phase-pgs09j` - HEAD `e2fb5f7`_

> **`CLAUDE.md` at the repository root states the governing rule and is loaded into every
> session automatically. Read it first. This handoff is subordinate to it, and both are
> subordinate to `docs/spec/`.**

This document is the entry point for a new session. Read it top to bottom, then follow the
reading order in section 0 before writing any code or content.

---

## 0. THE RULE: the document package is the bible

**The 17-document package in `docs/spec/` is the authority on what this product is and what
it teaches. It outranks this handoff, the code, and your memory. Never answer a question
about scope, curriculum, sequencing, or requirements from memory or from this handoff
alone - open the file and read it.**

This is not boilerplate. A previous session repeatedly stated scope from memory and got it
wrong in ways that took real work to unwind:

- It claimed trigonometry was not in the spec. It is - `01_PRODUCT_VISION.md`, Long-Term
  Direction.
- It claimed physics, chemistry and biology were out of scope. They are in
  `01_PRODUCT_VISION.md` (Long-Term Direction) and `03_VERSION_AND_SCOPE_PLAN.md` (Later
  Features), and sequenced as Phase 24 in `docs/planning/ROADMAP.md`.
- It published a progress report whose forward roadmap renumbered two phases and omitted
  the sciences entirely, because the list was written from memory instead of from
  `ROADMAP.md`.
- It under-counted the curriculum by three whole units in an early roadmap.

**Before making any claim about curriculum or scope, run the check.** For example:

```
grep -rn -i "<topic>" docs/spec/ docs/planning/
```

### Required reading order

| Order | File                                              | Why                                                       |
| ----- | ------------------------------------------------- | --------------------------------------------------------- |
| 1     | `docs/spec/00_README.md`                          | Index of the 17-document package.                         |
| 2     | `docs/planning/PROJECT_SCOPE.md`                  | The four scope tiers, beginning to end.                   |
| 3     | `docs/planning/ROADMAP.md`                        | **The real phase sequence. Quote it, do not paraphrase.** |
| 4     | `docs/spec/16_DECISION_LOG.md`                    | DEC-001..017. Binding decisions.                          |
| 5     | `docs/spec/06_CONTENT_AUTHORING_STANDARD.md`      | Before authoring any content.                             |
| 6     | `docs/spec/14_REPOSITORY_AND_CODING_STANDARDS.md` | Before writing any code.                                  |

The full package is `docs/spec/00_README.md` through `16_DECISION_LOG.md` (17 files),
plus `docs/planning/` and `docs/reviews/00_SPEC_REVIEW.md`.

---

## 1. The real roadmap

Taken verbatim from `docs/planning/ROADMAP.md`. **If this table and that file ever
disagree, the file wins - and fix this table.**

### Done

| Phase | What                                                                                                                                                              | Status                    |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 0-9   | Engine: event-sourced core, curriculum platform, deterministic grading, mastery scoring, spaced review, adaptive diagnostic, isolated AI tutor, release hardening | DONE                      |
| 10-16 | Track A + B: the full documented curriculum, at uniform depth                                                                                                     | DONE                      |
| E/F   | Tauri desktop shell; Windows `.msi` + NSIS installers from CI                                                                                                     | DONE                      |
| 17    | Deeper misconception diagnosis and remediation                                                                                                                    | DONE                      |
| 18    | Content administration and downloadable course modules                                                                                                            | DONE                      |
| 19    | AI-assisted practice drafts, author-gated                                                                                                                         | DONE                      |
| 20    | Optional sync and cross-device resume                                                                                                                             | DONE (no server deployed) |
| 21    | Geometry                                                                                                                                                          | DONE                      |
| 22    | Algebra II                                                                                                                                                        | DONE                      |

### Not done - this is what is left

| Phase | What                                      | Notes                                                                                                                                                                                                                                                                                     |
| ----- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -     | **Sync server**                           | The only unfinished Version 1 item. Engine, HTTP backend and UI exist and are tested against a stub; no live endpoint.                                                                                                                                                                    |
| 23    | **Precalculus & Trigonometry**            | Unit circle, sin/cos/tan, right-triangle trig, radians, identities, trig graphs. Geometry (21) and Algebra II (22) are its prerequisites and both are now authored. **This is the phase that delivers the arithmetic-to-trigonometry path.** Likely needs new angle/graph question types. |
| 24    | **Sciences: Physics, Chemistry, Biology** | Introductory units per subject through the existing pipeline. Interactive simulations are a separate, later capability.                                                                                                                                                                   |
| 25    | **Platform & social tier**                | Multi-user, teacher dashboards, classrooms, social, gamification, voice tutoring, handwriting recognition, simulations, marketplace. Gated on demand and multi-user infrastructure.                                                                                                       |
| -     | **Statistics & probability**              | Listed as a Later Feature in `03_VERSION_AND_SCOPE_PLAN.md` and in the vision, but **`ROADMAP.md` never gives it a phase number**. Genuine sequencing gap, not a decision to drop it.                                                                                                     |
| -     | **Calculus**                              | `ROADMAP.md` notes it "would follow" Phase 23 rather than giving it a phase. Furthest out.                                                                                                                                                                                                |

### The distinction that keeps being missed

**The existing science course teaches scientific METHOD, not subject matter.** Scientific
thinking, experiments, measurement, data - 34 skills, 273 questions. There is no biology,
chemistry or physics content anywhere. That matches `01_PRODUCT_VISION.md` "Initial Subject
Scope" exactly ("Science Foundation: scientific reasoning, measurement, units, estimation,
experimental thinking, tables, and graphs"). Subject-matter science is Phase 24. Do not
describe the current science course as covering "science" without that qualifier.

---

## 2. Current state

### Curriculum

|                                     | Skills  | Questions |
| ----------------------------------- | ------- | --------- |
| Mathematics (`math.core`, 13 units) | 120     | 1,040     |
| Science (`science.core`, 4 units)   | 34      | 273       |
| **Total (17 unit files)**           | **154** | **1,313** |

Plus a 57-record misconception catalog (`content/mvp/misconceptions.json`). Every skill has
a lesson and at least 7 practice items.

**Known content quality gap:** the science course is 78% multiple-choice versus 27% for
math, tops out at difficulty 4 (math reaches 5), and has 6% transfer items (math 11%).
Partly inherent - reasoning questions resist deterministic grading - but `multi_select` and
`ordering` are under-used (7 and 1 items out of 273) and would resist guessing better.

### Test gate - every phase must end green on all six

```
pnpm validate:content   # 34 tests
pnpm test               # 271 tests
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e           # 39 tests, includes axe in BOTH light and dark
```

### Architecture landmarks

- **Event log is the source of truth (DEC-006).** `SkillProgress` and misconceptions are
  reproducible projections. Never make an event mutable - that is what makes sync a set
  union instead of a distributed-systems problem.
- **Grading is deterministic; the AI never writes verified state (DEC-003/005/010).**
  `@learn/ai-gateway` depends on `@learn/domain` only, by design.
- **Content is data.** Curriculum lives in `content/mvp/`, validated by JSON Schema at load.
  Application logic never hardcodes curriculum.
- **BYOK and sync credentials live in `localStorage` only (DEC-015)**, never the event log,
  so a progress export never leaks them. There is a test for this.
- **Every colour comes from a CSS token**, so a theme only redefines tokens. Keep it that
  way.
- **`CurriculumProvider` keeps the bundled package as its synchronous initial value**, so a
  broken installed course module falls back rather than bricking the app.

### Honest gaps

- **No sync server is deployed.** `HttpSyncBackend` is tested against a stubbed `fetch`,
  never a live endpoint. `syncEvents` pulls the whole remote log rather than using a
  watermark.
- **Geometry and Algebra II pose figures textually.** No rendered figure component.
- **The schema caps `difficulty` and `difficulty_band` at 5.** Hard items clamp there.

---

## 3. Working agreements

- Develop on `claude/learning-app-next-phase-pgs09j`. Commit with descriptive messages,
  push with `git push -u origin <branch>` (retry with backoff on network failure).
- **Do not open a PR unless asked.** PR #1 is already open against the default branch.
- ASCII-only source.
- Do not put the model identifier in any pushed artifact.
- **Content generators must compute and assert every answer**, never accept a hand-typed
  one. This has caught real errors: a quadratic whose stated larger root was wrong, a
  question tagging its own correct answer as wrong, and a choice question with no options.
  Scripts live in the session scratchpad; the pattern is described in section 4.
- When a phase is finished: update `ROADMAP.md`, update this handoff, run the full gate,
  commit, push.

---

## 4. The content-generator pattern

Content is authored by a Python script that emits JSON only if every check passes:

- Compute every numeric answer; never type one. Verify by the inverse operation - substitute
  roots back into their equation, expand a factorisation, check a system solution against
  **both** equations.
- Assert choice answers appear among their options, `ordering` answers are a permutation of
  the options, and no choice validator ships without options.
- Assert ASCII-clean text, at least 7 questions per skill, a lesson per skill, unique IDs.
- Add the new unit to `content-answers.test.ts` so **every** answer is graded through the
  real validators, not merely schema-checked.

Wiring a new unit touches: `content/mvp/courses.json`, `content/mvp/manifest.json`,
`apps/client/src/data/curriculum.ts`, and the `UNIT_FILES` lists in
`packages/curriculum/tests/{loader,module}.test.ts` plus `content-answers.test.ts`.

---

## 5. Standing instruction: the progress artifact

A build-progress report is maintained at
`https://claude.ai/code/artifact/2ab31dd8-d923-4b45-b77c-419487bf03c7`. Update it after
every commit. **Its "what is left" section must be generated by reading `ROADMAP.md`, not
from memory** - that is exactly how it came to omit Phase 24 and renumber two phases.
