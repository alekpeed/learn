# Session Handoff - Ground-Up Learning App

_Last updated: 2026-07-25 - branch `claude/learning-app-next-phase-pgs09j` - Phase 24 complete, Phase 25 local half complete_

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

| Order | File                                              | Why                                                                                                                                |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `docs/spec/00_README.md`                          | Index of the 17-document package.                                                                                                  |
| 2     | `docs/planning/PROJECT_SCOPE.md`                  | The four scope tiers, beginning to end.                                                                                            |
| 3     | `docs/planning/ROADMAP.md`                        | **The real phase sequence. Quote it, do not paraphrase.**                                                                          |
| 4     | `docs/decisions/DECISION_LOG.md`                  | **DEC-001..018, the binding ones.** Note the spec's own `16_DECISION_LOG.md` holds only DEC-000..005; everything since lives here. |
| 5     | `docs/spec/06_CONTENT_AUTHORING_STANDARD.md`      | Before authoring any content.                                                                                                      |
| 6     | `docs/spec/14_REPOSITORY_AND_CODING_STANDARDS.md` | Before writing any code.                                                                                                           |

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
| 23    | Precalculus & Trigonometry - **the arithmetic-to-trigonometry path**                                                                                              | DONE                      |
| 24    | Sciences: Physics, Chemistry, Biology - the first subject-matter science                                                                                          | DONE                      |
| 25    | Platform tier: multi-learner, local progress overview, achievements                                                                                               | PARTIAL (local half)      |

### Not done - this is what is left

| Phase | What                            | Notes                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -     | **Sync server**                 | The last Version 1 item. **DEC-018 removed most of its leverage**: it was justified largely as the multi-user foundation for dashboards and classrooms, which are now dropped. It buys cross-device resume for one person and nothing else. Tested against a stub.         |
| 25    | **Phase 25, capability-gated**  | Voice tutoring, handwriting recognition, interactive simulations. Need speech/ink models or a pipeline that admits code as content. Teacher dashboards, classrooms, social and the marketplace are **dropped** - see DEC-018.                                              |
| -     | **Rendered figures and graphs** | The oldest carried gap, dating to Phase 14. Geometry, Algebra II and trigonometry all pose figures in words. Client-side work, no server needed.                                                                                                                           |
| -     | **Statistics & probability**    | Listed as a Later Feature in `03_VERSION_AND_SCOPE_PLAN.md` and in the vision. `ROADMAP.md` never gave it a phase number; Phase 23 added an "Unsequenced" section recording the gap, but it still has no number. Prerequisites are authored, so it could be built anytime. |
| -     | **Calculus**                    | `ROADMAP.md` notes it "would follow" Phase 23 rather than giving it a phase. Furthest out. Needs the precalculus strands Phase 23 did not author (conics, vectors, polar coordinates).                                                                                     |

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

|                                       | Skills  | Questions |
| ------------------------------------- | ------- | --------- |
| Mathematics (`math.core`, 15 units)   | 143     | 1,226     |
| Scientific method (`science.core`, 4) | 34      | 273       |
| Physics (`physics.core`, 1 unit)      | 8       | 64        |
| Chemistry (`chemistry.core`, 1 unit)  | 8       | 64        |
| Biology (`biology.core`, 1 unit)      | 8       | 64        |
| **Total (22 unit files, 5 courses)**  | **201** | **1,691** |

Plus a 123-record misconception catalog (`content/mvp/misconceptions.json`). Every skill has
a lesson and at least 7 practice items.

**The arithmetic-to-trigonometry path is complete** as of Phase 23. Note that trigonometry
is a strand _inside_ precalculus, not a course after it - the two units are ordered
`math.precalculus` (14) then `math.trigonometry` (15) so that `inverse_functions` is an
authored prerequisite for `inverse_trig`.

**Known content quality gap:** the science course is 78% multiple-choice versus 27% for
math, tops out at difficulty 4 (math reaches 5), and has 6% transfer items (math 11%).
Partly inherent - reasoning questions resist deterministic grading - but `multi_select` and
`ordering` are under-used (7 and 1 items out of 273) and would resist guessing better.

### Test gate - every phase must end green on all six

```
pnpm validate:content   # 35 tests
pnpm test               # 314 tests
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e           # 43 tests, includes axe in BOTH light and dark
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

### DEC-018: this is a single-user product

**Teacher dashboards, classrooms, social features and the marketplace are dropped.** Not
deferred, not awaiting demand - dead. `docs/spec/` still names them because those documents
predate the decision; DEC-018 in `docs/decisions/DECISION_LOG.md` supersedes them, and
`ROADMAP.md` is the operative list. Do not reintroduce them from the spec. The one thing
that would reopen it is the product ceasing to be single-user.

Knock-on effect worth internalising: **the sync server is no longer the high-leverage item.**
It looked like the biggest unlock only because those four features needed its infrastructure.

### Phase 25 (partial): what the platform tier does and does not do

Multi-learner, a local progress overview and achievements shipped. Voice tutoring,
handwriting recognition and interactive simulations did not, and remain gated on capability.
Do not describe Phase 25 as done.

- **Multi-learner needed almost no storage work**: every event has carried a `learner_id`
  since Phase 1, so the log was always multi-learner and only the UI assumed one profile.
- **The active profile lives in `localStorage`**, never the event log. It is a fact about
  the device; in the log it would sync one device's choice onto another and travel
  meaninglessly in an export. Same reasoning as DEC-015, applied to a non-credential.
- **Achievements are a projection, not stored state** (`packages/learning-engine/src/achievements.ts`).
  Recomputed by folding the log every render, so nothing goes stale and nothing migrates.
  There is a test asserting a replayed log gives identical badges. If you are tempted to
  cache them, do not - that would be the first mutable derived state in the codebase.
- **`deleteLearner` is a whole-profile purge**, in the same category as "reset local data".
  No individual event is ever edited, so DEC-006 holds.

### Honest gaps

- **No sync server is deployed.** `HttpSyncBackend` is tested against a stubbed `fetch`,
  never a live endpoint. `syncEvents` pulls the whole remote log rather than using a
  watermark.
- **Geometry, Algebra II and Trigonometry pose figures textually.** No rendered figure or
  graph component. Trig graph questions ask for period, amplitude, midline, maximum and
  minimum in words rather than showing a wave.
- **The schema caps `difficulty` and `difficulty_band` at 5.** Hard items clamp there.
- **`exact_value` does not handle sums of unlike terms** such as `1 + sqrt(2)`, nested
  radicals, or non-integer radicands. No authored item needs one; a question that did would
  need the parser extended.

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
  real validators, not merely schema-checked. That file now also asserts every declared
  `common_wrong_answers` entry is _rejected_ by its validator - a generator's string
  comparison cannot catch a distractor of `0.5` against an answer of `1/2`.
- If the unit needs a new validator, mirror its normalizer in the generator and
  **cross-check the two implementations on a shared corpus before authoring any content**.
  Phase 23 ran 50 cases through both the Python mirror and the TypeScript parser, including
  the strings that must be rejected, and only then started writing questions.

Wiring a new unit touches: `content/mvp/courses.json`, `content/mvp/manifest.json`,
`apps/client/src/data/curriculum.ts`, and the `UNIT_FILES` lists in
`packages/curriculum/tests/{loader,module}.test.ts` plus `content-answers.test.ts`.

---

## 5. Standing instruction: the progress artifact

A build-progress report is maintained at
`https://claude.ai/code/artifact/2ab31dd8-d923-4b45-b77c-419487bf03c7`. Update it after
every commit. **Its "what is left" section must be generated by reading `ROADMAP.md`, not
from memory** - that is exactly how it came to omit Phase 24 and renumber two phases.
