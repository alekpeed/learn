# Session Handoff — Ground-Up Learning App

_Last updated: 2026-07-23 · latest on branch `claude/project-spec-review-5yebtu` (run `git log --oneline -1`)_

This document is the single source of truth for picking up work in a new session.
Read it top to bottom, then read `docs/spec/00_README.md` for the product vision.

---

## 1. Current status — what is built

The **MVP is complete (Phases 0–9)** and all four selected **Version 1** features have
shipped on top of it. Everything is committed and pushed.

### Phase-by-phase breakdown (0 → 9)

Each phase was committed and pushed with all tests green before the next began. The
roadmap these follow is `docs/spec/` + `docs/planning/TASK_PLAN_PHASE_0_1.md`.

| Phase | Commit(s)                       | What it delivered                                                                                                                                                                                   |
| ----- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | `8dce941`, `eb3e568`, `d870e33` | Spec review of the 17 docs (contradictions, risks); proposed repo structure + Phase 0/1 task plan; accepted stack + scope decisions (DEC-006…013); MVP skill inventory.                             |
| **1** | `d870e33`                       | Application foundation: pnpm monorepo + toolchain, app shell + routes, local-first event store (IndexedDB), learner profile, settings + accessibility baseline, error/screen-state model, CI.       |
| **2** | `917d69d`                       | Curriculum platform: course-package loader with schema validation, prerequisite graph (cycle detection + topological order), lesson renderer, curriculum map.                                       |
| **3** | `37eedbc`                       | Practice & deterministic validation: numeric/fraction/decimal/percentage/unit validators with exact rational arithmetic, error classification, attempt + hint persistence, question renderer.       |
| **4** | `f77210a`                       | Learning engine: five-dimension mastery scoring, spaced-review scheduler, skill-state machine, prerequisite gating + remediation, progress projection (events → SkillProgress).                     |
| **5** | `05d1422`                       | Adaptive diagnostic: binary-search placement over the skill graph, boundary detection, starting-point recommendation with override.                                                                 |
| **6** | `8cac57b`                       | MVP mathematics content: **31 skills** (number sense → one-step equations), each with a lesson and deterministically-graded questions.                                                              |
| **7** | `42e058d`                       | Scientific-reasoning content: **10 skills** (observation → accuracy/precision), cross-thread prerequisites, metric unit-conversion questions. (Brings content to 41 skills / 7 units.)              |
| **8** | `69e9647`                       | AI tutor: provider-neutral gateway that depends **only** on `@learn/domain`, off by default, cannot write verified state (DEC-005/010), verified fallback, stub provider.                           |
| **9** | `b51ba14`                       | Quality & release: progress export/import, offline handling, accessibility audit (axe) across all screens, split cacheable bundle, deployment config, full acceptance checklist — **MVP complete**. |

**Version 1 features (all four complete):**

| Feature                                                 | Commit    | Notes                                                                         |
| ------------------------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| BYOK AI providers (OpenAI / Claude / Gemini + selector) | `4b47f7a` | Keys live in `localStorage` only, never in the event log or export (DEC-015). |
| Learner notes (per skill)                               | `f0c3558` | Notes live in the event log and travel with a progress export.                |
| More question types (multi-select, ordering)            | `b551448` | Deterministic; checkbox + reorderable-list renderers.                         |
| Study plans & daily goals                               | `f75ba44` | Today panel: daily-goal bar, practice streak, next-action picker.             |
| Richer progress dashboard                               | `f18df9b` | Headline tiles, mastery-by-unit bars, five-dimension strengths radar.         |

**Test status (all green):**

- `pnpm test` → **162** vitest tests across all packages (includes the 18
  content-validation tests reachable via `pnpm validate:content`).
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
```

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

## 8. Suggested next work (nothing outstanding is broken)

All requested scope is complete. Candidate next steps, roughly in priority order:

1. **Tauri/Windows packaging (DEC-016).** Everything is already a static local-first SPA,
   so this is the drop-in wrap the decision anticipated. Was explicitly deferred by the
   user ("all I want is for it to be possible on final build").
2. **More curriculum content** — extend beyond the 41-skill MVP slice (more algebra, more
   science units) using the existing content-as-data pipeline.
3. **Dashboard/UX polish** — trends over time, per-unit drill-in, richer review analytics.
4. **Additional question types or richer lessons** if the spec's later phases are pursued.

Confirm direction with the user before expanding scope — the standing rule is to plan and
get approval before starting a new phase or growing scope.
