# Native Rust + GTK4 rewrite (no webview)

_The operative phase plan for this track. Governed by `docs/decisions/DECISION_LOG.md`
DEC-020 - read that entry first if you are new to this track. This file is to `native/`
what `docs/planning/ROADMAP.md` is to the TypeScript app: the phase sequence. Quote it,
don't paraphrase it from memory, and update the Status table below after every phase._

## Context

The shipped desktop app (`apps/desktop`, Tauri v2) is a native window and process, but the
UI inside it renders via WebKitGTK - a browser engine - because it hosts the same
React/TypeScript SPA that also runs in an ordinary browser. That was DEC-016, and it paid
for itself: every phase since, including Phase 26 and Windows+Linux packaging, cost nothing
extra to bring to desktop because the app and its desktop wrapper never diverged.

The product owner rejected that architecture on principle after it was explained in full -
not because of anything it does wrong, but because a browser engine renders the UI
regardless of how native the hosting process is. They were shown the cheaper alternative
first (keep the tested TypeScript engine, rewrite only the UI in a native toolkit) and chose
the full-cost option anyway: **both the UI and the business logic rewritten in Rust**, with
a genuinely native GTK4 interface. No HTML, no CSS, no browser engine anywhere in the
process.

This is not a phase in `docs/planning/ROADMAP.md`'s sequence - it shares no code with it.
**The TypeScript app is not deprecated by this track** and remains the shipped product until
this rewrite reaches parity and is verified against the owner's real exported progress data
(see Verification, below). `ROADMAP.md`'s remaining work (statistics/probability, more
figures, calculus, the sync server) continues to apply to the TypeScript app.

The intended outcome is a native `.deb`/`.rpm`/AppImage-packaged GTK4 application,
functionally equivalent to the current app, with the same verified-not-trusted correctness
guarantees the TypeScript version earned through its test suite - carried into Rust via
golden-file fixtures dumped from the real TypeScript functions, not re-derived from
documentation of the algorithms.

**This is weeks of work, not a session.** Each phase below is independently buildable and
testable. Confirm before starting a new phase, per this project's standing working
agreement - and update the Status table immediately after any phase completes, so a future
session reads the real state here rather than reconstructing it from git log.

## Status

| Phase | What                             | Status      |
| ----- | -------------------------------- | ----------- |
| 0     | Workspace scaffold + CI          | DONE        |
| 1     | `learn-domain`                   | not started |
| 2     | `learn-content`                  | not started |
| 3     | `learn-validation-engine`        | not started |
| 4     | `learn-diagnostic`               | not started |
| 5     | `learn-learning-engine`          | not started |
| 6     | `learn-persistence`              | not started |
| 7     | `learn-app` skeleton + Dashboard | not started |
| 8     | Core screens                     | not started |
| 9     | Figure/Cairo drawing             | not started |
| 10    | Packaging                        | not started |

## Scope decisions

**Ship in v1:** the entire deterministic learning core - content loading/validation, all 10
answer validators including the exact-value/surd parser, the diagnostic placement test, the
full learning engine (scoring, spaced repetition, rotation, gating, achievements,
misconceptions, dashboard aggregations) - and every screen except the two called out below.

**Deferred** (each is already optional/off-by-default in the TypeScript app, and dependency
analysis confirmed none of them block anything else in the port):

- **AI tutor (BYOK)** - `ai-gateway` depends only on `domain`; nothing else needs it. Skip
  `TutorPanel` and the AI-assisted question-drafting screen (`DraftReview`) in v1.
- **Cross-device sync** - off by default today, needs a server that doesn't exist yet, zero
  value on one machine.
- **Course-module authoring UI** (`Authoring.tsx`, browsing/installing third-party content) -
  the underlying loader logic is still ported in Phase 2, since it's cheap and shares the
  same code path as loading bundled content; only the screen is deferred. Bundled
  `content/mvp` is enough for a single user.

## Architecture

**GTK framework: [relm4](https://relm4.org/)**, not raw `gtk4-rs`. The app is fundamentally
event-sourced - every screen already works as "append event -> re-run a projection ->
re-render from the result" - which is exactly relm4's Elm-style `update(msg) -> model` loop.
Raw gtk4-rs has no opinion about this; hand-rolling the equivalent would mean reinventing a
worse relm4. Figure-drawing (Cairo) doesn't fit relm4's component model and isn't forced
into it - it's a plain `GtkDrawingArea` with a draw closure, held inside a relm4 component
but not itself reactive.

**Rust workspace** (dependency order, verified against actual TypeScript imports, not
assumed):

```
crates/
  learn-domain/            # pure types: Learner, SkillProgress, LearningEvent, MasteryScores. Zero deps.
  learn-content/           # schemas + curriculum MERGED - Ajv's job (runtime-compiled validation)
                            # doesn't exist in Rust; validate directly into serde structs instead.
                            # graph.rs (cycle detection, topo sort), loader.rs (7-stage pipeline),
                            # module.rs (course-module import/export envelope).
  learn-validation-engine/ # Rational, ExactValue/surd, all 10 validators, diagnose. NOT in domain -
                            # domain is data-only by design; these are algorithms.
  learn-diagnostic/        # binary-search placement. Zero deps even on domain (confirmed from source).
  learn-learning-engine/   # scoring, scheduler, state, progress (the projection), rotation, gating,
                            # session, dashboard, mastery-check, misconceptions, achievements, activity,
                            # difficulty. Depends on domain + content (needs SkillGraph).
  learn-persistence/       # rusqlite-backed EventStore + ModuleStore + repositories + projectLearner.
                            # Depends ONLY on domain - confirmed, does not depend on learning-engine.
  learn-app/                # binary crate: relm4 GTK4 shell + all screens.
fixtures/golden/            # committed JSON fixtures dumped from the real TS reference, for bit-identical
                            # testing of projectProgress and the rotation tie-break hash.
```

**Persistence**: rusqlite, two SQLite files (mirroring the current deliberate IndexedDB
separation of event log from installed content):

- `events.db`: single `events` table (`event_id TEXT PRIMARY KEY, learner_id, type,
created_at, seq, payload TEXT(JSON)`, unique `(learner_id, seq)`). The primary key on
  `event_id` combined with `INSERT OR IGNORE` gives idempotent append for free - the DB
  enforces the "duplicate events don't duplicate credit" invariant instead of app code
  having to. A tiny `kv_settings` table holds the one non-event fact the app needs
  (preferred learner id).
- `modules.db`: separate file, same reasoning as today - a schema change to installed-content
  storage must never be able to jeopardize progress data.
- One dedicated persistence worker thread owns the one `rusqlite::Connection` per file for
  its whole lifetime; all DB access goes through relm4 `WorkerController` message-passing,
  never touched from the GTK main thread.
- **Migration**: the TypeScript app's Settings screen already exports `{version:1, events:
LearningEvent[]}` (`packages/persistence/src/event-store.ts`'s `exportEvents`). The native
  app's first-run import reuses that exact JSON shape and the same idempotent-append loop -
  no schema translation needed. Export from the Tauri build once, import into the first
  native build.

**Testing without a browser**: the TypeScript project's existing regression guards are
almost entirely pure-function tests that never needed a DOM. Two things carry over directly:

1. **Content-answers guard**: a `learn-content` + `learn-validation-engine` integration test
   loads all 22 real `content/mvp/units/*.json` files and grades every question's stated
   `correct_answer` through the real validator, asserting correct. Same guard the TS suite
   already runs, same files, no fixtures needed.
2. **Golden-file bit-identical tests** for the two highest-precision-risk algorithms:
   `projectProgress` (the core mastery-scoring fold) and the rotation module's FNV-1a
   tie-break hash (`Math.imul`-based - the Rust port must use `wrapping_mul` on `i32`/`u32`
   and be checked against a fixture, not reasoned about from first principles, since JS's
   32-bit wraparound semantics are exactly the kind of thing that looks right in Rust and
   silently isn't). Fixtures get dumped once from the real TS functions and committed under
   `fixtures/golden/`.

Playwright's 63 e2e tests have no native equivalent worth building for a solo, single-user
app - an AT-SPI-driven UI harness is real but a disproportionate ongoing cost here. The
substitute: exhaustive engine-level tests (which cover every place a bug could silently
corrupt progress or grade an answer wrong) plus manual click-through per screen during
development, plus the existing CI pattern of launching the packaged binary under `xvfb-run`
and asserting it doesn't die within N seconds (catches the "builds but opens broken" class
of bug, cheaply, no new tooling).

**Figure rendering** (`Figure.tsx` -> Cairo, 6 diagram kinds, all static geometry): most
kinds are mechanical `move_to`/`line_to`/`arc` ports. Two need real care: `angle`'s arc
drawing (the TS emits an SVG elliptical-arc path with a large-arc-flag; the Rust port is
actually simpler since it controls angle generation directly and can call
`cr.arc()`/`cr.arc_negative()` with computed start/end angles rather than needing to convert
an arc-flag at all), and quadrant-aware label placement in `angle`/`unit_circle` (SVG's
`text-anchor` has no Cairo/Pango equivalent - needs `PangoLayout::pixel_extents()`-based
manual offsetting, same left/right conditional the TS already has, applied to a measured
width instead).

**UI surface**: 15 screens, but only 4 real input-widget patterns despite 12 content
"question types" - radio group, checkbox multi-select, reorderable list, plain text entry (7
of the 12 types share the last one, differing only in placeholder text). Build each widget
once in Phase 8, reuse across every question type.

## Phases

Each phase gates on the previous one's tests passing - mirrors the crate dependency order so
nothing is built against an unverified layer below it.

0. **Workspace scaffold.** 7 crates as empty stubs, CI (`cargo build/test --workspace`) on
   `ubuntu-22.04` - pinned deliberately, same glibc-forward-compatibility reasoning already
   recorded for the Tauri build in `.github/workflows/desktop.yml` (a 24.04-built binary
   needs `GLIBC_2.39` and won't start on Mint 21/22.04-base systems; this constraint applies
   unchanged to a native GTK binary). _Done:_ `cargo build --workspace && cargo test
--workspace` green, `.github/workflows/native.yml` runs it on `ubuntu-22.04`.
1. **`learn-domain`.** Port `events.ts`, `mastery.ts`, `skill-state.ts`, `learner.ts`,
   `progress.ts`, `errors.ts`, `diagnosis.ts` as serde structs/enums. Mechanical, no
   algorithms. _Done:_ round-trip serialize/deserialize tests pass; event-type and
   skill-state string enums checked against the TS literals.
2. **`learn-content`.** Port `curriculum/src/types.ts` (serde structs), `graph.ts` (cycle
   detection via 3-color DFS, topological sort via Kahn's algorithm - **must use a sorted
   structure, e.g. `BTreeSet`, for the ready-queue**, since the TS version sorts it every pop
   specifically for deterministic tie-breaking by skill_id), `loader.ts`'s 7-stage validation
   pipeline, `module.ts`. Ajv is dropped entirely; validation becomes typed deserialization
   plus hand-written ID-grammar/range checks. _Done:_ loads and validates all 22 real content
   unit files with zero errors; resulting topological order matches a golden fixture from the
   real TS loader byte-for-byte.
3. **`learn-validation-engine`.** Port `rational.ts`, `surd.ts` (the canonical
   `ExactValue{num,den,radicand,piExp}` form, square-free-radicand reduction loop, and
   field-equality comparison), all 10 validators, `diagnose.ts`. _Done:_ content-answers
   guard passes against all ~1,946 real questions; surd equality tests (`1/sqrt(2)` ==
   `sqrt(2)/2` == `sqrt(8)/4`) pass with zero floats compared.
4. **`learn-diagnostic`.** Port the binary-search placement algorithm (130 lines,
   self-contained). _Done:_ tests ported 1:1 from the existing suite pass.
5. **`learn-learning-engine`.** The largest, highest-density phase: `scoring.ts` (EMA
   update, difficulty-based ceilings/penalties), `scheduler.ts` (the `[0,1,3,7,14,30,90]`-day
   ladder, asymmetric promote-1/demote-2), `state.ts`, `progress.ts` (the core projection),
   `rotation.ts` (the FNV-1a hash, `tieBreak`, `rotateForPractice`, `selectForReview`),
   `gating.ts`, `session.ts`, `dashboard.ts`, `mastery-check.ts`, `misconceptions.ts`,
   `achievements.ts`, `activity.ts`, `difficulty.ts`. _Done:_ `projectProgress` and
   rotation-hash golden fixtures pass bit-for-bit against the TS reference; all ported unit
   tests green.
6. **`learn-persistence`.** rusqlite `EventStore` (idempotent append, `(learner_id, seq)`
   ordering, `nextSeq`), `ModuleStore`, `LearnerRepository`/`PracticeRepository`/
   `NotesRepository`, `projectLearner`. _Done:_ double-append is a no-op (idempotency test);
   a real exported JSON file from the current Tauri install imports cleanly and its projected
   learner/progress matches what the Tauri app shows for that data.
7. **`learn-app` skeleton.** relm4 shell (nav + screen-swap), the persistence worker thread,
   and one full vertical slice - Dashboard, since it's read-mostly and exercises
   content-load + event-read + projection without needing input widgets yet. _Done:_ launches
   against real content and real imported data, dashboard numbers match the Tauri app
   side-by-side.
8. **Core screens.** Welcome, GoalSelection, DiagnosticScreen/Results, CurriculumMap,
   LessonScreen (+ NotesPanel, no TutorPanel), PracticeScreen (both the sectioned entry and
   single-skill modes), MasteryCheckScreen, ReviewQueue, Progress, Settings, Learners,
   NotFound. Build the 4 input widgets once. _Done:_ every screen in the current nav graph is
   reachable and functional; a full practice session runs end to end and mastery scores
   update correctly.
9. **Figure/Cairo drawing.** `right_triangle`, `number_line`, `coordinate_plane`,
   `trig_graph` first (mechanical). `angle` and `unit_circle` last (arc geometry +
   quadrant-aware label placement, see above). `Progress`'s pentagon radar chart and unit
   bars are simple enough to draw the same way, no separate charting crate needed. _Done:_
   all 6 kinds render correctly for every real figure spec in the content set.
10. **Packaging.** `.deb`/`.rpm`/AppImage on `ubuntu-22.04`, reusing the existing
    `xvfb`-smoke-test pattern from `desktop.yml`. New constraint the Tauri build never had:
    the target systems' GTK4 runtime version floor (confirm Mint 21/22.04-base ships a GTK4
    new enough for whatever widgets get used). _Done:_ built package installs and launches on
    both a 22.04-base and a current system.

## Critical files (treat as the literal specification, not for reinterpretation)

- `packages/learning-engine/src/progress.ts` - the event-sourcing projection fold; source of
  Phase 5's golden fixtures.
- `packages/learning-engine/src/rotation.ts` - the FNV-1a/`Math.imul` tie-break hash;
  highest silent-divergence risk in the entire port.
- `packages/learning-engine/src/scoring.ts`, `.../scheduler.ts` - EMA mastery update and
  the asymmetric spaced-repetition ladder.
- `packages/validation-engine/src/surd.ts` - the canonical `ExactValue` parser; the
  exactness invariant must survive the port with zero floating-point comparison.
- `packages/curriculum/src/graph.ts`, `.../loader.ts` - cycle detection, the sorted-queue
  topological-sort determinism requirement, and the 7-stage validation pipeline order.
- `packages/persistence/src/event-store.ts` (interface spec) and `.../indexeddb-store.ts`
  (reference semantics) - what the rusqlite `EventStore` must match exactly.
- `apps/client/src/components/figures/Figure.tsx` - the 6 Cairo-drawing targets for Phase 9.

(All paths above are relative to the repository root, i.e. `packages/` and `apps/` are
outside `native/`.)

## Verification

- Every phase's `cargo test` must pass before the next phase starts (see per-phase "Done"
  criteria above) - this is the actual gate, not a suggestion. Update the Status table above
  the moment a phase's tests go green.
- CI runs `cargo build --workspace && cargo test --workspace` on `ubuntu-22.04` from Phase 0
  onward (`.github/workflows/native.yml`), same pattern as `desktop.yml`.
- Phase 2 and Phase 5 both require a one-time golden-fixture dump from the _current, real_
  TypeScript code (run the existing loader/`projectProgress`/rotation functions against real
  content and real/synthetic event logs, commit the JSON outputs under `fixtures/golden/`) -
  do this before writing the corresponding Rust, not after, so the fixture is provably
  independent of the port.
- Phase 6's migration test uses a real Settings export from the actual current Tauri
  install, not synthetic data - this is the step that directly protects the owner's existing
  progress.
- Final acceptance: the packaged native binary, run side-by-side with the current Tauri app
  on the same imported data, shows matching mastery scores, review schedule, and achievement
  state - then the Tauri build can be retired.
