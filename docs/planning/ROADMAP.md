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

### Phase 11 - Integers & Numerical Structure [content] - DONE

Shipped two complete units, slotted after Multiplication and Division (course orders 4-5;
Fractions/Decimals/Algebra shifted to 6-8). `math.numerical_structure` (7 skills: even/odd,
factors, multiples, primes, GCF, LCM, order of operations) and `math.integers` (7 skills:
negatives, comparing, absolute value, add/subtract/multiply/divide integers). Authored at
mastery-grade depth (~10 items/skill, 135 total) using `numeric`, `multiple_choice`,
`multi_select`, `ordering`; every answer verified through the real validators. These repair
a real dependency gap (factors/LCM underlie fractions; integers underlie algebra); a later
backfill can add them as explicit prerequisites to the existing Fractions and Algebra units.

### Phase 12 - Ratios & Proportional Reasoning + Measurement Foundations [content] - DONE

Shipped two complete units before Algebra (course orders 8-9; Algebra moved to 10).
`math.ratios` (7 skills: ratio meaning, equivalent ratios, rates, unit rates, proportions,
scale, direct proportionality, with word problems embedded as transfer items) and
`math.measurement` (8 skills: length, mass, time, temperature, area, volume, unit
conversion, estimation). Authored at mastery-grade depth (~8 items/skill, 124 total) using
`numeric`, `decimal`, `fraction`, `unit`, `multiple_choice`, `multi_select`. The `unit`
answers were checked against the validator's own conversion families so grading agrees;
every answer verified through the real validators.

### Phase 13 - Algebra completion + backfills [content] - DONE

Completed four partial units by appending new skills (existing content untouched).
`math.algebra` (+5 skills: terms/coefficients/constants, combining like terms, distributive
property, two-step equations, equation word problems - now 10 skills, doc unit 11 fully
covered); `math.add_sub` (+word problems); `math.mult_div` (+arrays/groups, remainders,
word problems); `math.fractions` (+comparing, subtract-unlike, multiply, divide, mixed
numbers, word problems - now 13 skills). 15 new skills, 119 questions at mastery-grade
depth, using `numeric`, `fraction`, `multiple_choice`. Two-step-equation solutions and all
fraction arithmetic are computed and verified; every answer grades through the validators.
After this phase the only entirely missing math unit is Coordinate Plane & Graphs (Phase
14), and Decimals/Percentages remain partial.

### Phase 14 - Coordinate Plane, Graphs & Introductory Functions [content + engine] - DONE

Shipped `math.functions` (doc unit 12, 8 skills, 67 questions): coordinate plane, ordered
pairs, plotting points, tables of values, reading graphs, input/output (function machines),
rate of change, and introductory linear relationships. **The first phase to touch
application code:** added a new deterministic **`point` validator** (parses ordered pairs
like "(3, 4)", "3,4", "-2, 5"; compares both coordinates within tolerance) to the
validation-engine, added `point` to the question-type and validator schema enums, and gave
the client a point input (placeholder "(x, y)"). Graph/table questions are posed textually
so they stay accessible without a rendered plot; a richer interactive graph renderer remains
a future enhancement. Point positions, table values, and function-machine outputs are all
computed and verified. This completes the mathematics course except partial
Decimals/Percentages.

### Phase 15 - Scientific Reasoning & Data completion [content] - DONE

Completed the science course: 24 new skills and 192 questions. Backfilled Scientific
Thinking (models, scientific explanations) and Measurement (mass, time, temperature, volume,
significant figures), and authored the two missing units - `science.experiments` (7 skills:
independent/dependent/controlled variables, control groups, repeated trials, fair tests,
sources of error) and `science.data` (10 skills: tables, categorical vs numerical data,
reading axes, bar/line/scatter graphs, trends, outliers, proportional relationships, drawing
conclusions). Graph and table items are posed textually, as in Phase 14. `unit`-validator
answers were checked against the engine's conversion families; volume and temperature use
numeric because those families do not exist in the validator.

**Track A milestone reached:** the documented curriculum is complete apart from one small
backfill - **125 skills, 801 questions, 14 of 16 units complete and none missing**.
Dev-roadmap Phases 6 and 7 are effectively closed.

### Phase 15b - Decimals & Percentages backfill [content]

The last curriculum gap: rounding decimals, finding the whole, finding the percent, percent
increase/decrease, and percentage word problems (~5 documented topics). Small, content-only,
uses existing validators. Completing it closes Track A entirely.

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
