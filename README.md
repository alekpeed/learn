# Ground-Up Learning App

A local-first, mastery-based learning application that teaches mathematics (arithmetic → introductory algebra) and scientific reasoning from the ground up: it identifies missing prerequisites, teaches in dependency order, grades deterministically, tracks five-dimension mastery, and schedules spaced review.

> **Status: engine complete; curriculum ~96% authored.** The full mastery-based learning engine (Phases 0–9), the adaptive diagnostic, and an isolated AI tutor are built, wired, and tested, and four Version 1 features have shipped on top. The **content** now covers ~133 of the ~138 documented topics across **125 skills and 801 practice questions** — 14 of the 16 units are complete and none is missing. Phases 10–14 built out the entire mathematics course (including Coordinate Plane & Graphs, which added a deterministic `point`/coordinate validator), and Phase 15 completed the science course with the Experiments and Data units. The one remaining gap is a small Decimals/Percentages backfill. See [`docs/planning/PROJECT_SCOPE.md`](docs/planning/PROJECT_SCOPE.md) for the full scope beginning to end and [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md) for the remaining phases. Every acceptance criterion in `docs/spec/11_TESTING_AND_ACCEPTANCE.md` maps to a passing test in [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md).

## Documentation

| Document                                                                         | Purpose                                                                     |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`docs/HANDOFF.md`](docs/HANDOFF.md)                                             | **Start here for a new session:** current status, how to run, conventions.  |
| [`docs/planning/PROJECT_SCOPE.md`](docs/planning/PROJECT_SCOPE.md)               | **Full scope, beginning to end:** engine, 16-unit curriculum, tiers, trig.  |
| [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md)                           | Sequenced execution plan for all remaining phases (through desktop wrap).   |
| [`docs/spec/`](docs/spec/)                                                       | The 17 authoritative specification documents (source of truth).             |
| [`docs/reviews/00_SPEC_REVIEW.md`](docs/reviews/00_SPEC_REVIEW.md)               | Architecture + MVP scope summary; contradictions, missing decisions, risks. |
| [`docs/decisions/DECISION_LOG.md`](docs/decisions/DECISION_LOG.md)               | Decisions DEC-006 … DEC-014 (stack, scope, event-sourcing, ID grammar, …).  |
| [`docs/planning/`](docs/planning/)                                               | Phase 0/1 task plan and the authoritative MVP skill inventory.              |
| [`docs/spec-derived/`](docs/spec-derived/)                                       | Mastery-scoring, review-scheduling, and deployment specs.                   |
| [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)                         | Every acceptance criterion mapped to its passing test.                      |
| [`docs/PROPOSED_REPOSITORY_STRUCTURE.md`](docs/PROPOSED_REPOSITORY_STRUCTURE.md) | Target repository layout.                                                   |

## Repository layout

```
packages/
  domain/        Framework-agnostic types: skill state, mastery dimensions, events, errors
  schemas/       JSON Schemas for content + Ajv validator + fixtures (ID grammar, DEC-007)
  persistence/   Append-only event store (in-memory + IndexedDB), projections, learner repo
  curriculum/    Course-package loader: schema validation, graph (cycles, topo order)
  validation-engine/  Deterministic validators + rational arithmetic + error diagnosis
  learning-engine/    Mastery scoring, review scheduler, state machine, gating, progress
  diagnostic/         Adaptive placement (binary-search boundary detection)
  ai-gateway/         Isolated tutor gateway + providers: stub + BYOK OpenAI/Claude/Gemini
apps/
  client/        Vite + React app: shell, lessons, practice, progress, review queue
content/mvp/     Curriculum content ONLY (data): manifest, courses, one file per unit
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
