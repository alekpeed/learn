# Ground-Up Learning App

A local-first, mastery-based learning application that teaches mathematics (arithmetic → introductory algebra) and scientific reasoning from the ground up: it identifies missing prerequisites, teaches in dependency order, grades deterministically, tracks five-dimension mastery, and schedules spaced review.

> **Status: Phase 3 (Practice and Validation) complete.** On top of the curriculum platform, the repository now has a deterministic validation engine (numeric, fraction, decimal, percentage, unit, and choice validators with equivalence), deterministic error diagnosis, attempt + hint persistence, and a question renderer with a progressive hint ladder and specific feedback. The learning engine, the diagnostic, and the AI tutor arrive in Phase 4+.

## Documentation

| Document                                                                         | Purpose                                                                     |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`docs/spec/`](docs/spec/)                                                       | The 17 authoritative specification documents (source of truth).             |
| [`docs/reviews/00_SPEC_REVIEW.md`](docs/reviews/00_SPEC_REVIEW.md)               | Architecture + MVP scope summary; contradictions, missing decisions, risks. |
| [`docs/decisions/DECISION_LOG.md`](docs/decisions/DECISION_LOG.md)               | Decisions DEC-006 … DEC-014 (stack, scope, event-sourcing, ID grammar, …).  |
| [`docs/planning/`](docs/planning/)                                               | Phase 0/1 task plan and the authoritative MVP skill inventory.              |
| [`docs/spec-derived/`](docs/spec-derived/)                                       | Deterministic mastery-scoring and review-scheduling algorithm specs.        |
| [`docs/PROPOSED_REPOSITORY_STRUCTURE.md`](docs/PROPOSED_REPOSITORY_STRUCTURE.md) | Target repository layout.                                                   |

## Repository layout

```
packages/
  domain/        Framework-agnostic types: skill state, mastery dimensions, events, errors
  schemas/       JSON Schemas for content + Ajv validator + fixtures (ID grammar, DEC-007)
  persistence/   Append-only event store (in-memory + IndexedDB), projections, learner repo
  curriculum/    Course-package loader: schema validation, graph (cycles, topo order)
  validation-engine/  Deterministic validators + rational arithmetic + error diagnosis
apps/
  client/        Vite + React app: shell, screens, lesson renderer, practice + hints
content/         Curriculum content ONLY (data) — sample package now; full slice in Phase 6/7
tests/e2e/       Playwright smoke + accessibility (axe-core) + curriculum flow
docs/            Specification and planning
```

## Development

Requires Node ≥ 20 and pnpm 10.

```bash
pnpm install            # install workspace dependencies
pnpm dev                # run the client (http://localhost:5173)
pnpm typecheck          # tsc --noEmit across the workspace
pnpm test               # Vitest: unit + integration (all packages)
pnpm validate:content   # content-schema validation (CUR-001)
pnpm build              # production build of the client
pnpm test:e2e           # Playwright end-to-end + accessibility smoke
pnpm lint               # Prettier format check
```

CI (`.github/workflows/ci.yml`) runs lint → typecheck → tests → content validation → build → e2e.

## Non-negotiable principles

- **Deterministic grading** owns correctness and mastery; **AI never writes verified state**.
- **Curriculum content is data**, kept separate from application logic.
- **Local-first** progress, derived from an append-only, idempotent event log.
- **Accessibility baseline** across every screen and state.

## Source-of-truth priority

When documents conflict (per `docs/spec/00_README.md`): Product Requirements → Version & Scope Plan → Learning System Spec → Curriculum Architecture → Technical Architecture → Implementation Backlog. Unresolved conflicts are recorded in the decision log.
