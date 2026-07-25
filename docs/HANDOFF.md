# Session Handoff — Ground-Up Learning App

_Last updated: 2026-07-23 · branch `claude/learning-app-next-phase-pgs09j` (Phase F shipped - desktop wrap; Tracks A, B, E complete)_

This document is the single source of truth for picking up work in a new session.
Read it top to bottom, then read `docs/spec/00_README.md` for the product vision.

> **Read `docs/planning/PROJECT_SCOPE.md` for the full scope of the project, beginning to
> end** (engine, the 16-unit / ~138-topic documented curriculum, the four scope tiers, and
> how far the vision reaches - including trigonometry and calculus). Its companion
> `docs/planning/ROADMAP.md` sequences the remaining work phase by phase. Two facts that
> surprised a prior session and are easy to get wrong: (1) the documented curriculum is now
> **fully authored and at uniform depth** (**130 skills, 1,121 questions**; all 16 units
> complete, every skill with 7+ practice items) - coverage and depth are both done; and
> (2) **trigonometry and
> calculus are named in the vision but have no authored curriculum** - completing 100% of the
> documented spec lands a learner at introductory algebra + linear graphs, not trig. Reaching
> trig needs new Geometry, Algebra II, and Precalculus courses (ROADMAP Track D).

---

## 1. Current status — what is built

The **MVP is complete (Phases 0–9)** and all four selected **Version 1** features have
shipped on top of it. Everything is committed and pushed.

**Phases 0–9 (the mastery-based learning engine):**

- Local-first event-sourced foundation: append-only learning-event log is the source of
  truth; `SkillProgress` is a reproducible projection (DEC-006). IndexedDB + in-memory
  store adapters behind one interface (DEC-013).
- Curriculum platform: content-as-data loader with JSON-Schema validation, prerequisite
  graph, cycle detection, topological ordering, lesson renderer, curriculum map.
- Deterministic practice/grading: numeric / fraction / decimal / percentage / unit /
  multi-select / ordering validators with exact rational arithmetic and error diagnosis.
- Learning engine: five-dimension mastery scoring, spaced-review scheduler, skill-state
  machine, prerequisite gating + remediation, progress projection.
- Adaptive diagnostic: binary-search placement over the skill graph.
- Content: **130 skills and 1,121 questions** across 15 unit files (12 math units + 4
  science units). **The documented curriculum is complete and at uniform depth** - all 16
  units built, every skill carrying at least 7 practice items (mean ~8.6).
- **Desktop shell (Phase F, DEC-017):** `apps/desktop/src-tauri` wraps the unchanged client
  in a Tauri v2 native window. No application-code changes; egress is limited by a CSP
  `connect-src` allowlist naming only the BYOK tutor endpoints. Windows `.msi`/NSIS
  installers come from the `windows-latest` CI job.
- **AI tutor default (Phase F):** the default provider is now **OpenAI** (`gpt-4o-mini`), so
  enabling the tutor only requires pasting a key. Until a key is saved the built-in offline
  stub is used, so the tutor still works out of the box. The master `ai_tutor_enabled` switch
  is still **off by default** (DEC-010).
- **New engine capability (Phase 14):** a deterministic **`point` validator** for
  ordered-pair/coordinate answers (validation-engine), added to the question-type and
  validator schema enums, with a client point input. This is the app's first content-driven
  engine extension since the MVP.
- Isolated AI tutor: provider-neutral gateway that depends **only** on `@learn/domain`;
  off by default; can never write verified state (DEC-005/010); verified fallback.
- Release: progress export/import, offline handling, accessibility audit (axe) across all
  screens, split cacheable bundle, deployment config, full acceptance checklist.

**Version 1 features (all four complete):**

| Feature                                                 | Commit    | Notes                                                                         |
| ------------------------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| BYOK AI providers (OpenAI / Claude / Gemini + selector) | `4b47f7a` | Keys live in `localStorage` only, never in the event log or export (DEC-015). |
| Learner notes (per skill)                               | `f0c3558` | Notes live in the event log and travel with a progress export.                |
| More question types (multi-select, ordering)            | `b551448` | Deterministic; checkbox + reorderable-list renderers.                         |
| Study plans & daily goals                               | `f75ba44` | Today panel: daily-goal bar, practice streak, next-action picker.             |
| Richer progress dashboard                               | `f18df9b` | Headline tiles, mastery-by-unit bars, five-dimension strengths radar.         |

**Curriculum work (Track A of the roadmap):**

- **Phase 10 — Decimals & Percentages** (`content/mvp/units/decimals_percents.json`): a new
  math unit slotted between Fractions and Algebra (`math.decimals_percents`, course order 5;
  Algebra moved to order 6). **8 skills** — decimal place value, reading/comparing decimals,
  fraction/decimal equivalence, add/subtract decimals, multiply/divide decimals, meaning of
  percent, percent of a number, converting among fractions/decimals/percents. Authored at
  **mastery-grade depth (~10 practice items per skill, 86 total)** across difficulty bands,
  each with progressive hints, an explanation, and misconception-tagged distractors where
  apt. Content-only; no engine change; every answer grades through the real validators.
- **Phase 11 — Numerical Structure & Integers** (`numerical_structure.json`,
  `integers.json`): two **complete** units slotted after Multiplication and Division (course
  orders 4-5; later math units shifted down). **14 skills** — even/odd, factors, multiples,
  primes, GCF, LCM, order of operations; and negative numbers, comparing integers, absolute
  value, and adding/subtracting/multiplying/dividing integers. Mastery-grade depth (135
  questions), using `numeric`, `multiple_choice`, `multi_select`, and `ordering`. Content
  only; every answer verified through the validators. (These repair a real dependency gap;
  a later backfill can wire them as prerequisites into Fractions and Algebra.)
- **Phase 12 — Ratios & Proportions and Measurement Foundations** (`ratios.json`,
  `measurement.json`): two **complete** units before Algebra (course orders 8-9; Algebra
  moved to 10). **15 skills** — ratio meaning, equivalent ratios, rates, unit rates,
  proportions, scale, direct proportionality; and length, mass, time, temperature, area,
  volume, unit conversion, estimation. Mastery-grade depth (124 questions), using `numeric`,
  `decimal`, `fraction`, `unit`, `multiple_choice`, `multi_select`. The `unit`-validator
  answers were checked against the engine's own conversion families; every answer grades
  through the real validators.
- **Phase 13 — Algebra completion + backfills** (appended to `algebra.json`, `add_sub.json`,
  `mult_div.json`, `fractions.json`; existing content untouched). **15 new skills, 119
  questions**: algebra gained terms/coefficients, combining like terms, distributive
  property, two-step equations, equation word problems (now 10 skills); add/sub gained word
  problems; mult/div gained arrays & groups, remainders, word problems; fractions gained
  comparing, subtract-unlike, multiply, divide, mixed numbers, word problems (now 13
  skills). This completed all four units. Combining-like-terms/distributive answers use
  `multiple_choice` (no expression validator exists); solutions and fraction arithmetic
  are computed and verified.
- **Phase 14 — Coordinate Plane, Graphs & Functions** (`functions.json`, plus engine). New
  unit `math.functions` (8 skills, 67 questions): coordinate plane, ordered pairs, plotting,
  tables of values, reading graphs, input/output (function machines), rate of change, intro
  linear relationships. Added a **`point` validator** (parses "(3, 4)", "3,4", "-2, 5") in
  `validation-engine`, `point` in the schema type/validator enums, a `point` input in
  `QuestionView`, and 4 validator unit tests. Graph/table items are posed textually (no
  rendered plot yet). Completed the math course except partial Decimals/Percentages.
- **Phase 15 — Science completion** (`science_experiments.json`, `science_data.json` new;
  `science_thinking.json`, `science_measurement.json` appended). **24 new skills, 192
  questions**, completing the science course: Scientific Thinking gained models and
  scientific explanations; Measurement gained mass, time, temperature, volume, and
  significant figures; new `science.experiments` (independent/dependent/controlled variables,
  control groups, repeated trials, fair tests, sources of error) and `science.data` (tables,
  categorical vs numerical, reading axes, bar/line/scatter graphs, trends, outliers,
  proportional relationships, drawing conclusions). Note: the `unit` validator has **no
  volume or temperature family**, so those items use `numeric`; only length/mass/time answers
  use `unit`. Graph and table items are posed textually.
- **Phase 15b — Decimals & Percentages backfill** (appended to `decimals_percents.json`).
  **5 skills, 42 questions**: rounding decimals, finding the whole, finding the percent,
  percent increase/decrease, and percentage word problems (including successive percent
  changes). This closed the last curriculum gap; the unit is now 13 skills.
- **Phase 16 — content depth pass** (appended across `number_foundations`, `add_sub`,
  `mult_div`, `fractions`, `algebra`, `science_thinking`, `science_measurement`). **278 new
  questions** lifting the 41 original MVP-slice skills from ~2 items each to the standard of
  the newer units. Existing questions/skills/lessons untouched; new IDs continue each
  skill's numbering. Depth is now uniform: every skill has 7+ items.

**Test status (all green):**

- `pnpm test` → **166** vitest tests across all packages (includes the 18
  content-validation tests reachable via `pnpm validate:content`, and 4 new `point`-validator
  tests). The `content-answers.test.ts` guard grades every new-unit answer through the
  deterministic validators, and `loader.test.ts` covers each new unit's prerequisite order.
- `pnpm test:e2e` → **24** Playwright tests, including axe-core accessibility checks.
- `pnpm typecheck`, `pnpm lint` (prettier), and `pnpm build` all clean.

---

## 2. How to run it

Requires **Node ≥ 20** (dev container uses 22) and **pnpm 10**.

```bash
pnpm install
pnpm dev              # Vite dev server for apps/client
pnpm test             # all unit tests (vitest)
pnpm validate:content # content-schema + curriculum tests only
pnpm test:e2e         # Playwright e2e + accessibility (builds first)
pnpm typecheck        # tsc --noEmit over the whole workspace
pnpm lint             # prettier --check .
pnpm build            # production client bundle

# Desktop shell (Tauri v2, DEC-016/017)
pnpm desktop:dev      # native window with live reload against Vite
pnpm desktop:build    # native binary + installers for the host platform
```

> The desktop shell needs a Rust toolchain. On Linux it also needs the webview
> dev packages (`libwebkit2gtk-4.1-dev librsvg2-dev libgtk-3-dev`); on Windows it
> needs nothing extra beyond Rust. **Windows installers are produced by CI**
> (`.github/workflows/desktop.yml`, manual dispatch or a `v*` tag), because an
> `.msi`/NSIS build must run on Windows.

> First install may need `pnpm rebuild esbuild` — pnpm 10 blocks the esbuild build
> script unless it's in `pnpm.onlyBuiltDependencies` (already configured in the root
> `package.json`).

---

## 3. Architecture & repository layout

Standing constraint, honored throughout: **curriculum content stays separate from
application logic, grading is deterministic, and the AI never writes verified state.**

```
packages/
  domain/             Framework-agnostic types: skill state, mastery dimensions, events, errors
  schemas/            JSON Schemas for content + Ajv2020 validator + fixtures (ID grammar)
  persistence/        Append-only event store (in-memory + IndexedDB), projections, learner/notes repos
  curriculum/         Course-package loader: schema validation, graph (cycles, topo order)
  validation-engine/  Deterministic validators + rational arithmetic + error diagnosis
  learning-engine/    Mastery scoring, review scheduler, state machine, gating, progress,
                      activity/streaks, today's-session, dashboard aggregations
  diagnostic/         Adaptive placement (binary-search boundary detection)
  ai-gateway/         Isolated tutor gateway + providers: stub + BYOK OpenAI/Claude/Gemini
apps/
  client/             Vite + React app: shell, lessons, practice, progress dashboard, review,
                      diagnostic, settings; React contexts + accessible SVG/bar charts
content/mvp/          Curriculum content ONLY (data): manifest, courses, one file per unit
tests/e2e/            Playwright smoke + accessibility (axe) + curriculum/learning/study flows
docs/                 Specification (docs/spec/), decisions, planning, spec-derived, reviews
```

Key architectural facts:

- **Dependency isolation of the AI** is enforced structurally (a test asserts
  `ai-gateway` imports nothing but `@learn/domain`) as well as behaviorally.
- **Bundle split** via Vite `manualChunks` (vendor / validation / curriculum-content) keeps
  the initial shell small (~82 KB, ~25 KB gzip).
- **React contexts:** `LearnerContext` (+ non-throwing `useOptionalLearner`),
  `CurriculumContext`, `ProgressContext`.
- **Dashboard/study numbers** are pure, unit-tested projections in `learning-engine`
  (`summarizeProgress`, `masteryByUnit`, `dimensionAverages`, `currentStreak`,
  `selectTodaysSession`) — the UI only renders them.

---

## 4. Decisions & specs to know

- `docs/decisions/DECISION_LOG.md` — **DEC-006 … DEC-016**. Most load-bearing:
  - DEC-006 event log is source of truth; DEC-003/005 deterministic grading, AI never
    writes state; DEC-013 IndexedDB behind a store interface; DEC-015 BYOK keys are
    client-only; **DEC-016 native desktop (Windows) is deferred but kept possible** — the
    app stays a static local-first SPA so a Tauri/Electron wrap is a drop-in at packaging
    time.
- `docs/spec-derived/MASTERY_SCORING.md` and `REVIEW_SCHEDULING.md` — the exact,
  testable algorithms (five dimensions; retention excluded from the provisional-mastery
  gate to avoid a circularity; delayed-review confirmation keyed on
  `interval_days_at_review >= 7`).
- `docs/planning/MVP_SKILL_INVENTORY.md` — the authoritative ~40-skill slice.
- `docs/RELEASE_CHECKLIST.md` — every acceptance criterion mapped to a passing test.

---

## 5. Conventions & gotchas

- **ASCII only** in source files — a couple of earlier edits slipped in Cyrillic /
  non-ASCII glyphs and had to be fixed. Keep comments and identifiers plain ASCII.
- **Strict TypeScript** with `noUncheckedIndexedAccess`: array index access is possibly
  `undefined`; assert (`rows[0]!`) or guard in tests.
- **Ajv** must be imported as `ajv/dist/2020.js` (`Ajv2020`) for the draft/2020-12 schemas.
- **Test-matcher collisions:** dimension labels now appear in both the dashboard radar
  legend and the skill-detail grid — use `.first()` / `getAllByText` / role-scoped queries
  rather than a bare `getByText('Understanding')`.
- **Content answer note:** `place_value.q1` ("value of the digit 5 in 356") answer is
  **50**, not 40 — a stale `40` broke an e2e test once.
- The occasional Playwright flake (tutor "explain differently") is timing, not a
  regression — re-run the spec to confirm before investigating.

---

## 6. Git workflow (unchanged)

- Develop on branch **`claude/project-spec-review-5yebtu`**.
- Commit with descriptive messages; push with `git push -u origin <branch>` and retry with
  exponential backoff on network errors.
- **Do not open a PR unless explicitly asked.**
- Commit-message footer (verbatim, every commit):
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01HgpT5zytqDv9TzrDKxufy6
  ```
- Do **not** put the model identifier in commits, PRs, code comments, or any pushed
  artifact — chat replies only.
- If the branch's PR is ever merged, treat follow-up work as fresh: restart the branch from
  the latest default branch (same name) rather than stacking onto merged history.

---

## 7. Progress report artifact (standing instruction)

There is a **standing instruction to update a progress-report artifact after every
commit.** It is an engineering-logbook HTML page driven by a `COMMITS` array and a
`SUMMARY` object (unit-test sparkline + timeline).

- Published URL: https://claude.ai/code/artifact/2ab31dd8-d923-4b45-b77c-419487bf03c7
- Source file (session scratchpad, **not** in the repo):
  `…/scratchpad/progress-report.html`
- To update: edit the `COMMITS` array + `SUMMARY` counts and republish the **same file
  path** to keep the URL. It currently reflects through `f18df9b` (162 unit tests).

> Note: the scratchpad is session-specific. A new session will need the file re-created (or
> the artifact re-listed via the Artifact `list` action and updated by URL) before the
> "after every commit" rule can continue.

---

## 8. Suggested next work

The **engine** is complete; the outstanding work is almost entirely **curriculum content**.
The authoritative plan is in `docs/planning/ROADMAP.md`, grounded in
`docs/planning/PROJECT_SCOPE.md`. Summary of the sequenced tracks:

1. **TRACKS A AND B ARE COMPLETE (Phases 10-16).** The documented curriculum is fully
   authored at uniform depth: 130 skills, 1,121 questions, all 16 units, every skill with 7+
   practice items. The spec's Completion Rule is satisfied. The next work is **Track C - the
   remaining Version 1 features** (deeper misconception diagnosis, content authoring UI +
   downloadable modules, AI-assisted author-gated practice drafts, optional cloud sync), or
   **Track D** if new subjects are wanted (Geometry -> Algebra II -> Precalculus/Trig, the
   path to an arithmetic-to-trig curriculum).
2. **Track B - content depth pass**: raise each authored skill from ~2 items to
   mastery-grade item pools (~8-15 across difficulties).
3. **Track C - remaining Version 1 features**: deeper misconception diagnosis, content
   authoring UI + downloadable modules, AI-assisted (author-gated) practice drafts, and
   optional cloud sync / cross-device resume.
4. **Track D - later subjects incl. the path to trigonometry**: Geometry -> Algebra II ->
   Precalculus/Trigonometry (Phase 23 is where an arithmetic-to-trig path is finally
   delivered) -> Physics/Chemistry/Biology -> platform & social tier.
5. **Track E - Phase F: Tauri/Windows desktop wrap (DEC-016)**, the deferred final build
   step; a drop-in since the app stays a static local-first SPA.

Confirm direction with the user before starting a new phase — the standing rule is to plan
and get approval before starting a new phase or growing scope.
