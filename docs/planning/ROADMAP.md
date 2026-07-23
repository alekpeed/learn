# Forward Roadmap - Ground-Up Learning App

_Where to continue logically from the current state, in order, until the product vision is
fully realized._

Read `docs/planning/PROJECT_SCOPE.md` first - it is the single source of truth for the full
scope (engine, the 16-unit / ~138-topic documented curriculum, the four scope tiers, and
how far the vision reaches, including trigonometry). This roadmap is the sequenced
execution plan built on top of that scope. Both are grounded in `docs/spec/` and the real
skill graph in `content/mvp/`.

## Current position

- Engine complete (dev-roadmap Phases 0-9): event-sourced foundation, curriculum platform,
  deterministic practice/grading, learning engine, adaptive diagnostic, isolated AI tutor,
  release hardening. Tests green.
- Curriculum authored: ~41 of ~138 documented topics (~30%). One unit complete
  (Number Foundations), six partial (Add/Sub, Mult/Div, Fractions, Algebra, Science
  Thinking, Science Measurement), nine missing.
- Version 1 features: 4 of ~10 shipped (BYOK providers, notes, extra question types,
  study plans, richer dashboard).

The immediate, lowest-risk continuation is finishing the documented curriculum, because it
is content-only and mostly uses validators that already exist.

## Guiding constraints (carried through every phase)

- Curriculum content stays separate from application logic.
- Grading stays deterministic; the AI never writes verified state (DEC-003/005/010).
- Event log is the source of truth; projections are reproducible (DEC-006).
- BYOK keys stay client-only, never in the event log or export (DEC-015).
- The app stays a static local-first SPA so the desktop wrap remains a drop-in (DEC-016).
- ASCII-only source; follow the content authoring standard and coding standards.
- Every phase ends green on: `pnpm validate:content`, `pnpm test`, `pnpm typecheck`,
  `pnpm lint`, `pnpm build`, `pnpm test:e2e`.

Legend: **[content]** content-only, no engine/UI change. **[engine]** / **[ui]** new
application code required. Topic counts reference the documented units in
`PROJECT_SCOPE.md`.

---

## Track A - Complete the documented curriculum

Finishes the full 16-unit course the product was scoped to cover. Completing Track A
satisfies the spec Completion Rule (entire scoped curriculum traversable). Two kinds of
work run here: **new units** (breadth) and, where flagged, **backfilling partial units**
(the missing topics in units that are only half-authored). Content-only unless noted.

### Phase 10 - Decimals & Percentages [content] - DONE

New unit `math.decimals_percents` (doc units 7 + 8), slotted between Fractions and Algebra
(course order 5; Algebra moved to 6). Shipped 8 skills: decimal place value ->
reading/comparing decimals -> fraction/decimal equivalence -> add & subtract decimals ->
multiply & divide decimals -> meaning of percent -> percent of a number -> converting among
fractions/decimals/percents. Authored at mastery-grade depth (~10 items/skill, 86 total)
using existing `decimal`, `percentage`, `numeric`, `fraction`, `multiple_choice` validators;
every answer verified through the real validators. Still open from docs 7-8: rounding
decimals, finding the whole/percent, percent increase-decrease, and word problems (fold into
the Phase 16 depth pass or a later backfill).

### Phase 11 - Integers & Numerical Structure [content]

New units `math.numerical_structure` (doc unit 4: even/odd, factors, multiples, primes,
GCF, LCM, order of operations) and `math.integers` (doc unit 5: negatives, comparing,
+-x/ integers, absolute value). ~14 topics. These are true prerequisites for algebra and
were skipped in the initial slice; authoring them repairs a real gap in the dependency
graph. Uses `numeric`, `multiple_choice`.

### Phase 12 - Ratios & Proportional Reasoning + Measurement Foundations [content]

New units `math.ratios` (doc unit 9) and `math.measurement` (doc unit 10: length, mass,
time, temperature, area, volume, unit conversion, estimation). ~16 topics. Uses `numeric`,
`fraction`, `percentage`, `unit`, `multiple_choice`. Bridges into the science measurement
and proportional-reasoning skills.

### Phase 13 - Algebra completion [content]

Backfill `math.algebra` to the full doc unit 11: constants, terms, coefficients, combining
like terms, distributive property, two-step equations, equation word problems (adds ~7
topics to the existing 5). Also backfill the missing Add/Sub, Mult/Div, and Fractions
topics (word problems, arrays/remainders, comparing/multiplying/dividing fractions, mixed
numbers) so those partial units become complete. Uses `numeric`, `fraction`,
`multiple_choice`.

### Phase 14 - Coordinate Plane, Graphs & Introductory Functions [content + engine]

New unit `math.functions` (doc unit 12, ~9 topics): coordinate plane & plotting, reading
points, tables of values, reading graphs, rate-of-change intuition, input/output, function
machines, introductory linear relationships. **First phase that needs new application
code:** a coordinate/point question type and a small non-interactive graph renderer for
prompts. Add one new deterministic validator (`point`/`coordinate`) plus its renderer.

### Phase 15 - Scientific Reasoning & Data completion [content, small engine]

Backfill Science Thinking (models, scientific explanations) and Measurement (mass, time,
temperature, volume, significant figures), and author the two missing science units:
Experiments (doc unit 2: variables, controls, control groups, repeated trials, fair tests,
sources of error) and Data (doc unit 4: tables, bar/line/scatter graphs, reading axes,
trends, outliers, proportional relationships, drawing conclusions). ~25 topics. Reuses the
Phase 14 graph renderer for graph-reading items; otherwise `unit`, `numeric`,
`multi_select`, `ordering`, `multiple_choice`.

**Track A milestone:** the full documented curriculum (16 units, ~138 topics) is complete
and traversable end to end. Dev-roadmap Phases 6 and 7 are closed.

---

## Track B - Content depth pass (make it learnable, not just present)

Coverage is not the same as mastery. Today each skill has ~1 lesson + ~2 practice items;
the mastery model wants a larger pool per skill.

### Phase 16 - Item-pool depth [content]

Raise every authored skill to mastery-grade depth: roughly 8-15 practice items across
difficulty bands 1-5, additional worked examples, transfer items, and misconception-tagged
distractors. This can run per unit and interleave with Track A (deepen a unit right after
authoring it). No engine change - it is more of the same content the validators already
grade.

---

## Track C - Remaining Version 1 features

`03_VERSION_AND_SCOPE_PLAN.md` defines Version 1 as MVP plus a feature set; four are
shipped. These are the rest, ordered from least to most architectural risk.

### Phase 17 - Deeper misconception diagnosis & remediation [engine + ui]

Content already tags `misconception_id` / `common_wrong_answers`. Build the diagnosis layer:
detect recurring misconceptions from the event log, surface targeted remediation, feed them
into review selection. Pure projection over existing events.

### Phase 18 - Content administration & downloadable course modules [ui + engine]

In-app authoring/administration to create, validate (against existing JSON Schemas), and
preview course packages, plus import/export of downloadable course modules (a course pack
is already just data).

### Phase 19 - AI-assisted practice drafts (author-gated) [ai-gateway + ui]

Let the isolated tutor propose draft practice questions that must pass deterministic schema

- answer validation and explicit human approval before entering the pool. Stays within
  DEC-005/010.

### Phase 20 - Optional cloud account, sync & cross-device resume [engine + service]

The largest V1 item and the first optional server dependency (Supabase available). An
opt-in sync layer over the append-only event log; app stays fully functional offline and
local-first. Preserves DEC-006/013/015. Disabled by default.

**Track C milestone:** Version 1 feature set complete.

---

## Track D - Later subjects, including the path to trigonometry

Beyond the MVP per the scope plan's "Later Features" and the vision's "Long-Term
Direction". These are the courses that do NOT yet exist in the documentation and that a
genuine arithmetic -> trigonometry path requires. Author them on top of the existing
engine, reusing the Phase 14-15 graph/figure machinery. Sequence by demand.

### Phase 21 - Geometry [content + engine]

Angles, shapes, perimeter/area/volume, the Pythagorean relationship. Adds a geometry-figure
renderer (reuses the Phase 14 approach). Foundational for trigonometry.

### Phase 22 - Algebra II [content]

Systems of equations, quadratics, functions in depth, exponents/radicals. Builds on
Phases 13-14.

### Phase 23 - Precalculus & Trigonometry [content + engine]

The unit circle, sine/cosine/tangent, right-triangle trig, radians, trig graphs and
identities. Requires Geometry (21) and Algebra II (22) as prerequisites and likely new
angle/graph question types. **This is the phase that finally delivers an
arithmetic-to-trig path.** Calculus would follow as a further course beyond this.

### Phase 24 - Sciences: Physics, Chemistry, Biology [content, later interactive]

Introductory units per subject using the existing pipeline. Interactive simulations are a
separate, later capability.

### Phase 25 - Platform & social tier [large, multi-project]

Multi-user support, teacher dashboards, classrooms, social features, gamification, voice
tutoring, handwriting recognition, interactive simulations, community/course marketplace.
Each is a standalone initiative gated on real demand and on multi-user infrastructure from
Phase 20. Several were explicitly excluded from the MVP.

---

## Track E - Final packaging (the literal end)

### Phase F - Desktop wrap (Tauri/Windows) [packaging]

Per DEC-016, deferred until the final build and kept a drop-in: the app is a static
local-first SPA, so a Tauri (or Electron) wrap adds a native window and installer without
changing application logic. The user's standing note: "all I want is for it to be possible
on final build." Done once the desired curriculum and features are in place.

---

## Recommended path to done (one line)

Curriculum: 10 (Decimals/Percents) -> 11 (Integers/Structure) -> 12 (Ratios/Measurement)
-> 13 (Algebra + backfills) -> 14 (Graphs/Functions) -> 15 (Science/Data) [documented
curriculum done] -> 16 (Depth pass). Then features: 17 (Misconceptions) -> 18
(Authoring/modules) -> 19 (AI drafts) -> 20 (Cloud sync) [Version 1 done]. Then reach for
trig: 21 (Geometry) -> 22 (Algebra II) -> 23 (Precalc/Trig) -> 24 (Sciences) -> 25
(Platform). Finally: Phase F (desktop wrap).

Track A is content-only through Phase 13. Phase 14 is the first point requiring new
application code. A true arithmetic-to-trigonometry experience is not reached until
Phase 23. Confirm direction before starting any new phase, per the standing approval rule.
