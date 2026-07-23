# Proposed Repository Structure

Status: Proposal for approval (Phase 0 deliverable)

The specification is deliberately coder-agnostic (docs 08, 14). The layout below is framework-independent in shape; the concrete tooling assumes the **recommended** stack in DEC-012 (TypeScript monorepo). If a different stack is chosen, the _areas_ stay the same and only the manifests/tooling change.

## Design goals mapped to the spec

- **Curriculum content separate from application logic** (docs 02 §2, 14 §1) → a top-level `content/` tree that holds _only data_, plus a `curriculum` code package that _loads and validates_ it but contains no content.
- **Providers behind interfaces** (docs 08 §9, 14 §1) → `ai-gateway` and `persistence` expose interfaces with swappable adapters.
- **Deterministic grading isolated** (DEC-003) → `validation-engine` and `learning-engine` are standalone, AI-free, heavily-tested packages.
- **Testable services** (doc 08 §1) → domain logic lives in framework-agnostic packages, not in the client.
- **Shared schemas** (doc 14 §2) → one `schemas` package is the single source of truth for content + event shapes and the ID grammar.

## Layout

```
/
├── docs/                          # Source of truth (already populated)
│   ├── spec/                      # The 17 authoritative specification docs (00–16)
│   ├── reviews/                   # Spec review(s)
│   ├── decisions/                 # Decision log (DEC-###)
│   └── planning/                  # Phase task plans
│
├── packages/                      # Application logic — NO curriculum content lives here
│   ├── domain/                    # Framework-agnostic types & enums: skill state machine,
│   │                              #   five mastery dimensions, learning-event types, IDs
│   ├── schemas/                   # Authoritative JSON Schemas (course/unit/skill/lesson/
│   │                              #   question/validator/misconception + package manifest),
│   │                              #   ID grammar, schema_version / content_version rules
│   ├── validation-engine/         # Deterministic validators: numeric, fraction, decimal,
│   │                              #   percentage, unit, structured, error-rule matching
│   ├── learning-engine/           # Skill-state transitions, mastery scoring, difficulty
│   │                              #   selection, review scheduler, remediation routing
│   ├── curriculum/                # Loader + graph builder + dependency/cycle validation
│   │                              #   (CODE ONLY — reads content/, holds none)
│   ├── persistence/               # Store interface + append-only event log + projections;
│   │                              #   IndexedDB adapter (MVP), cloud adapter (later)
│   └── ai-gateway/                # Provider-neutral tutor gateway + context builder +
│                                  #   output validation + fallback (isolated from state)
│
├── content/                       # CURRICULUM CONTENT ONLY (data, versioned separately)
│   ├── math/
│   │   └── units/<unit>/<skill>/  # skill.json, lesson.json, questions.json,
│   │                              #   misconceptions.json, review.json
│   └── science/
│       └── units/<unit>/<skill>/
│
├── content-packages/              # Built, validated, versioned course packages + manifests
│                                  #   (output of the content-validation build)
│
├── apps/
│   ├── client/                    # Web client: screens, navigation, rendering, offline,
│   │                              #   accessibility, local caching (uses packages/*)
│   └── service/                   # OPTIONAL thin app/AI service (later phases; see DEC-010)
│
├── tests/                         # Cross-cutting: e2e (Playwright), accessibility,
│                                  #   content-validation acceptance, offline/resume
│
├── tooling/                       # Content-validation CLI, schema checks, dev scripts
├── config/                        # Externalized config + env samples (no secrets, doc 15 §2)
│
├── .github/                       # CI: install, typecheck, lint, test, content-validate
├── package.json                   # Monorepo root (workspaces) — added in Phase 1, not now
├── tsconfig.base.json
└── README.md
```

## Why content is split two ways

- `content/` = **authoring source** (human/AI-drafted, reviewed, per-skill files).
- `content-packages/` = **release artifacts** (validated, versioned bundles with manifest, `schema_version`, `content_version`, validation result) so content can be released independently of app code (doc 15 §5).

## Package dependency direction (enforced)

```
apps/client ─┬─> curriculum ──> schemas ──> domain
             ├─> learning-engine ─> domain
             ├─> validation-engine ─> domain
             ├─> persistence ─> domain
             └─> ai-gateway ─> domain        (ai-gateway MUST NOT import learning-engine
                                              or persistence write paths — AI isolation)
```

`domain` and `schemas` depend on nothing. The AI gateway depends only on read-only context types, never on state-write paths — enforced by a lint/dependency rule and an acceptance test (doc 11 §2).

## Note

Root manifests, workspace config, and CI are **created in Phase 1 (FND-001)**, not in this Phase 0 pass. This document defines the target shape only.
