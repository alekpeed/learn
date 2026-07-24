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

**The documented curriculum is complete, at uniform depth.** All ~138 documented topics are
authored across **130 skills and 1,121 practice questions**, and **all 16 units are built** -
none partial, none missing. Phase 16 raised the original MVP-slice skills to match the newer
units, so **every skill now carries at least 7 practice items (mean ~8.6)**. Phases 10-14 completed the mathematics course, Phase 15 completed the science
course (Experiments and Data units plus backfills), and Phase 15b closed the last gap by
adding rounding decimals, finding the whole, finding the percent, percent
increase/decrease, and percentage word problems.

Both coverage and depth are now done; see section 5 for how depth was measured.

### Mathematics course (`math.core`)

| #   | Unit                      | Topics | Status | Notes                                                                                                                                                         |
| --- | ------------------------- | :----: | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Number Foundations        |   6    | built  | complete                                                                                                                                                      |
| 2   | Addition & Subtraction    |   8    | built  | Phase 13 added word problems                                                                                                                                  |
| 3   | Multiplication & Division |   9    | built  | Phase 13 added arrays/groups, remainders, word problems                                                                                                       |
| 4   | Numerical Structure       |   7    | built  | Phase 11: even/odd, factors, multiples, primes, GCF, LCM, order of operations                                                                                 |
| 5   | Integers                  |   7    | built  | Phase 11: negatives, comparing, absolute value, add/subtract/multiply/divide integers                                                                         |
| 6   | Fractions                 |   14   | built  | Phase 13 added comparing, subtract-unlike, multiply, divide, mixed numbers, word problems                                                                     |
| 7   | Decimals                  |   8    | built  | Phase 10 + 15b: place value, fraction-decimal, compare, +- x/, rounding                                                                                       |
| 8   | Percentages               |   7    | built  | Phase 10 + 15b: meaning, F-D-P conversion, percent of a quantity, finding whole/percent, increase-decrease, word problems                                     |
| 9   | Ratios & Proportions      |   8    | built  | Phase 12: ratio, equivalent ratios, rates, unit rate, proportions, scale, direct proportionality (word problems embedded)                                     |
| 10  | Measurement Foundations   |   8    | built  | Phase 12: length, mass, time, temperature, area, volume, unit conversion, estimation                                                                          |
| 11  | Algebra Foundations       |   12   | built  | Phase 13 added terms/coefficients/constants, combining like terms, distributive, two-step, word problems                                                      |
| 12  | Coordinate Plane & Graphs |   9    | built  | Phase 14: axes/origin, ordered pairs, plotting, tables, reading graphs, rate of change, input/output, function machines, intro linear (new `point` validator) |

Math authored: 103 of 103 documented topics (96 skills). Every mathematics unit is complete.

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
     reasoning / measurement / data. **Fully built.** Completing this ring satisfies the spec's
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
is the other, and it is now **uniform across the curriculum**. Phases 10-15b authored new
units at ~8-15 items per skill, and **Phase 16 (the depth pass)** lifted the 41 original
MVP-slice skills from ~2 items each to the same standard by adding 278 questions. Every
skill now has at least 7 items, averaging ~8.6, spread across difficulty bands with
progressive hints and misconception-tagged distractors. The mastery model
(retention + transfer across difficulty bands) wants a larger item pool per skill (roughly
8-15 items across difficulties, with worked examples and misconception coverage). Any plan
to make the existing units genuinely learnable, not just present, must budget a
content-depth pass in addition to new-topic breadth. See the ROADMAP for how this is
sequenced.

---

## 6. Summary for a new session

- The **engine is done**; the work is **curriculum content** (breadth) and **item depth**.
- The documented course is **16 units / ~138 topics and is now fully authored**: **130
  skills and 843 questions**, all 16 units complete. Phases 10-15b built both courses out
  from the original 41-skill slice. Remaining curriculum work is **depth** (item pools for
  the original MVP-slice skills), not coverage.
- Scope widens in four rings: initial curriculum -> Version 1 features -> Later Features
  -> long-term subjects (trig, calculus, sciences, and more).
- The docs' authored curriculum stops at introductory algebra; **trig/calc are vision, not
  yet curriculum**. Reaching them means authoring Geometry, Algebra II, and Precalc/Trig
  courses on top of the existing engine.
- Honor the standing constraints on every phase: content separate from logic, deterministic
  grading, AI never writes verified state, local-first, BYOK client-only, desktop-wrappable,
  ASCII-only source.
