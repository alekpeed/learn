# Decision Log

This log extends the template and initial decisions in `docs/spec/16_DECISION_LOG.md`.
DEC-001 … DEC-005 are **Accepted** in the source spec and carried forward unchanged.
DEC-006 … DEC-014 below are **Proposed** by the Phase 0 spec review and await sign-off before Phase 1 build begins.

Format: Title / Status / Context / Decision / Reasons / Alternatives / Consequences / Related.

---

## Carried forward (Accepted in spec)

- **DEC-001** Initial curriculum scope: math (arithmetic → intro algebra) + scientific reasoning & measurement.
- **DEC-002** Curriculum as a directed prerequisite graph.
- **DEC-003** Deterministic grading first; AI does not control verified mastery.
- **DEC-004** Local-first progress; cloud sync deferred.
- **DEC-005** AI as tutor, not authority.

---

## DEC-006: Event log is the source of truth; SkillProgress is a projection

Status: Proposed
Context: Doc 09 defines a `SkillProgress` entity with scores, while doc 08 §4 and doc 11 require progress to be reproducible from validated events with no duplicate credit (C-6).
Decision: The append-only **learning-event log is authoritative**. `SkillProgress` and all other progress state are **materialized projections**, rebuildable from events; projections are idempotent and keyed by event ID.
Reasons: Satisfies "reproducible from validated events," idempotent sync, and safe resume/recovery.
Alternatives: Mutable `SkillProgress` as source of truth (rejected — hard to reconcile/replay/sync).
Consequences: Persistence layer must implement an event store + projection rebuild; tests assert duplicate events do not double-count.
Related: 08, 09, 11.

## DEC-007: Skill ID grammar and unit-segment registry

Status: Proposed
Context: IDs appear as `subject.unit.skill` but the unit→segment mapping is not fixed and IDs must be stable and never reused (C-2, doc 09 §4).
Decision: Canonical ID = `subject.unit.skill`, lower_snake_case, ASCII. A fixed **unit-segment registry** lives in `packages/schemas`. Retired IDs are tombstoned, never reused.
Reasons: Stable, human-readable, greppable; prevents drift across authors/AI.
Alternatives: Opaque UUIDs (rejected — unreadable, harder to author/debug); free-form dotted paths (rejected — drift).
Consequences: Content-validation CLI enforces the grammar and registry; a linter rejects unknown unit segments.
Related: 05, 09, 14.

## DEC-008: Constrain MVP algebra answer forms to deterministically-checkable ones

Status: Proposed
Context: Deterministic grading vs. algebraic equivalence complexity (C-3).
Decision: MVP question authoring is restricted to answer forms a deterministic normalizer / lightweight equivalence check can verify (canonical simplified expressions, integer/fraction solutions, structured responses). No free-form proof grading in MVP.
Reasons: Preserves "every question has a validator" and "no AI-only grading" without a full CAS.
Alternatives: Integrate a general CAS now (rejected — scope/reliability); allow AI grading (rejected — DEC-003/005).
Consequences: Authoring standard gains an "allowed answer forms" section; validation-engine ships a normalizer with a documented supported set.
Related: 06, 08, 11.

## DEC-009: Mastery dimensions are driven by deterministically-gradable question types

Status: Proposed
Context: Understanding and Transfer must be scored without AI grading free text (C-4).
Decision: Define a **question-type → mastery-dimension mapping**. Understanding/Transfer are evidenced by structured reasoning, self-explanation-selection, and novel-context items — never free-text AI grading.
Reasons: Every dimension becomes deterministically measurable.
Alternatives: AI-graded explanations (rejected — DEC-003/005).
Consequences: Content authoring standard and question schema tag each item with the dimension(s) it feeds.
Related: 02, 04, 06, 10.

## DEC-010: MVP ships AI tutor off-by-default behind an optional thin gateway

Status: Accepted (2026-07-23) — implemented in Phase 8 with a local stub provider; a real provider drops into the same TutorProvider interface later

Context: MVP lists a basic tutor, but credentials must stay server-side and MVP is local-first (C-5).
Decision: All non-AI flows require **zero backend**. The tutor is **optional, off by default**, and — when enabled — routed through a minimal stateless AI-gateway service that holds provider credentials. No AI availability never blocks learning (doc 10 §7).
Reasons: Honors local-first + server-side-secrets + lowest-operational-priority for AI.
Alternatives: Browser-embedded key (rejected — leaks secrets); mandatory backend (rejected — breaks local-first MVP).
Consequences: `apps/service` is optional in MVP; client degrades gracefully with a clear "AI unavailable" status.
Related: 08, 10, 15.

## DEC-011: Authoritative MVP skill inventory (fully-connected slice)

Status: Accepted (2026-07-23) — approach approved; concrete list in `docs/planning/MVP_SKILL_INVENTORY.md` pending final review at the P0 gate
Context: Doc 03 (~36 topics) vs. doc 05 (~135 skills); completion rule demands full traversal (C-1, R-1).
Decision: MVP authors a **single fully-connected vertical slice** that still satisfies the completion rule end-to-end, then extends unit-by-unit. The concrete slice inventory is `docs/planning/MVP_SKILL_INVENTORY.md`.
Reasons: Bounds the dominant schedule risk while preserving the "no disconnected demos" rule.
Alternatives: Author all ~135 skills for MVP (accepted only if the user approves the larger scope/timeline).
Consequences: Directly sizes Phases 6–7; must be pinned before content authoring.
Related: 03, 05, 12, 13.

## DEC-012: Technology stack — TypeScript monorepo

Status: Accepted (2026-07-23)
Context: Stack is intentionally unspecified (docs 08, 14).
Decision: **TypeScript** across a single **monorepo** (workspaces). Client via React (or a comparable accessible component model); tests via Vitest (unit/integration) + Playwright (e2e/accessibility). Content validated by JSON Schema.
Reasons: One language for shared schemas + validators + client; strong typing suits deterministic logic; mature accessibility + testing ecosystem; easy provider-interface boundaries.
Alternatives: Python/other backend + JS client (rejected for MVP — two languages, no backend needed yet); multi-repo (rejected — harder shared-schema discipline).
Consequences: Sets tooling for Phase 1; all `packages/*` are TS libraries with no framework leakage into `domain`.
Related: 08, 14; PROPOSED_REPOSITORY_STRUCTURE.md.

## DEC-013: Local persistence via IndexedDB behind a store interface

Status: Accepted (2026-07-23) — follows from DEC-012 (TypeScript web client) + DEC-004
Context: Local-first MVP needs durable browser storage (DEC-004).
Decision: Persistence exposes a store interface; the MVP adapter uses **IndexedDB** with an append-only event table + projection tables. A cloud adapter is added later without changing callers.
Reasons: IndexedDB is the durable, offline-capable browser store; interface keeps it replaceable (doc 08 §9).
Alternatives: localStorage (rejected — size/structure limits); SQLite-wasm (viable later; heavier for MVP).
Consequences: Persistence package owns migrations + export/import; export required for local-only MVP (doc 15 §6).
Related: 08, 09, 15.

## DEC-014: Mastery-scoring and review-scheduling algorithms are explicit, testable specs

Status: Proposed
Context: Thresholds/intervals are given, but the score-update and interval promote/demote functions are not (R-3).
Decision: Draft both as documented, deterministic algorithms in Phase 0 (spec only), implement in Phase 4. Inputs per the spec (difficulty, hints, attempts, time-since-exposure, transfer vs. routine, review outcome). A single correct answer can never yield full mastery (doc 04 §9).
Reasons: Makes Phase 4 testable and prevents ad-hoc scoring.
Alternatives: Leave to implementation (rejected — untestable, drift-prone).
Consequences: Two new spec docs feed learning-engine tests.
Related: 02, 04, 12.

## DEC-015: Bring-your-own-key AI providers (client-side)

Status: Accepted (2026-07-23)

Context: The MVP has no backend, but users want to use a real AI tutor with their own OpenAI / Anthropic / Gemini key. Doc 08 §7 says provider credentials must stay server-side — that guidance targets a hosted, multi-user deployment, where the app owns the key.

Decision: For the local-first, single-user MVP, support **bring-your-own-key (BYOK)**. The learner selects a provider and pastes their own key in Settings. The browser calls the provider API directly. The key is stored in `localStorage` (per provider), kept **out of the event log and out of progress exports**. The provider/model selection (non-secret) lives in learner preferences. The built-in stub remains the default and needs no key.

Reasons: Enables a real tutor with zero backend; the user owns and controls their own key; keeping the key out of the event log prevents it leaking through export/import.

Alternatives: A hosted key-proxy backend (rejected for MVP — reintroduces the infrastructure the local-first MVP avoids; still the right model for a hosted multi-user deployment later); embedding a shared app key (rejected — never ship a shared secret in a client bundle).

Consequences: Real providers (`OpenAiProvider`, `AnthropicProvider`, `GeminiProvider`) implement the existing `TutorProvider` interface; the gateway still validates output and enforces isolation. A clear in-UI warning states the key is stored in the browser and sent directly to the provider (not for shared devices). When a hosted deployment arrives, move the key server-side behind the same interface.

Related: 08, 10, 15; DEC-005, DEC-010.

## DEC-016: Native desktop (Windows) deferred but kept possible

Status: Accepted (2026-07-23)

Context: A native Windows app is wanted, but not now — the requirement is that it remain _possible_ at final build time without rework.

Decision: Do not add a desktop shell yet. Keep the client a **static, local-first SPA** (bundled content, IndexedDB, localStorage; no server required to run) so it can be wrapped by Tauri (preferred: tiny installer, Windows WebView2) or Electron later with no application-code changes. Producing the Windows installer is a Windows-only compile step (a CI job on a Windows runner), added at packaging time.

Reasons: The wrapper needs exactly what the app already is; deferring avoids build-toolchain complexity now while preserving the option.

Consequences: Keep the app free of browser-only assumptions that a desktop webview would break; avoid hard dependencies on a hosted origin. When desktop is scheduled, add `apps/desktop` (Tauri) + a `windows-latest` CI build — no changes to the existing packages.

Related: 03 (native apps listed as Later); DEC-004 (local-first), DEC-013 (IndexedDB). **Realized by DEC-017.**

## DEC-017: Desktop shell implemented with Tauri v2

Status: Accepted (2026-07-23) — realizes DEC-016

Context: With the curriculum complete, the deferred Windows desktop build was scheduled. DEC-016 committed to keeping the client wrappable; this decision records how the wrap was actually done.

Decision: Add `apps/desktop/src-tauri` (Tauri v2) as a **shell only**. The Rust binary opens a native window and hosts the unchanged static client from `apps/client/dist` over Tauri's internal protocol — no dev server, no HTTP origin, no application-code changes. Network egress is restricted by a CSP `connect-src` allowlist naming only the three BYOK tutor endpoints. Windows installers (`.msi` and NSIS `.exe`) are produced by a `windows-latest` CI job (`.github/workflows/desktop.yml`), triggered manually or by a `v*` tag.

Reasons: Tauri uses the OS webview (WebView2 on Windows) rather than bundling Chromium, so the installer is a few megabytes instead of ~150 MB. Keeping the shell free of Tauri plugins avoids coupling application code to the desktop runtime, so the same bundle still runs as a plain web app.

Alternatives: Electron (rejected — far larger installer for no benefit here); routing tutor calls through Tauri's Rust HTTP plugin (deferred — OpenAI, the default provider, permits browser-origin calls, so the CSP allowlist is sufficient; the plugin remains the hardening path because `http-providers.ts` already takes an injectable `fetchImpl`).

Consequences: The CSP must include `'unsafe-eval'` in `script-src`. Ajv compiles JSON Schemas into JavaScript functions at runtime, so the curriculum loader cannot start without it; the first packaged build opened to a blank window for exactly this reason, because the browser build applies no CSP and nothing caught the difference. The exposure is limited (`default-src 'self'` still bars remote script, frame, and object sources, and the app never evaluates learner input, notes, or tutor output as code), but the proper fix is to precompile the schemas with Ajv's standalone code generation, which would remove the eval requirement and drop the ~140 KB validation chunk from the bundle. `tests/e2e/desktop-csp.spec.ts` now replays the packaged policy over the built bundle so a future tightening fails in CI instead of in a downloaded installer. The desktop app also keeps its own webview profile, so IndexedDB progress does not carry over from a browser session — progress export/import is the migration path. Unsigned installers trigger a Windows SmartScreen warning until a signing certificate is added. macOS bundling would additionally need an `.icns` icon, which is not generated yet.

Related: DEC-004 (local-first), DEC-013 (IndexedDB), DEC-015 (BYOK keys client-only), DEC-016 (the deferral this realizes).

---

## DEC-018: Multi-user features dropped from scope; this is a single-user product

Status: Accepted (2026-07-25) — product-owner decision, narrows DEC-001's long-term direction

Context: `03_VERSION_AND_SCOPE_PLAN.md` lists teacher dashboards, classrooms, social features and a marketplace or community-authored courses under Later Features, and `01_PRODUCT_VISION.md` carries the same ambitions. Phase 25 shipped the local half of that tier (multi-learner profiles, a local progress overview, achievements) and recorded the rest as gated on multi-user infrastructure. The owner has since confirmed the product is for their own use only.

Decision: **Teacher dashboards, classrooms, social features, and the marketplace / community-authored course tier are dropped.** Treat them as dead: do not plan around them, do not list them as remaining work, do not build toward them. The spec documents that name them are historical on this point; this decision supersedes them, and `ROADMAP.md` is the operative list.

This is a scope decision for the product as it stands, not a judgement that the features are bad. The one condition that would reopen it is the product ceasing to be single-user. Absent that, do not revive them — and in particular, do not reintroduce them because `docs/spec/` still mentions them. That is exactly the failure this entry exists to prevent.

Reasons: A single-user product gains nothing from any of them. Each also carries costs entirely disproportionate to the benefit here: accounts, authentication, authorization, hosting, and — for social features and a marketplace — moderation and abuse handling, which are open-ended obligations rather than one-time build work. Keeping them nominally in scope was distorting priorities: the sync server was justified largely as the thing that unblocked them, which made it look like the highest-leverage work remaining when it is not.

Alternatives: Leave them listed as "gated on demand" (rejected — indefinitely deferred items still consume attention in every planning pass and misrepresent what the product is). Build a stripped local imitation such as a read-only "guardian view" (rejected — Phase 25 already ships the honest version of that as the `/learners` overview; anything further would imply capabilities that do not exist).

Consequences: **The sync server's justification shrinks considerably.** It was previously the highest-leverage remaining item because teacher dashboards, classrooms, social features and the marketplace all needed the same multi-user foundation. With those gone it delivers exactly one thing — cross-device resume for one person moving between their own machines — which is genuine but no longer unblocks anything else. It should be re-prioritized accordingly, below the content and rendering work.

The multi-learner support built in Phase 25 is **kept**. It is built, tested and harmless, it costs nothing to retain, and it still serves the case of one person sharing a device with family. It is no longer a foundation for anything further.

Voice tutoring, handwriting recognition and interactive simulations are **not** covered by this decision. All three are single-user features, and they remain gated on capability (speech and ink models, and a content pipeline that admits code as well as data) rather than on multi-user infrastructure.

Course modules are unaffected: Phase 18 already ships courses as portable files, so sharing a course by sending someone a file continues to work. What is dropped is the hosted marketplace around it.

Related: DEC-001 (initial curriculum scope), DEC-004 (local-first), DEC-016 (static local-first SPA); `03_VERSION_AND_SCOPE_PLAN.md` Later Features; `docs/planning/ROADMAP.md` Phase 25.

---

## DEC-019: Handwriting and voice dictation dropped; simulations folded into a figure widget registry

Status: Accepted (2026-07-25) — resolves the remainder of the Phase 25 gated list

Context: DEC-018 dropped the multi-user tier, leaving three capability-gated items from `03_VERSION_AND_SCOPE_PLAN.md`: voice tutoring, handwriting recognition, and fully interactive scientific simulations. Each appears in the spec as a single bullet (lines 98-100) with no requirements or acceptance criteria attached, so there was nothing to build to and the shape of each was still an open question.

Decision, in three parts:

**Handwriting recognition is dropped.** For a single user at a keyboard the value is near zero, and it needs either a cloud API - which would break local-first, since the app has never transmitted learner content anywhere except the opt-in BYOK tutor - or a bundled ink model costing megabytes. The genuine friction it would have addressed is that typing notation such as `sqrt(3)/2` is awkward; a small input palette of buttons is the proportionate fix, and needs no model at all.

**Voice dictation is dropped; read-aloud is not adopted either, but stays cheap to add.** "Voice tutoring" is two features. Speech _in_ would use the browser's `SpeechRecognition`, which in Chrome uploads audio to a vendor's servers - an unacceptable trade against local-first, for a use case (dictating mathematical notation) that speech recognition handles badly. Speech _out_ via `speechSynthesis` needs no server, key or network, and would be genuinely useful on a long lesson. It is explicitly **not** an accessibility requirement: `02_PRODUCT_REQUIREMENTS.md` section 12 lists keyboard navigation, screen-reader labels, text size, contrast, themes, reduced motion, colour-independent status, text alternatives, focus states and plain language, all of which are already met. Read-aloud is therefore recorded as an optional addition on its merits, not an obligation, and is not scheduled.

**Interactive simulations are not a separate project.** They are folded into the figure and graph renderer as a **widget registry**: the application owns a small fixed set of renderers, and content names one and supplies parameters. This is the pattern the validators already use - content says `"validator": "exact_value"` and the code implements it - so curriculum stays data, is still validated by JSON Schema at load, and an installed course module still cannot smuggle executable content past the Phase 18 loader. Interactivity becomes an increment on that registry rather than a new architecture. A general-purpose physics sandbox remains dropped.

Reasons: The objection recorded against simulations was that "every simulation is code rather than data, which cuts against the standing constraint that curriculum stays data". That holds for arbitrary simulations but not for a fixed registry, where the only thing content contributes is a name and numbers. Recognising this collapses the largest remaining item into work already needed for a different reason: geometry, Algebra II and trigonometry have posed figures textually since Phase 14, and a trigonometry course in which no sine wave is ever drawn is a real limitation rather than a cosmetic one.

Alternatives: Allow content to supply drawing instructions or expressions to evaluate (rejected - that is a code channel wearing a data costume, and it would put arbitrary content on the far side of the schema gate). Ship figures as static images (rejected - they would not adapt to theme, text size or high contrast, and would need an author toolchain outside the repository).

Consequences: `figure` becomes an optional field on a question, carrying a `kind`, a parameter object, and a **required** `alt` string. Requiring `alt` in the schema means no figure can ever ship without a text equivalent, which is a stronger guarantee than review discipline. The existing content already describes its figures in words, so a rendered figure augments the prompt rather than replacing information - nothing is lost when it is not displayed. Adding a widget kind is an application change, deliberately: it keeps the set small and reviewed. A course module naming an unknown kind must degrade to its alt text rather than failing to load.

Related: DEC-002 (curriculum as data), DEC-016 (static local-first SPA), DEC-018 (single-user scope); `03_VERSION_AND_SCOPE_PLAN.md` Later Features lines 98-100.
