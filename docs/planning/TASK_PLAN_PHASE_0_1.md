# Task Plan — Phase 0 and Phase 1 Only

Status: Draft for approval
Scope: Covers **only** the roadmap's Phase 0 (Project Definition) and Phase 1 (Application Foundation). Phase 2+ is explicitly out of scope until approved (doc 12; review request item 5).

Legend: each task lists **Objective**, **Deliverable**, **Acceptance** (from docs 11–13 where applicable), and **Dependencies**. Backlog IDs (FND-###) reference `docs/spec/13_IMPLEMENTATION_BACKLOG.md`.

---

## Phase 0 — Project Definition

Roadmap deliverables: approved documentation package, confirmed MVP scope, initial decision log, repository structure, content schema draft.

### P0-1 — Vendor spec into repo & establish source of truth  ✅ done in this pass
- **Deliverable:** `docs/spec/` (17 docs), `docs/reviews/00_SPEC_REVIEW.md`.
- **Acceptance:** Spec docs present and unmodified; review published.
- **Dependencies:** none.

### P0-2 — Record open decisions  ✅ done in this pass (Proposed)
- **Deliverable:** `docs/decisions/DECISION_LOG.md` (DEC-006 … DEC-014).
- **Acceptance:** Every contradiction/missing decision in the review maps to a decision entry.
- **Dependencies:** P0-1.

### P0-3 — Confirm authoritative MVP skill inventory  ⛔ needs user sign-off
- **Objective:** Resolve C-1 / DEC-011 — pin the exact MVP skill list.
- **Deliverable:** `docs/planning/MVP_SKILL_INVENTORY.md` — a fully-connected slice (skills, prerequisite edges, unit membership) that satisfies the completion rule.
- **Acceptance:** Graph is connected end-to-end (no dangling prerequisites); every listed skill has a stable ID; sign-off recorded in DEC-011.
- **Dependencies:** decision on scope size (user).

### P0-4 — Content schema draft
- **Objective:** Machine-validatable schemas for course/unit/skill/lesson/question/validator/misconception + package manifest (backlog CUR-001; docs 06, 09, 08 §6).
- **Deliverable:** JSON Schemas in `packages/schemas` (draft), the ID grammar (DEC-007), and `schema_version`/`content_version` rules; 1 valid + 1 invalid example fixture each.
- **Acceptance (CUR-001):** valid examples pass; invalid references fail; schema version required.
- **Dependencies:** DEC-007, DEC-012.

### P0-5 — Finalize repository structure & stack decision
- **Objective:** Approve `PROPOSED_REPOSITORY_STRUCTURE.md` and DEC-012/013.
- **Deliverable:** signed-off structure + stack; no code yet.
- **Acceptance:** structure + stack marked Accepted in the decision log.
- **Dependencies:** DEC-012, DEC-013 (user).

### P0-6 — Draft mastery-scoring & review-scheduling algorithms
- **Objective:** DEC-014 — turn thresholds/intervals into explicit, testable functions.
- **Deliverable:** `docs/spec-derived/MASTERY_SCORING.md` and `REVIEW_SCHEDULING.md` (algorithms + worked examples + edge cases).
- **Acceptance:** every input from docs 04 §§9–10 is used; "one correct answer ≠ full mastery" is provable from the formula; review failure demonstrably shortens the next interval.
- **Dependencies:** P0-3 (informs thresholds per skill).

### P0-7 — Phase 0 approval gate
- **Deliverable:** all Phase 0 decisions Accepted.
- **Acceptance:** documentation package approved; MVP scope confirmed; decision log complete. **No Phase 1 build starts before this gate passes.**

---

## Phase 1 — Application Foundation

Roadmap build: application shell, navigation, local learner profile, settings, local persistence, basic error handling, test framework.
Roadmap exit criteria: app opens reliably; profile and settings persist; navigation works; automated tests run.

> Phase 1 deliberately excludes curriculum loading, validators, the learning engine, the diagnostic, content, and the AI tutor. Those are Phase 2+.

### P1-1 — Initialize project & toolchain  (FND-001)
- **Objective:** Base monorepo, build, lint/format, typecheck, test runner, CI.
- **Deliverable:** workspace root + empty `packages/domain`, `packages/schemas`, `packages/persistence`, `apps/client`; CI running install → typecheck → lint → unit tests.
- **Acceptance (FND-001):** app starts; dev **and** prod builds succeed; automated test command succeeds; CI green.
- **Dependencies:** P0-5.

### P1-2 — Navigation shell & routes  (FND-002)
- **Objective:** Layout + routes for every MVP screen (Welcome, Goal Selection, Diagnostic, Diagnostic Results, Dashboard, Curriculum Map, Lesson, Practice, Mastery Check, Review Queue, Progress, Settings) as placeholders.
- **Deliverable:** routed shell; unknown-route recovery page; keyboard-navigable skeleton honoring the one-primary-action rule (doc 07 §3).
- **Acceptance (FND-002):** all MVP screens have routes; unknown routes show a recovery page; keyboard navigation works.
- **Dependencies:** P1-1.

### P1-3 — Local persistence foundation
- **Objective:** Store interface + append-only event log + projection scaffolding (DEC-006/013). No curriculum data.
- **Deliverable:** `packages/persistence` with IndexedDB adapter, event append (idempotent by event ID), projection rebuild hook, export/import stub.
- **Acceptance:** events append without duplication; projection rebuild is deterministic; unit tests cover idempotency and rebuild. Supports doc 11 "duplicate events do not duplicate credit."
- **Dependencies:** P1-1.

### P1-4 — Local learner profile  (FND-003)
- **Objective:** Create and persist a local learner; reset flow.
- **Deliverable:** profile create/load via persistence; reset-local-data with confirmation.
- **Acceptance (FND-003):** profile survives restart; user can reset local data; reset requires confirmation.
- **Dependencies:** P1-3.

### P1-5 — Settings & accessibility baseline
- **Objective:** Settings screen (doc 07 §2) + accessibility foundations (doc 02 §12).
- **Deliverable:** persisted settings — text size, contrast, motion, sound, session length, AI-tutor availability toggle, data export, data reset; global a11y primitives (focus management, skip links, color-independent status, reduced-motion honoring).
- **Acceptance:** settings persist across restart (roadmap exit criterion); keyboard-only operation; status conveyed by more than color; text usable at enlarged sizes (doc 11 §4).
- **Dependencies:** P1-3, P1-2.

### P1-6 — Basic error handling & screen-state model
- **Objective:** Classified errors, recovery page, and the seven screen states (doc 07 §4).
- **Deliverable:** error boundary + classified error type (doc 14 §5); loading/empty/active/success/recoverable-error/offline states as reusable primitives; "never lose progress / never erase an answer without explicit action" guarantees (doc 07 §3).
- **Acceptance:** interrupted session resumes safely (doc 11); recoverable errors show useful, non-generic messages; no secret leakage in errors.
- **Dependencies:** P1-2, P1-3.

### P1-7 — Test framework & baseline suites
- **Objective:** Establish the test pyramid early (doc 11, doc 14 §4).
- **Deliverable:** Vitest unit/integration setup; Playwright e2e smoke (open app, navigate all routes, reset flow); automated accessibility smoke (keyboard traversal, focus order, contrast/reduced-motion checks) on the shell.
- **Acceptance:** `test` command runs all suites in CI; navigation + profile + persistence covered; a11y smoke passes on existing screens.
- **Dependencies:** P1-1 … P1-6.

### P1-8 — Phase 1 exit review
- **Acceptance (roadmap Phase 1):** app opens reliably; profile and settings persist; navigation works; automated tests run in CI. Definition-of-Done (doc 11 §5) satisfied for each task. **Stop for approval before Phase 2.**

---

## Cross-cutting guardrails (apply to every task above)

- Keep curriculum content out of `packages/*` and `apps/*` (docs 02 §2, 14 §1).
- Keep provider integrations behind interfaces (persistence, and later AI) (docs 08 §9, 14 §1).
- Add tests with every behavior change; update docs when schemas/rules/APIs change (doc 14 §§7–8).
- Fail explicitly when verified data is missing (doc 14 §1).
- No AI write-path to verified state — enforced from the first persistence commit (docs 08 §5, 11 §2).
