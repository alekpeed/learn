# Ground-Up Learning App

A local-first, mastery-based learning application that teaches mathematics (arithmetic → introductory algebra) and scientific reasoning from the ground up: it identifies missing prerequisites, teaches in dependency order, grades deterministically, tracks five-dimension mastery, and schedules spaced review.

> **Read [`CLAUDE.md`](CLAUDE.md) first.** The 17-document package in [`docs/spec/`](docs/spec/) is the authority on scope, curriculum and sequencing - it outranks this README, the handoff, and the code. Never state scope from memory; open the file.
>
> **Status: engine complete; documented curriculum complete; Version 1 feature set complete; two Track D courses shipped.** The mastery-based learning engine (Phases 0-9), adaptive diagnostic and isolated AI tutor are built and tested. Phases 10-16 completed the full documented curriculum at uniform depth; Phases 17-20 completed the Version 1 feature set (misconception remediation, downloadable course modules, author-gated AI practice drafts, optional sync); Phases 21-22 added Geometry and Algebra II. The curriculum now stands at **154 skills and 1,313 practice questions across 17 unit files** (120/1,040 mathematics, 34/273 scientific reasoning), plus a 57-record misconception catalog. Note that the science course teaches scientific _method_, not subject matter - physics, chemistry and biology are Phase 24. See [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md) for the real remaining sequence and [`docs/HANDOFF.md`](docs/HANDOFF.md) for current state and known gaps.

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
  desktop/       Tauri v2 shell: native window hosting the built client (DEC-016/017)
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

pnpm desktop:dev        # Tauri desktop window, live-reloading against Vite
pnpm desktop:build      # native binary + installers for the host platform
```

The desktop shell needs a Rust toolchain (plus `libwebkit2gtk-4.1-dev librsvg2-dev
libgtk-3-dev` on Linux). **Windows `.msi`/NSIS installers are built by CI** —
`.github/workflows/desktop.yml`, on manual dispatch or a `v*` tag — because that
bundle has to be compiled on Windows.

CI (`.github/workflows/ci.yml`) runs lint → typecheck → tests → content validation → build → e2e. A separate `desktop.yml` workflow produces the Windows installers.

## Non-negotiable principles

- **Deterministic grading** owns correctness and mastery; **AI never writes verified state**.
- **Curriculum content is data**, kept separate from application logic.
- **Local-first** progress, derived from an append-only, idempotent event log.
- **Accessibility baseline** across every screen and state.

## Source-of-truth priority

When documents conflict (per `docs/spec/00_README.md`): Product Requirements → Version & Scope Plan → Learning System Spec → Curriculum Architecture → Technical Architecture → Implementation Backlog. Unresolved conflicts are recorded in the decision log.
