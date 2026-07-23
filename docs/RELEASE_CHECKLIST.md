# MVP Release Checklist

Status: Phase 9. Maps every acceptance criterion in `docs/spec/11_TESTING_AND_ACCEPTANCE.md`
to the automated test that verifies it. All referenced suites pass in CI
(`pnpm test`, `pnpm validate:content`, `pnpm test:e2e`).

Run everything: `pnpm lint && pnpm typecheck && pnpm test && pnpm validate:content && pnpm build && pnpm test:e2e`.

## Curriculum (doc 11 §2)

| Criterion                                       | Where verified                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Every skill has stable identifiers              | ID grammar enforced by schema — `packages/schemas` ID grammar test; content loads with canonical IDs                   |
| Every prerequisite references an existing skill | `curriculum/tests/loader.test.ts` → "no missing prerequisite references"                                               |
| Dependency graph contains no unintended cycles  | `curriculum/tests/graph.test.ts` cycle detection; MVP package loads (acyclic)                                          |
| Every MVP skill has lesson and practice content | `curriculum/tests/loader.test.ts` → "every skill has lesson and practice content"                                      |
| Every question has a validator                  | `curriculum/tests/loader.test.ts` → "every question has a validator"; every answer graded in `content-answers.test.ts` |

## Answer validation (doc 11 §2)

| Criterion                                               | Where verified                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Equivalent fractions accepted                           | `validation-engine/tests/validators.test.ts` (fraction equivalence)              |
| Equivalent decimals/percentages accepted when permitted | validators.test (percentage, decimal rounding)                                   |
| Units checked when required                             | validators.test (unit family + mismatch); e2e `learning.spec.ts` unit conversion |
| Rounding rules applied consistently                     | validators.test (decimal with rounding)                                          |
| Invalid formats produce useful feedback                 | `validation-engine/tests/diagnose.test.ts` (invalid_format)                      |
| Incorrect answers not accepted via AI                   | deterministic validators only; `ai-gateway/tests/gateway.test.ts` isolation      |

## Learning engine (doc 11 §2)

| Criterion                                             | Where verified                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| Locked skills unavailable until prerequisites qualify | `learning-engine/tests/gating.test.ts`; client `curriculum.test.tsx` unlock |
| Prerequisite failures trigger remediation             | gating.test → `findRemediationTarget`                                       |
| Hint use affects independence evidence                | `learning-engine/tests/scoring.test.ts` (hints reduce independence)         |
| One correct answer cannot create mastery              | scoring.test + `progress.test.ts` ("one answer does not create mastery")    |
| Delayed review affects retention                      | scoring.test (retention) + progress.test (delayed review)                   |
| Review failure shortens the next interval             | `learning-engine/tests/scheduler.test.ts` + progress.test                   |

## Persistence (doc 11 §2)

| Criterion                                | Where verified                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Closing and reopening preserves progress | `persistence/tests/indexeddb-store.test.ts` (restart); e2e `smoke.spec.ts` reload |
| Duplicate events do not duplicate credit | `persistence/tests/event-store.test.ts`; `practice-repository.test.ts`            |
| Interrupted sessions resume safely       | projection reproducibility (progress.test); e2e reload                            |
| Exported progress can be imported        | client `data-settings.test.tsx`; `event-store.test.ts` export/import              |
| Offline events synchronize once          | idempotent import (`data-settings.test.ts`, event-store.test)                     |

## AI tutor (doc 11 §2)

| Criterion                                       | Where verified                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| AI failure does not block standard learning     | `ai-gateway/tests/gateway.test.ts` fallback; e2e `tutor.spec.ts` (off by default) |
| AI cannot update official answer data           | gateway.test isolation (dependency + inert-result)                                |
| AI cannot directly set mastery                  | gateway.test isolation (package depends on `@learn/domain` only)                  |
| AI responses use only approved context          | gateway.test (context redaction, grounded responses)                              |
| Unsafe or malformed output rejected or replaced | `ai-gateway/tests/gateway.test.ts` (output validation → fallback)                 |

## Accessibility (doc 11 §4)

| Criterion                                      | Where verified                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| All primary flows work by keyboard             | e2e `smoke.spec.ts` (skip link, nav); keyboard-operable controls                    |
| Screen readers identify controls               | e2e `accessibility.spec.ts` axe audit (all core screens)                            |
| Focus order is logical                         | accessibility.spec axe audit                                                        |
| Status not communicated by color alone         | curriculum map icon+text; `ScreenState` role/text; offline banner                   |
| Text remains usable at enlarged sizes          | client `profile-settings.test.tsx` (text-size applies + persists)                   |
| Reduced motion disables nonessential animation | `styles.css` + `applyAccessibility`; reduced-motion honored via setting and OS pref |

## Educational test cases (doc 11 §3)

| Case                                               | Where verified                                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| Fails fraction addition (weak common denominators) | prerequisite gating + remediation (gating.test)                                  |
| Solves only after multiple hints                   | usePractice hint ladder; scoring hint penalty (scoring.test)                     |
| Performs immediately but fails after 7 days        | retention via delayed review (progress.test, scoring.test)                       |
| Can calculate but cannot explain                   | Understanding dimension fed only by conceptual items (scoring.test / DEC-009)    |
| Applies a method to a look-alike wrong problem     | transfer items + diagnosis (diagnose.test)                                       |
| Repeated sign errors                               | diagnose.test (sign_error)                                                       |
| Misreads graph scale                               | graph-reading deferred with the Data unit (DEC-011) — noted, not in MVP slice    |
| Confuses observation with inference                | `content/mvp/units/science_thinking.json` conceptual items; content-answers.test |

## Definition of done (doc 11 §5)

- [x] Requirements implemented for MVP scope (Phases 1–8).
- [x] Acceptance criteria pass (this checklist; CI green).
- [x] Automated tests exist where practical (125 unit + 17 content-validation + 18 e2e).
- [x] Accessibility behavior verified (axe audit across screens).
- [x] Error states handled (error boundary, seven screen states, classified errors).
- [x] Documentation updated (README, decision log, spec-derived specs, this checklist).
- [x] No unrelated regressions (full suite green each phase).

## Known MVP limitations (tracked, out of scope per DEC-011 / scope plan)

- Graph-reading (science Data unit) deferred with the MVP slice.
- Diagnostic stop/resume is in-session only (not persisted).
- AI tutor uses a local stub provider (DEC-010); a real provider drops into the same interface.
- Cloud sync / accounts are Version 1, not MVP (DEC-004).
