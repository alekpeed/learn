# Forward Roadmap - Ground-Up Learning App

_Where to continue logically from the current state, in order, until the product
vision is fully realized._

This roadmap is grounded in the project's own scope tiers
(`docs/spec/03_VERSION_AND_SCOPE_PLAN.md`) and development phases
(`docs/spec/12_DEVELOPMENT_ROADMAP.md`), sequenced against the real skill graph in
`content/mvp/`. It picks up exactly where the shipped work ends.

## Current position

- MVP engine complete (dev-roadmap Phases 0-9): event-sourced foundation, curriculum
  platform, deterministic practice/grading, learning engine, adaptive diagnostic,
  isolated AI tutor, release hardening.
- Curriculum shipped so far: a 41-skill slice across 7 units (math: number foundations,
  add/sub, mult/div, fractions, one-step algebra; science: thinking, measurement).
- Version 1 features shipped (4 of ~10): BYOK AI providers, learner notes, extra question
  types (multi-select, ordering), study plans & daily goals, richer progress dashboard.

The scoped MVP curriculum in `03_VERSION_AND_SCOPE_PLAN.md` (21 math + 15 science topics)
is therefore only partly built. Dev-roadmap Phases 6 (all scoped math content) and 7 (all
scoped science content) are still open. Completing them is the immediate, lowest-risk
continuation because it is content-only and uses validators that already exist.

## Guiding constraints (carried through every phase below)

- Curriculum content stays separate from application logic.
- Grading stays deterministic; the AI never writes verified state (DEC-003/005/010).
- Event log is the source of truth; projections are reproducible (DEC-006).
- BYOK keys stay client-only, never in the event log or export (DEC-015).
- The app stays a static local-first SPA so the desktop wrap remains a drop-in (DEC-016).
- ASCII-only source; follow the content authoring standard and coding standards.
- Every phase ends green on: `pnpm validate:content`, `pnpm test`, `pnpm typecheck`,
  `pnpm lint`, `pnpm build`, `pnpm test:e2e`.

Legend: **[content]** = content-only, no engine/UI change. **[engine]** / **[ui]** = new
application code required. Sizes are rough skill/feature counts, not estimates of effort.

---

## Track A - Complete the scoped MVP curriculum

Finishes the curriculum the MVP was always scoped to cover. All content-only until noted.
Completing Track A satisfies the spec Completion Rule: the entire scoped curriculum is
traversable through prerequisites, lessons, practice, mastery, and review.

### Phase 10 - Decimals & Percentages  [content]
New math unit `math.decimals_percents`, slotted between Fractions and Algebra. 8 skills:
decimal place value -> reading & comparing decimals -> fraction/decimal equivalence ->
add & subtract decimals -> multiply & divide decimals -> meaning of percent -> percent of
a number -> converting among fractions/decimals/percents. Uses existing `decimal`,
`percentage`, `numeric`, `fraction`, `multiple_choice` validators. No engine change.
_This is the next phase and is already scoped skill-by-skill._

### Phase 11 - Ratios & Proportional Reasoning  [content]
New math unit `math.ratios`. ~5 skills: ratio meaning -> equivalent ratios / rates ->
unit rate -> proportions (solving for a missing term) -> scaling and simple word problems.
Prerequisites draw on Phase 10 (percent, decimals) and fractions. Uses `numeric`,
`fraction`, `percentage`, `multiple_choice`. No engine change. Bridges naturally into the
science proportional-reasoning skill in Phase 14.

### Phase 12 - Algebra: Two-Step Equations & Inequalities  [content]
Extend the existing `math.algebra` unit. ~5 skills: two-step expressions ->
two-step equations -> equations with variables introduced via word problems ->
introduction to inequalities -> checking solutions. Uses `numeric`, `multiple_choice`.
No engine change (inequality answers grade as a chosen relation via multiple_choice, or a
boundary value via numeric).

### Phase 13 - Coordinate Plane, Graphs & Introductory Functions  [content + engine]
New math unit `math.functions`. ~6 skills: coordinate plane & plotting points -> reading
points -> tables of values -> linear relationships / basic graphs -> input-output rule
(function idea) -> interpreting a simple graph. **First phase that needs new application
code:** a coordinate/point question type and a small non-interactive graph renderer for
prompts. Add one new deterministic validator (`point` / `coordinate`) plus its renderer;
everything else stays multiple_choice/numeric. Completes math topics 19-21 of the scope.

### Phase 14 - Scientific Reasoning & Measurement completion  [content, small engine]
Extend the science course to cover the remaining scoped science topics not yet built:
significant figures (intro), data tables, graph selection, graph interpretation,
proportional reasoning in science, experimental error, and drawing evidence-based
conclusions. ~8-9 skills across the existing `science.measurement` and `science.thinking`
units (plus a possible `science.data` unit). Reuses the graph renderer from Phase 13 for
graph-interpretation items; otherwise `unit`, `numeric`, `multi_select`, `ordering`,
`multiple_choice`.

**Track A milestone:** the full scoped MVP curriculum (~36 topics) is complete and
traversable end to end. Dev-roadmap Phases 6 and 7 are closed. Update
`MVP_SKILL_INVENTORY.md` and the acceptance mapping.

---

## Track B - Remaining Version 1 features

`03_VERSION_AND_SCOPE_PLAN.md` defines Version 1 as the MVP plus a feature set; four are
shipped. These are the rest, ordered from least to most architectural risk.

### Phase 15 - Deeper misconception diagnosis & remediation  [engine + ui]
Content already tags `misconception_id` / `common_wrong_answers`. Build the diagnosis
layer on top: detect recurring misconceptions from the event log, surface targeted
remediation and a "why this was wrong" explanation, and feed misconceptions into review
selection. Pure projection over existing events; grading stays deterministic.

### Phase 16 - Content administration & downloadable course modules  [ui + engine]
An in-app authoring/administration interface to create, validate (against the existing
JSON Schemas), and preview course packages, plus import/export of downloadable course
modules (a course pack is already just data). Pairs the "content administration interface"
and "downloadable course modules" V1 items. No change to how content is graded.

### Phase 17 - AI-assisted practice drafts (author-gated)  [ai-gateway + ui]
Let the isolated tutor propose *draft* practice questions that must pass deterministic
schema + answer validation and explicit human approval before entering the pool. Stays
within DEC-005/010: the AI never writes verified state; a draft is inert until validated.

### Phase 18 - Optional cloud account, sync & cross-device resume  [engine + service]
The largest V1 item and the first optional server dependency (Supabase is available). An
opt-in sync layer over the append-only event log enables cross-device resume while the app
stays fully functional offline and local-first. Must preserve DEC-006 (event log is truth),
DEC-013 (store interface), and DEC-015 (BYOK keys never leave the client / never sync).
Sync is additive and disabled by default.

**Track B milestone:** Version 1 feature set complete.

---

## Track C - Later Features (post-V1 expansion)

Explicitly beyond the MVP per the scope plan's "Later Features". Each is its own project;
sequence by demand. Content courses reuse the existing content-as-data pipeline and the
graph/chart machinery from Phases 13-14.

### Phase 19 - Geometry  [content]
New subject/course: angles, shapes, perimeter/area/volume, the Pythagorean relationship.
May add a geometry-figure renderer (reuses the Phase 13 rendering approach).

### Phase 20 - Statistics & Probability  [content + engine]
Data sets, center/spread, simple probability, reading statistical charts. Reuses and
extends the chart renderer.

### Phase 21 - Algebra II  [content]
Systems, quadratics-intro, functions in more depth. Builds on Phases 12-13.

### Phase 22 - Science courses: Physics, Chemistry, Biology  [content, later interactive]
Introductory units per subject using the existing pipeline. Fully interactive simulations
are a separate, later capability, not required to ship the courses.

### Phase 23 - Platform & social tier  [large, multi-project]
Multi-user support, teacher dashboards, classrooms, social features, gamification systems,
voice tutoring, handwriting recognition, interactive simulations, and a community/course
marketplace. Each is a standalone initiative gated on real demand and on multi-user
infrastructure from Phase 18. Several were explicitly excluded from the MVP.

---

## Track D - Final packaging (the literal end)

### Phase F - Desktop wrap (Tauri/Windows)  [packaging]
Per DEC-016, deferred until the final build and kept a drop-in: the app is a static
local-first SPA, so a Tauri (or Electron) wrap adds a native window and installer without
changing application logic. The user's standing note: "all I want is for it to be possible
on final build." This is the last step, done once the desired curriculum and features are
in place.

---

## Recommended path to done (one line)

Phase 10 (Decimals & Percentages) -> 11 (Ratios) -> 12 (Two-step Algebra) -> 13 (Graphs &
Functions) -> 14 (Science completion) [MVP curriculum done] -> 15 (Misconceptions) -> 16
(Authoring/modules) -> 17 (AI drafts) -> 18 (Optional cloud sync) [Version 1 done] -> 19-23
(Later content & platform, by demand) -> Phase F (desktop wrap).

Track A is content-only through Phase 12 and can proceed immediately with no engine risk.
Phase 13 is the first point that requires new application code (a coordinate/graph question
type). Confirm direction before starting any new phase, per the standing approval rule.
