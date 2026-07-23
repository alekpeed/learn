# Specification Review — Ground-Up Learning App

Status: Draft for approval
Reviewer: Claude (spec-review pass)
Scope of this review: the 17-document package in `docs/spec/`. No application code has been written.

This document delivers items 1–2 of the review request (architecture + MVP scope summary; contradictions, missing decisions, and risks). The proposed repository structure is in `docs/PROPOSED_REPOSITORY_STRUCTURE.md`, the Phase 0/1 task plan is in `docs/planning/TASK_PLAN_PHASE_0_1.md`, and open decisions are recorded in `docs/decisions/DECISION_LOG.md`.

---

## 1. Intended Architecture (as specified)

The specification describes a **local-first, offline-capable, mastery-based learning engine** built from replaceable, testable services with a hard boundary between **deterministic verified state** and **AI assistance**.

### 1.1 Logical components (doc 08)

| Component               | Responsibility                                                                                                              | Key constraint                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Client application**  | UI, navigation, lesson rendering, answer input, local caching, offline behavior, progress display                           | Must work without AI; keyboard + screen-reader accessible |
| **Application service** | Learner state, session orchestration, mastery updates, review scheduling, diagnostic flow, access control, sync             | Owns orchestration; sync is a later phase                 |
| **Curriculum service**  | Course packages, skill graph, lesson/question retrieval, content versioning + validation                                    | Content is data, not code                                 |
| **Validation engine**   | Numeric / fraction / percentage / (limited) algebraic / unit equivalence, structured checks, error-rule matching            | Deterministic; the sole authority on correctness          |
| **Learning engine**     | Prerequisite checks, difficulty selection, mastery scoring, review scheduling, skill-state transitions, remediation routing | Deterministic; updates only from validated events         |
| **AI tutor gateway**    | Prompt construction, context filtering, provider abstraction, output validation, rate/cost control, logging, fallback       | Isolated; cannot write verified state                     |
| **Persistence layer**   | Local DB (MVP), optional cloud DB (later), sync queue, conflict handling, backups, export/import                            | Local-first; append-only events where practical           |

### 1.2 Core architectural invariants

1. **Deterministic grading first** (DEC-003). AI never decides correctness or mastery. The validation engine and learning engine are the only writers of verified state.
2. **AI isolation** (DEC-005, doc 08 §5). AI output cannot write correct-answer records, mastery scores, review dates, prerequisite relationships, or curriculum definitions. Suggestions pass through controlled application logic.
3. **Curriculum-as-data, separate from code** (docs 02 §2, 14 §1). Skills form a directed prerequisite graph (DEC-002); content is versioned, schema-validated packages.
4. **Local-first, event-derived progress** (docs 08 §3–4, DEC-004). Progress should be derived from append-only learning events; sync (later) is idempotent and conflict-resolved by event ID + timestamp.
5. **Replaceability** (doc 08 §9). Frontend framework, DB, auth, AI provider, hosting, and analytics all sit behind interfaces.
6. **Operational priority** (doc 15 §10). Core lessons, deterministic practice, saved progress, and review scheduling outrank AI tutoring and visual polish.

### 1.3 The learning model

- **Knowledge model:** directed dependency graph of skills; a learner can be strong on one branch and weak on another (doc 04 §1).
- **Skill state machine:** `unknown → diagnosed_weak → learning → practicing → provisionally_mastered → mastered`, plus `review_due` and `decayed` (doc 04 §2).
- **Five mastery dimensions**, each 0–100: Understanding, Accuracy, Independence, Retention, Transfer, with explicit per-skill thresholds (defaults 80/85/80/75/70) (doc 04 §3).
- **Learning cycle** per skill: prerequisite check → intuitive intro → concrete/visual → formal → worked examples → guided → independent → mixed → mastery check → spaced review (doc 04 §4).
- **Spaced review** intervals: same-day, 1, 3, 7, 14, 30, 90 days; lengthen on delayed success, shorten on failure (docs 02 §7, 04 §10).
- **Progressive hint ladder** (6 rungs) reduces independence evidence without counting as outright failure (doc 04 §7).
- **Prerequisite repair:** detect the likely-missing prerequisite, confirm, pause current skill, route to prerequisite, return with preserved context (doc 04 §5).

---

## 2. MVP Scope Summary

**MVP objective (doc 03):** a complete, traversable learning engine with enough mathematics (and scientific-reasoning) content to prove the educational model. The **completion rule** is explicit: the _entire scoped curriculum_ must be traversable through prerequisites → lessons → practice → mastery checks → review. Disconnected demo screens do not count.

**In scope for MVP:** local learner profile; optional adaptive diagnostic; skill dependency graph; lessons; guided + independent practice; progressive hints; deterministic answer validation; five-dimension mastery tracking; spaced review queue; curriculum map; basic AI tutor; local-first persistence; progress export; accessibility baseline; automated core tests.

**Explicitly excluded from MVP (doc 03):** cloud accounts / sync / cross-device, content admin UI, richer visualizations, AI-drafted practice, notes, study plans, leaderboards, public profiles, multiplayer, teacher tooling, marketplace, AI-generated curriculum, AI-only grading, advanced science.

**Subjects:** Mathematics (arithmetic → introductory algebra) and Scientific Reasoning & Measurement.

**Phasing (doc 12):** Phase 0 project definition → Phase 1 application foundation → Phase 2 curriculum platform → Phase 3 practice/validation → Phase 4 learning engine → Phase 5 diagnostic → Phase 6/7 content → Phase 8 AI tutor → Phase 9 quality/release. This review covers Phase 0 and plans Phase 1 only.

---

## 3. Contradictions & Ambiguities (must resolve before the phase they affect)

> Resolution priority when documents conflict (doc 00): Requirements → Scope plan → Learning-system spec → Curriculum architecture → Technical architecture → Backlog. Each item below proposes a resolution and points to a decision-log entry.

### C-1 — MVP curriculum size is ambiguous (HIGHEST IMPACT)

`03_VERSION_AND_SCOPE_PLAN` lists ~21 math + ~15 science _topics_. `05_CURRICULUM_ARCHITECTURE` breaks the same subjects into **12 math units (~100 skills) + 4 science units (~35 skills)** — far more granular. The completion rule demands the _entire scoped curriculum_ be traversable, so the difference between "~36 skills" and "~135 skills" is a multiple-fold change in content-authoring effort and is the dominant schedule risk.
**Proposed resolution:** treat doc 03's list as the unit-level headline and doc 05 as the authoritative skill inventory, but **cut MVP to a single fully-connected vertical slice that still satisfies the completion rule** — e.g. Number Foundations → Addition/Subtraction → Multiplication/Division → Fractions → one algebra unit, plus Scientific Thinking + Measurement — with the remaining units authored in Phase 6/7 as capacity allows. Requires an explicit, signed-off **MVP skill inventory** (→ DEC-011). Priority rules make doc 03 govern, but the exact skill list must be pinned, not inferred.

### C-2 — Skill ID grammar is implied but never defined

Examples use `math.integers.addition`, `math.algebra.one_step_equations`, `math.graphs.linear_relationships` (doc 05 §5) and `math.fractions.add_like_denominators` with `unit_id: "math.fractions"` (doc 09 §3). The segment for unit 12 ("Coordinate Plane and Graphs") appears as `graphs`, so the mapping from unit titles to ID segments is not fixed. IDs must be "stable across versions" and never reused (doc 09 §4), so the grammar must be decided **before any content is authored**.
**Proposed resolution:** adopt `subject.unit.skill` lower-snake, with a fixed unit-segment registry. → DEC-007.

### C-3 — "Deterministic grading" vs. algebraic / free-form answers

Doc 08 lists "algebraic equivalence _where supported_"; doc 11 requires _every_ question to have a validator and forbids accepting wrong answers via AI. Algebra units (evaluate expressions, combine like terms, distributive property, two-step equations) can require equivalence checks that need a small CAS to do safely, and doc 03 excludes "AI-only grading."
**Proposed resolution:** constrain MVP algebra answer forms to what a deterministic normalizer/light CAS can check (canonical simplified form, integer/fraction solutions), and restrict question authoring to those forms until a validated algebraic validator exists. → DEC-008.

### C-4 — How are **Understanding** and **Transfer** scored deterministically?

Mastery needs all five dimensions, and a named test case is "learner can calculate but cannot explain meaning" (doc 11 §3). But AI may not grade free-form work (docs 02 §9, 10 §3) and grading is deterministic. Free-text explanation cannot be the mechanism.
**Proposed resolution:** define a **question-type → dimension mapping** (e.g. structured/multiple-choice reasoning and self-explanation-selection items feed Understanding; novel-context and mixed items feed Transfer), so every dimension is driven by deterministically-gradable item types. This mapping is a Phase 0 spec deliverable. → DEC-009.

### C-5 — MVP AI tutor vs. "credentials server-side" vs. pure local-first

MVP includes "basic AI tutor integration" (doc 03) and requires AI provider credentials to stay server-side (doc 08 §7), but DEC-004 makes the MVP local-first with cloud deferred. A browser-only client cannot hold a server-side secret.
**Proposed resolution:** MVP needs a **thin AI-gateway backend** (only for the tutor) OR the tutor is delivered via a user-supplied key / disabled by default. Since AI is explicitly the lowest operational priority (doc 15 §10) and must be fully optional (doc 10 §7), recommend: ship MVP with the tutor **off by default and behind a minimal stateless gateway** that can be deployed later; all non-AI flows work with zero backend. → DEC-010.

### C-6 — SkillProgress table vs. event-sourced progress

Doc 09 defines entity tables _including_ `SkillProgress` with concrete scores, while doc 08 §4 and doc 11 ("progress reproducible from validated events", "duplicate events do not duplicate credit") point to event-sourcing.
**Proposed resolution:** treat the append-only **event log as the source of truth** and `SkillProgress` as a **materialized, reproducible projection**. Projections must be idempotent and rebuildable. → DEC-006.

### C-7 — Diagnostic "begin near the middle of the initial course" vs. graph model

Doc 04 §12 says start "near the middle of the initial course," but the model is a graph, not a line (doc 04 §1). "Middle" is undefined for a graph.
**Proposed resolution (Phase 5, noted now):** define an ordering (topological depth / unit index) that gives a well-defined mid-point entry for the diagnostic. Non-blocking for Phase 0/1.

### C-8 — Minor data-model gaps

`Attempt` has no **confidence** field, though confidence input drives adaptive difficulty (docs 02 §5, 04 §6). No entity captures **misconception detections** as first-class records for analytics, though misconceptions are richly specified (doc 06 §8). Add a `confidence` field to Attempt and consider a `MisconceptionEvent`.

---

## 4. Missing Decisions (to sign off in Phase 0)

These are genuinely open because the docs are deliberately coder-agnostic. Recommendations are in `docs/decisions/DECISION_LOG.md` (DEC-006 … DEC-014) and summarized here:

1. **Technology stack** — language, client framework, test tooling (recommendation: TypeScript monorepo; React or comparable; Vitest + Playwright). → DEC-012
2. **Local persistence engine** — recommendation: IndexedDB via a thin interface, append-only event store + projections. → DEC-013
3. **Content format & schema tooling** — recommendation: JSON content validated by JSON Schema (authoritative, language-neutral) with a build-time content-validation CLI. → DEC-007 companion.
4. **Skill ID grammar & unit-segment registry.** → DEC-007
5. **Event log as source of truth; projection rules.** → DEC-006
6. **Mastery scoring algorithm** — no formula is given; the update function must be an explicit, testable spec. Draft in Phase 0, implement in Phase 4. → DEC-014
7. **Review scheduling algorithm** — intervals are listed but the promote/demote and retention-mapping rules are not. Draft in Phase 0. → DEC-014
8. **MVP backend posture for AI** (see C-5). → DEC-010
9. **Repository layout: monorepo vs. multi-repo** (recommendation: monorepo). → DEC-012
10. **Authoritative MVP skill inventory** (see C-1). → DEC-011

---

## 5. Implementation Risks

| #   | Risk                                                                                                                                                                                                   | Severity | Mitigation                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | **Content volume.** Full lesson template (14 parts) + worked examples + validated question sets + hints + misconceptions per skill, across dozens of skills, with a "no demo screens" completion rule. | High     | Pin a minimal fully-connected MVP slice (C-1); build a content-validation CLI early; author content against schema from day one. |
| R-2 | **Deterministic grading of algebra/understanding/transfer** (C-3, C-4).                                                                                                                                | High     | Constrain answer forms; define dimension→question-type mapping before authoring.                                                 |
| R-3 | **Mastery & review algorithms unspecified** — untestable until defined.                                                                                                                                | Med-High | Draft explicit algorithms in Phase 0 as documented, testable specs.                                                              |
| R-4 | **Accessibility baseline is broad** (keyboard, SR labels, focus order, contrast, reduced motion, color-independent status, resizable text) across every screen and state.                              | Med      | Bake into the Phase 1 shell and screen-state model; add automated a11y smoke tests from the first screen.                        |
| R-5 | **Offline correctness + idempotent events** — duplicate-credit and safe-resume bugs are easy to introduce.                                                                                             | Med      | Event IDs + idempotent projections from Phase 1; explicit resume/recovery tests.                                                 |
| R-6 | **AI-isolation discipline** — architectural boundary is easy to erode under feature pressure.                                                                                                          | Med      | Enforce via interfaces + tests asserting AI paths cannot write verified state (doc 11 §2 AI criteria).                           |
| R-7 | **Scope creep into later phases.**                                                                                                                                                                     | Med      | Phase gates with exit criteria (doc 12); this review stops at Phase 1 pending approval.                                          |

---

## 6. What is NOT being done in this pass

- No application code, scaffolding, package manifests, or dependencies added.
- No later-phase work (Phase 2+). No content authoring.
- No unilateral lock-in of the technology stack — recommendations are proposed, pending sign-off (§4).

Proceeding to Phase 1 (Application Foundation) requires approval of the decisions in `docs/decisions/DECISION_LOG.md`, in particular the technology stack (DEC-012) and the authoritative MVP skill inventory (DEC-011).
