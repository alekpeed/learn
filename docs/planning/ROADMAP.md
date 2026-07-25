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
- **Curriculum complete and at uniform depth (Tracks A and B, Phases 10-16):** all ~138
  documented topics authored - **130 skills, 1,121 questions, 16 of 16 units built**, every
  skill carrying at least 7 practice items. Grown from the original 41-skill,
  ~2-item-per-skill slice.
- **Track C complete:** Version 1 feature set shipped (BYOK providers, notes, extra
  question types, study plans, richer dashboard, misconception remediation, downloadable
  course modules, author-gated AI practice drafts, optional sync). The only remaining
  Track C work is standing up a real sync server.
- UI polish: dark mode (system / light / dark), token-driven, audited by axe in both
  palettes.

**Tracks A, B, C, E and F are complete**, Track D is complete through Phase 24, and Phase 25
is partially done. The documented curriculum was fully authored at mastery-grade depth (130
skills, 1,121 questions, 16 of 16 units), the Version 1 feature set shipped, the Tauri
desktop shell wrapped it for Windows, and Phases 21-24 then added Geometry, Algebra II,
Precalculus, Trigonometry, Physics, Chemistry and Biology on top. The curriculum now stands
at **201 skills and 1,691 questions across 22 unit files**, in five courses: 15 math units,
4 scientific-method units, and one introductory unit each for physics, chemistry and biology.

The remaining work is: **statistics and probability** and **calculus** (both named in the
spec, neither ever given a phase number), a **rendered figure and graph component** (geometry,
Algebra II and trigonometry all pose figures textually), the **sync server** (the last
Version 1 item, now worth less than it looked - see DEC-018), and the capability-gated
remainder of Phase 25 (voice tutoring, handwriting recognition, interactive simulations).

**Dropped entirely (DEC-018):** teacher dashboards, classrooms, social features and the
marketplace. This is a single-user product; they are dead, not deferred.

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
every answer verified through the real validators. (The remaining doc 7-8 topics - rounding,
finding the whole/percent, increase-decrease, word problems - were added in Phase 15b.)

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

### Phase 15b - Decimals & Percentages backfill [content] - DONE

Closed the last curriculum gap: 5 skills and 42 questions covering rounding decimals,
finding the whole, finding the percent, percent increase/decrease, and percentage word
problems (including successive percent changes, a classic misconception). The
`math.decimals_percents` unit is now 13 skills.

**TRACK A COMPLETE.** All 16 documented units are built - **130 skills, 843 questions,
~138 of ~138 documented topics**. Dev-roadmap Phases 6 and 7 are closed, and the spec's
Completion Rule is satisfied: the entire scoped curriculum is traversable through
prerequisites, lessons, practice, mastery, and review.

---

## Track B - Content depth pass (make it learnable, not just present)

Coverage is not the same as mastery. Today each skill has ~1 lesson + ~2 practice items;
the mastery model wants a larger pool per skill.

### Phase 16 - Item-pool depth [content] - DONE

Lifted the 41 original MVP-slice skills (number foundations, the early add/sub, mult/div,
fractions and algebra skills, and the original science skills) from ~2 practice items each
to the standard set by Phases 10-15b. **278 new questions** across difficulty bands, with
progressive hints, explanations, transfer items, and misconception-tagged distractors.
Existing questions, skills, and lessons were untouched; new items continue each skill's
question numbering.

**Result: depth is now uniform.** Every skill has at least 7 practice items (mean ~8.6),
and the curriculum stands at **130 skills and 1,121 questions**. No engine change - all
answers grade through the existing deterministic validators.

**Track B complete.**

---

## Track C - Remaining Version 1 features

`03_VERSION_AND_SCOPE_PLAN.md` defines Version 1 as MVP plus a feature set; four are
shipped. These are the rest, ordered from least to most architectural risk.

### Phase 17 - Deeper misconception diagnosis & remediation [engine + ui] - DONE

Shipped. The tagged wrong answers were never reaching the diagnoser, so this began by
wiring `common_wrong_answers` through and recording the diagnosis on the attempt event.
Added a 57-record misconception catalog with corrective explanations, a
`projectMisconceptions` fold over the event log (recurring at 2, cleared by 2 correct
answers on the skill), remediation under wrong-answer feedback, a Sticking points card on
Progress, and remediation skills outranking the frontier in session selection. The loader
now rejects questions referencing a misconception with no catalog entry.

### Phase 18 - Content administration & downloadable course modules [ui + engine] - DONE

Shipped. Versioned course-module envelope with parse/serialize/summarize in
`@learn/curriculum`, validated through the same loader as bundled content. A `ModuleStore`
in its own IndexedDB database holds installed modules (never the event log). A `/courses`
screen exports the active course, validates and previews a module before installing,
switches courses, and reverts to built-in. The bundled curriculum stays the synchronous
fallback, so a broken installed course cannot brick the app.

### Phase 19 - AI-assisted practice drafts (author-gated) [ai-gateway + ui] - DONE

Shipped. The gateway only builds the prompt and parses candidates; every judgement is a
deterministic screen in the client (schema, derived IDs, answer must grade through its
validator, options must contain the answer, no answer leakage into prompt or hints,
invented misconception tags stripped, duplicates dropped). Approval is explicit and
per-item, and publishing rebuilds the whole course through the Phase 18 loader so
AI-proposed content passes the same gate as hand-authored content. Stays within
DEC-005/010.

### Phase 20 - Optional cloud account, sync & cross-device resume [engine + service] - DONE

Shipped, with one honest gap. A provider-neutral `SyncBackend` (pull/push) plus
`syncEvents`, an in-memory reference backend, and an HTTP backend. Merging is a set union
on `event_id`, so two devices that both worked offline simply end up with both sets of
events and no conflict to resolve. Off by default; a failed sync never touches local data;
credentials stay in client storage, never the log (DEC-015). **No server is deployed** -
the HTTP backend is tested against a stubbed `fetch`, not a live endpoint, and
`syncEvents` pulls the whole remote log rather than using a watermark. Standing up a real
endpoint (Supabase or otherwise) is the remaining work.

**Track C milestone reached:** the Version 1 feature set is complete.

---

## Track D - Later subjects, including the path to trigonometry

Beyond the MVP per the scope plan's "Later Features" and the vision's "Long-Term
Direction". These are the courses that do NOT yet exist in the documentation and that a
genuine arithmetic -> trigonometry path requires. Author them on top of the existing
engine, reusing the Phase 14-15 graph/figure machinery. Sequence by demand.

### Phase 21 - Geometry [content] - DONE

Shipped as unit 12 of `math.core` (12 skills, 96 questions): points and lines, angles and
their relationships, parallel lines, triangles, quadrilaterals, polygons, perimeter and
area, circles, volume and surface area, the Pythagorean theorem, similarity and congruence.
Kept inside the existing course rather than made a separate one so the prerequisite graph
stays connected to measurement, ratios and algebra. Curriculum now 142 skills, 1,217
questions across 16 unit files. This is the prerequisite for trigonometry.

Figures are posed textually, as in Phases 14-15; a rendered geometry-figure component
remains a future enhancement rather than a blocker.

### Phase 22 - Algebra II [content] - DONE

Shipped as unit 13 of `math.core` (12 skills, 96 questions): exponent rules, radicals,
polynomials, multiplying binomials, factoring, solving quadratics, the quadratic formula
and discriminant, systems of equations, inequalities, rational expressions, function
notation, and graph transformations. Curriculum now 154 skills, 1,313 questions across 17
unit files. With Phase 21, the prerequisites for precalculus and trigonometry are in place,
so **Phase 23 is the next piece of the arithmetic-to-trigonometry path**.

### Phase 23 - Precalculus & Trigonometry [content + engine] - DONE

Shipped as two units, **23 skills and 186 questions**, taking the curriculum to 177 skills
and 1,499 questions across 19 unit files. **This is the phase that delivers the
arithmetic-to-trigonometry path.**

Trigonometry sits _inside_ precalculus rather than after it - the standard sequence is
Algebra II, then Precalculus (of which trig is the largest strand), then Calculus - so this
phase authored both strands. The unit order puts functions and logarithms first because
`inverse_functions` is a genuine prerequisite for inverse trigonometry.

- **Unit 14, `math.precalculus`** (11 skills, 88 questions): domain and range, composing
  functions, inverse functions, behaviour of polynomials, rational functions and
  asymptotes, exponential functions, logarithms, logarithm rules, exponential equations,
  arithmetic and geometric sequences, and series.
- **Unit 15, `math.trigonometry`** (12 skills, 98 questions): ratios in a right triangle,
  sine/cosine/tangent, finding an unknown side, finding an unknown angle, angles of
  elevation and depression, exact values from the special triangles, radian measure, the
  unit circle, reference angles and signs, graphs of the trig functions, transforming trig
  graphs, and identities with simple equations.

**Engine change - the `exact_value` validator.** This is why the phase was not content-only.
`parseRational` handles integers, fractions, mixed numbers and terminating decimals, so it
cannot represent `sqrt(3)/2` or `pi/6` - meaning an exact trig value had no deterministic
validator at all and four skills would have been ungradable. `packages/validation-engine/src/surd.ts`
holds a value as `(num/den) * sqrt(radicand) * pi^piExp` in a canonical form (radicand
square-free, denominator rationalized, fraction reduced), so equality is structural and
exact: `1/sqrt(2)`, `sqrt(2)/2` and `sqrt(8)/4` all compare equal with no floating-point
tolerance. It accepts `undefined` so `tan 90` can be asked directly, and it accepts an exact
decimal (`0.5` for `1/2`) while grading an approximation of a surd (`0.866`) as wrong rather
than as a format error. Added to both schema enums, with a client input carrying notation
help. 30 new misconception records bring the catalog to 87.

Verification: every exact value is asserted against `math.sin`/`cos`/`tan` to 1e-12, every
unit-circle point is checked to satisfy `x^2 + y^2 = 1` in exact arithmetic, every stated
period and amplitude is checked against a dense sample of the real function, every series
formula against brute-force summation, and every inverse against substitution back into the
forward function. A Python mirror of the normalizer was cross-checked against the TypeScript
implementation on a 50-case corpus before any content was authored. `content-answers.test.ts`
also now asserts that every declared `common_wrong_answers` entry is _rejected_ by its
validator, which catches a distractor that is secretly a correct answer.

Figures and graphs are posed textually, as in Phases 14, 15 and 21; a rendered
figure/graph component remains a future enhancement rather than a blocker.

Calculus would follow as a further course beyond this, and the remaining precalculus
strands not needed for trigonometry (conics, vectors, polar coordinates) are unauthored.

### Phase 24 - Sciences: Physics, Chemistry, Biology [content] - DONE

Shipped as **three new subjects, each with its own course and an introductory unit** - 24
skills and 192 questions, taking the curriculum to **201 skills and 1,691 questions across
22 unit files**. This is the first subject-matter science in the product; everything before
it taught scientific method.

Structured per the doc 05 hierarchy `Subject -> Course -> Unit -> Skill`, so physics,
chemistry and biology are genuinely their own subjects rather than units bolted onto
`science.core`. That differs from Phase 21's choice to keep Geometry inside `math.core`,
and for a reason: geometry really is mathematics, whereas calling biology a unit of
"Scientific Reasoning and Measurement" would have misnamed the course. Prerequisites still
cross freely between courses, so the graph stays connected.

- **`physics.core` / `physics.motion`** (8 skills, 64 questions): speed/distance/time,
  velocity and acceleration, mass and weight, forces and Newton's laws, density, work and
  power, energy stores and conservation, waves.
- **`chemistry.core` / `chemistry.matter`** (8 skills, 64 questions): states of matter,
  atomic structure, elements/compounds/mixtures, the periodic table, chemical formulas,
  balancing equations, conservation of mass and relative formula mass, acids and bases.
- **`biology.core` / `biology.life`** (8 skills, 64 questions): characteristics of living
  things, cells, levels of organisation, photosynthesis and respiration, DNA and genes,
  inheritance and Punnett squares, mitosis and meiosis, ecosystems and energy flow.

**Content-only - no engine change.** Every item grades through the existing deterministic
validators, so the new `exact_value` type from Phase 23 was the last one needed.

Verification is by computation, not recall. The chemistry generator contains a formula
parser that counts atoms itself, including bracketed groups, and every balanced equation is
asserted to balance element by element on both sides; relative formula masses are summed
from an atomic-mass table rather than typed. The biology generator enumerates all four
gamete combinations to produce Punnett ratios, and computes chromosome counts from the
division rules, asserting that meiosis halves and fertilisation restores. Physics quantities
are each verified by rearranging the formula to recover an input. The generator refused to
emit once during authoring, for a misconception record that no question cited - that check
did its job.

Interactive simulations remain a separate, later capability (Phase 25).

### Phase 25 - Platform & social tier [engine + ui] - PARTIALLY DONE

This phase was never one deliverable. It lists nine standalone initiatives, and they do not
share a gate: some need only local application code, and the rest need infrastructure this
product does not have and has decided not to have. Shipping the first group and being
explicit about the second is more useful than reporting the phase as blocked.

**Shipped.**

- **Multi-learner support.** Several people share one device, each with their own profile
  and progress. This needed almost no new storage: every event has carried a `learner_id`
  since Phase 1, so the log was multi-learner from the start and only the UI assumed a
  single profile. Added `listLearners`, `loadCurrent(preferredId)` and `deleteLearner` to
  the repository, and a `/learners` screen to add, switch between and delete profiles. Which
  profile is open lives in `localStorage`, not the event log - it is a fact about the device,
  and putting it in the log would sync one device's choice to another and travel
  meaninglessly in an export (the DEC-015 reasoning, applied to a non-credential).
  `deleteLearner` is a whole-profile purge in the same category as "reset local data"; no
  individual event is ever edited, so DEC-006 holds.
- **A local progress overview.** The `/learners` table shows each profile's started and
  mastered counts side by side - the single-device subset of a teacher dashboard. Each row
  is projected through the same `projectProgress` and `summarizeProgress` calls that drive
  that learner's own Progress screen, so there is no second definition of "mastered" to
  drift out of step.
- **Gamification.** Eleven achievements, in `packages/learning-engine/src/achievements.ts`.
  Deliberately a **projection, not a new kind of state**: every badge is recomputed by
  folding the existing event log, so nothing is stored, nothing can go stale, no migration
  is needed, and a progress export carries achievements implicitly by carrying the events
  that earned them (DEC-006). Replaying a log yields identical badges with identical
  earned-at timestamps, and there is a test for that. Nothing compares one learner with
  another - doc 03 excludes competitive leaderboards, and on a local-first app there would
  be nobody to compare against.

**Dropped - see DEC-018.** Teacher dashboards, classrooms, social features and the
marketplace / community-authored course tier are **out of scope**. The product is for a
single user, so none of them earn the accounts, hosting, authorization and - for the social
and marketplace tiers - open-ended moderation they would require. Treat them as dead: do not
plan around them and do not list them as remaining work. `docs/spec/` still names them,
because those documents predate the decision; DEC-018 supersedes them and this file is the
operative list. The only thing that would reopen it is the product ceasing to be single-user.

Note the knock-on effect, recorded in DEC-018: **the sync server's justification shrinks**.
It was the highest-leverage remaining item mainly because those four all needed the same
multi-user foundation. With them gone it delivers exactly one thing - cross-device resume
for one person moving between their own machines - which is real but unblocks nothing else.

**Also dropped - see DEC-019.** Handwriting recognition and voice dictation are out of scope.
Handwriting needs a cloud API (breaking local-first) or a bundled ink model, for near-zero
value at a keyboard; the real friction it would address - typing notation like `sqrt(3)/2` -
is better met by an input palette. Voice dictation would upload audio to a vendor. Read-aloud
via `speechSynthesis` is cheap and would work offline, but it is **not** an accessibility
requirement (doc 02 section 12 is already fully met), so it is recorded as optional and is
not scheduled.

**Interactive simulations were folded into the figure renderer (DEC-019), not dropped.** The
objection was that a simulation is code rather than data. That holds for arbitrary
simulations but not for a **widget registry**, where content names a `kind` and supplies
numbers and the drawing lives in the application - exactly how validators already work.
Static figures shipped first; interactivity is an increment on the same registry.

### Unsequenced - in scope, but never given a phase number

Recording these here so they stop being invisible. Both are in the specification; this file
has simply never sequenced them, which is a gap in the roadmap rather than a decision to
drop them.

- **Statistics and probability.** `03_VERSION_AND_SCOPE_PLAN.md` lists "Statistics and
  probability" under Later Features, and `01_PRODUCT_VISION.md` lists Statistics and
  Probability as separate entries in its Long-Term Direction. Until this edit the words did
  not appear in this file at all. Prerequisites are already authored (ratios, decimals and
  percentages, the coordinate plane and graphs, and the science course's data-handling
  unit), so it could be authored at any point.
- **Calculus.** Named in `01_PRODUCT_VISION.md` under Long-Term Direction. Phase 23 above
  says only that it "would follow", without a number. It is the furthest out, and it needs
  the remaining precalculus strands (limits-oriented work, conics, vectors, polar
  coordinates) that Phase 23 did not author.

---

## Track E - Final packaging (the literal end)

### Phase F - Desktop wrap (Tauri/Windows) [packaging] - DONE

Realized DEC-016 exactly as it anticipated: **no application-code changes**. Added
`apps/desktop/src-tauri` (Tauri v2) - a Rust shell that opens a native window and hosts the
unchanged static client from `apps/client/dist` over Tauri's internal protocol, so the app
runs with no dev server and no HTTP origin.

- **Config** (`tauri.conf.json`): 1200x820 window, bundle targets `all`, and a CSP whose
  `connect-src` allowlists only the three BYOK tutor endpoints (OpenAI plus Anthropic and
  Gemini) and the Vite dev origin.
- **Icons**: generated as PNG (32/128/256/512) plus a 6-size BMP-format `icon.ico`.
- **Scripts**: `pnpm desktop:dev` (live-reload against Vite) and `pnpm desktop:build`.
- **CI** (`.github/workflows/desktop.yml`): a `windows-latest` job producing `.msi` and NSIS
  `.exe` installers as downloadable artifacts, on manual dispatch or a `v*` tag.

Verified as far as a Linux container allows: the Cargo manifest resolves, `cargo check`
passes, the Tauri CLI parses the config, and a release binary links. Producing the Windows
installer itself is the CI job, and macOS bundling would additionally need an `.icns` icon.
Recorded as DEC-017.

---

## Recommended path to done (one line)

Curriculum: 10 (Decimals/Percents) -> 11 (Integers/Structure) -> 12 (Ratios/Measurement)
-> 13 (Algebra + backfills) -> 14 (Graphs/Functions) -> 15 (Science/Data) [documented
curriculum done] -> 16 (Depth pass). Then features: 17 (Misconceptions) -> 18
(Authoring/modules) -> 19 (AI drafts) -> 20 (Cloud sync) [Version 1 done]. Then reach for
trig: 21 (Geometry) -> 22 (Algebra II) -> 23 (Precalc/Trig) [arithmetic-to-trig path done]
-> 24 (Sciences) -> 25 (Platform, local half). Phase F (desktop wrap) is done.

Everything through Phase 24 is now shipped, and Phase 25's local half with it. What is left,
in this file's own terms, in the order worth doing it:

1. **Statistics and probability** - unsequenced, but every prerequisite is authored, it needs
   no new validator and no infrastructure. The most buildable thing remaining.
2. **More figures** - six widget kinds and 69 figures now, across trigonometry, Pythagoras,
   angles, the coordinate plane and the number line. Polygons, circles, solids, precalculus
   and the science data unit are still textual. Content work against existing renderers.
   **Science item depth** belongs here too: 54 science skills sit at 8 items or fewer, while
   every math skill is now at 9 or more.
3. **Calculus** - furthest out, and it needs precalculus strands Phase 23 did not author.
4. **The sync server** - the last Version 1 item. DEC-018 removed most of its leverage; it
   now buys cross-device resume for one person and nothing more.
5. **Interactive figures** - DEC-019 made this an increment on the widget registry rather
   than a separate project. Voice dictation and handwriting are dropped.

Teacher dashboards, classrooms, social features and the marketplace are **dropped** (DEC-018)
and are deliberately absent from that list.

Track A is content-only through Phase 13. Phase 14 is the first point requiring new
application code, Phase 23 the second, and Phase 25 the third. Confirm direction before
starting any new phase, per the standing approval rule.
