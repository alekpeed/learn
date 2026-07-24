# Project Scope - Beginning to End

_Single source of truth for the full scope of the Ground-Up Learning App: what the
product is, the entire documented curriculum, the widening scope tiers, what is actually
built today, and how far the vision reaches (including trigonometry and beyond)._

This document is derived from the authoritative specification in `docs/spec/` (which is
byte-identical to the original documentation package). When the spec and this document
disagree, the spec wins and this file must be corrected. Read this together with
`docs/planning/ROADMAP.md` (the sequenced execution plan) and `docs/HANDOFF.md` (current
working status).

Status legend used throughout: **[built]** complete, **[partial]** some skills authored,
**[missing]** not yet authored.

---

## 1. What the product is (fixed architecture)

A local-first, mastery-based tutor for mathematics and foundational scientific reasoning.
It identifies missing prerequisites, teaches in dependency order, grades deterministically,
diagnoses mistakes, schedules spaced review, and verifies long-term mastery. The
application engine is essentially complete; the open work is almost entirely curriculum
content.

Engine capabilities (all built and tested):

- Knowledge model: curriculum as a directed prerequisite graph. Eight skill states:
  `unknown -> diagnosed_weak -> learning -> practicing -> provisionally_mastered ->
mastered -> review_due -> decayed`.
- Five mastery dimensions (0-100): Understanding, Accuracy, Independence, Retention,
  Transfer. A single correct answer can never produce mastery.
- Spaced review: same-day, 1, 3, 7, 14, 30, 90 days; lengthens on success, shortens on
  failure; delayed-recall confirmation for full mastery.
- Adaptive diagnostic (binary-search boundary detection), prerequisite repair/detour,
  six-rung hint ladder, adaptive difficulty (1-5).
- Deterministic grading and error diagnosis (13 error categories). Validators:
  numeric, fraction, decimal, percentage, unit, multi-select, ordering, exact-choice, point
  (ordered-pair/coordinate; added in Phase 14).
- Isolated AI tutor (provider-neutral, BYOK): may rephrase, hint, and draft
  non-authoritative practice, but never writes verified state (DEC-005/010).
- Local-first and offline-capable: append-only event log is the source of truth (DEC-006);
  progress export/import; IndexedDB behind a store interface (DEC-013).
- Accessibility baseline across ~11 screens: keyboard, screen-reader, contrast,
  reduced-motion, adjustable text, color-independent status.

These are non-negotiable and constrain every future phase (see `docs/decisions/`).

---

## 2. The full documented curriculum (spec doc 05)

The authoritative curriculum architecture defines a hierarchy of
`Subject -> Course -> Unit -> Skill -> Lesson Component -> Question`, with **12 mathematics
units** and **4 science units** (~138 topics total). This is the complete arithmetic ->
introductory-algebra + scientific-reasoning course. It is the full "initial subject scope"

- it does NOT by itself reach trigonometry (see section 4).

Current authored coverage: **~133 of ~138 documented topics (~96%)** across **125 skills**
and **801 practice questions**. **Fourteen of the sixteen units are complete and none is
missing**; only Decimals and Percentages remain partial. Phase 15 completed the science
course (Experiments and Data units, plus Scientific Thinking and Measurement backfills), and
Phases 10-14 completed the mathematics course. (Phase 10 Decimals & Percentages; Phase 11
Numerical Structure and Integers; Phase 12 Ratios and Measurement Foundations; Phase 13
Addition/Subtraction, Multiplication/Division, Fractions, and Algebra; Phase 14 Coordinate
Plane & Graphs plus the `point` validator.)

The only outstanding curriculum gap is a small Decimals/Percentages backfill: rounding
decimals, finding the whole, finding the percent, percent increase/decrease, and percentage
word problems (about 5 documented topics).

### Mathematics course (`math.core`)

| #   | Unit                      | Topics | Status      | Notes                                                                                                                                                         |
| --- | ------------------------- | :----: | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Number Foundations        |   6    | built       | complete                                                                                                                                                      |
| 2   | Addition & Subtraction    |   8    | built       | Phase 13 added word problems                                                                                                                                  |
| 3   | Multiplication & Division |   9    | built       | Phase 13 added arrays/groups, remainders, word problems                                                                                                       |
| 4   | Numerical Structure       |   7    | built       | Phase 11: even/odd, factors, multiples, primes, GCF, LCM, order of operations                                                                                 |
| 5   | Integers                  |   7    | built       | Phase 11: negatives, comparing, absolute value, add/subtract/multiply/divide integers                                                                         |
| 6   | Fractions                 |   14   | built       | Phase 13 added comparing, subtract-unlike, multiply, divide, mixed numbers, word problems                                                                     |
| 7   | Decimals                  |   8    | partial (7) | Phase 10 (`math.decimals_percents`): place value, fraction-decimal, compare, +- x/; missing rounding                                                          |
| 8   | Percentages               |   7    | partial (3) | Phase 10: meaning, F-D-P conversion, percent of a quantity; missing finding whole/percent, increase-decrease, word problems                                   |
| 9   | Ratios & Proportions      |   8    | built       | Phase 12: ratio, equivalent ratios, rates, unit rate, proportions, scale, direct proportionality (word problems embedded)                                     |
| 10  | Measurement Foundations   |   8    | built       | Phase 12: length, mass, time, temperature, area, volume, unit conversion, estimation                                                                          |
| 11  | Algebra Foundations       |   12   | built       | Phase 13 added terms/coefficients/constants, combining like terms, distributive, two-step, word problems                                                      |
| 12  | Coordinate Plane & Graphs |   9    | built       | Phase 14: axes/origin, ordered pairs, plotting, tables, reading graphs, rate of change, input/output, function machines, intro linear (new `point` validator) |

Math authored: ~98 of 103 documented topics (91 skills). Every math unit is complete except
Decimals and Percentages, which are partial.

### Scientific Reasoning course (`science.core`)

| #   | Unit                | Topics | Status | Notes                                                                                                                                     |
| --- | ------------------- | :----: | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Scientific Thinking |   7    | built  | Phase 15 added models and scientific explanations                                                                                         |
| 2   | Experiments         |   7    | built  | Phase 15: independent/dependent/controlled variables, control groups, repeated trials, fair tests, sources of error                       |
| 3   | Measurement         |   11   | built  | Phase 15 added mass, time, temperature, volume, significant figures (accuracy + precision share one skill)                                |
| 4   | Data                |   10   | built  | Phase 15: tables, categorical/numerical, reading axes, bar/line/scatter graphs, trends, outliers, proportional relationships, conclusions |

Science authored: 35 of 35 documented topics (34 skills; accuracy and precision are taught
in a single combined skill).

---

## 3. Scope tiers (four widening rings)

The documentation defines scope as four widening rings. Only the innermost is partly built.

1. **Initial subject scope** (docs 01, 03, 05): the full ~138-topic curriculum in section 2
   - arithmetic through introductory algebra + coordinate plane/graphs, plus scientific
     reasoning / measurement / data. ~96% built. Completing this ring satisfies the spec's
     Completion Rule (the entire scoped curriculum traversable through prerequisites,
     lessons, practice, mastery, and review).

2. **Version 1 features** (doc 03): MVP plus cloud account & synchronization, cross-device
   resume, expanded question types, improved misconception diagnosis, content
   administration interface, richer visualizations, AI-generated practice drafts requiring
   validation, user notes, study plans & daily targets, downloadable course modules.
   **Shipped: 4 of ~10** - BYOK providers, learner notes, extra question types
   (multi-select/ordering), study plans & daily goals, richer dashboard. (Some overlap;
   the counting is approximate.)

3. **Later Features** (doc 03): Geometry, Algebra II, Statistics, Probability, Physics,
   Chemistry, Biology; plus multi-user, teacher dashboards, classrooms, social features,
   gamification, voice tutoring, handwriting recognition, interactive simulations, and a
   community/course marketplace. None built.

4. **Long-Term Direction** (doc 01): the same engine is intended to later support
   Geometry, Algebra II, Statistics, Probability, **Trigonometry**, **Calculus**, Physics,
   Chemistry, Biology, Astronomy, Computer science, Logic, Economics, and other structured
   subjects. These are named ambitions with **no authored curriculum content** - the
   detailed curriculum (doc 05) stops at introductory algebra + linear graphs.

---

## 4. How far does this reach? (the trigonometry question)

- The **engine** is subject-agnostic by design and is intended to carry every subject in
  the long-term direction, including trigonometry and calculus.
- The **authored curriculum** deliberately stops at introductory algebra and reading
  linear graphs. Completing 100% of the documented spec (all 16 units) still lands a
  learner at introductory algebra + coordinate plane/graphs - **not** trigonometry.
- Trigonometry and calculus are named in the vision (doc 01) but have **no unit/skill
  breakdown anywhere in the documentation.**

Therefore, a genuine "arithmetic -> trigonometry" path requires authoring new courses that
do not yet exist in the docs: **Geometry -> Algebra II -> Precalculus/Trigonometry** (and,
beyond that, Calculus). Reaching them is a content effort on top of the existing engine,
plus a few new question/graph types. `docs/planning/ROADMAP.md` sequences this explicitly
as an optional extended track.

---

## 5. Depth vs. breadth (a second dimension of scope)

Coverage (how many topics) is only one axis. **Depth** (how many practice items per skill)
is the other. The original MVP-slice skills (number foundations, the first few skills of
add/sub, mult/div, fractions, and algebra, and the science units) ship with one lesson and
about two practice questions, thinner than mastery-grade. Everything authored in Phases
10-13 is at ~8-15 items/skill, and new work targets that depth; a future depth pass should
lift the remaining original skills to match. The mastery model
(retention + transfer across difficulty bands) wants a larger item pool per skill (roughly
8-15 items across difficulties, with worked examples and misconception coverage). Any plan
to make the existing units genuinely learnable, not just present, must budget a
content-depth pass in addition to new-topic breadth. See the ROADMAP for how this is
sequenced.

---

## 6. Summary for a new session

- The **engine is done**; the work is **curriculum content** (breadth) and **item depth**.
- The documented course is **16 units / ~138 topics**; about **96% is authored** across
  **125 skills and 801 questions** (14 units complete, 2 partial, 0 missing). Phases 10-15
  built out both courses: mathematics through Coordinate Plane & Graphs (with a new `point`
  validator), and the full science course including the Experiments and Data units. The one
  remaining gap is a small Decimals/Percentages backfill (~5 topics).
- Scope widens in four rings: initial curriculum -> Version 1 features -> Later Features
  -> long-term subjects (trig, calculus, sciences, and more).
- The docs' authored curriculum stops at introductory algebra; **trig/calc are vision, not
  yet curriculum**. Reaching them means authoring Geometry, Algebra II, and Precalc/Trig
  courses on top of the existing engine.
- Honor the standing constraints on every phase: content separate from logic, deterministic
  grading, AI never writes verified state, local-first, BYOK client-only, desktop-wrappable,
  ASCII-only source.
