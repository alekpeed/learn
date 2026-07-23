# Ground-Up Learning App

A local-first, mastery-based learning application that teaches mathematics (arithmetic → introductory algebra) and scientific reasoning from the ground up: it identifies missing prerequisites, teaches in dependency order, grades deterministically, tracks five-dimension mastery, and schedules spaced review.

> **Status: Phase 0 (Project Definition).** No application code yet. This repository currently holds the specification and the Phase 0 planning artifacts. Phase 1 build begins only after the open decisions are approved.

## Where to start

| Document | Purpose |
|---|---|
| [`docs/spec/`](docs/spec/) | The 17 authoritative specification documents (source of truth). Read in `00_README.md` order. |
| [`docs/reviews/00_SPEC_REVIEW.md`](docs/reviews/00_SPEC_REVIEW.md) | Architecture + MVP scope summary; contradictions, missing decisions, and risks. |
| [`docs/PROPOSED_REPOSITORY_STRUCTURE.md`](docs/PROPOSED_REPOSITORY_STRUCTURE.md) | Proposed repository layout and package boundaries. |
| [`docs/decisions/DECISION_LOG.md`](docs/decisions/DECISION_LOG.md) | Open decisions (DEC-006 … DEC-014) awaiting sign-off. |
| [`docs/planning/TASK_PLAN_PHASE_0_1.md`](docs/planning/TASK_PLAN_PHASE_0_1.md) | Task plan for Phase 0 and Phase 1 only. |

## Source-of-truth priority

When documents conflict (per `docs/spec/00_README.md`): Product Requirements → Version & Scope Plan → Learning System Spec → Curriculum Architecture → Technical Architecture → Implementation Backlog. Unresolved conflicts are recorded in the decision log before implementation continues.

## Non-negotiable principles

- **Deterministic grading** owns correctness and mastery; **AI never writes verified state**.
- **Curriculum content is data**, kept separate from application logic.
- **Local-first** progress, derived from append-only learning events.
- **Accessibility baseline** across every screen and state.

## Approval gate

Proceeding to Phase 1 requires sign-off on the decisions in the decision log — in particular the **technology stack** (DEC-012) and the **authoritative MVP skill inventory** (DEC-011).
