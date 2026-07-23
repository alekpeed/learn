# Mastery Scoring Algorithm (Deterministic)

Status: Draft for approval (Phase 0 / DEC-014). Derived from `docs/spec/04_LEARNING_SYSTEM_SPEC.md` §§3, 9, 14 and `docs/spec/02_PRODUCT_REQUIREMENTS.md` §6.
Implemented in: `packages/learning-engine` (Phase 4). This document is the authoritative, testable specification the implementation and its tests must match.

## 1. Goal

Turn each **validated learning event** into a deterministic, reproducible update of a skill's five mastery scores. No AI input. The function must be pure: `(currentScores, event) → newScores`, so progress is reproducible by replaying the event log (DEC-006).

## 2. The five dimensions

Each is an integer-valued score in `[0, 100]` (stored as a real, surfaced as rounded):

| Dimension     | What it measures           | Fed by (DEC-009 question-type mapping)                  |
| ------------- | -------------------------- | ------------------------------------------------------- |
| Understanding | Knows _why_ a method works | `structured_reasoning`, `self_explanation_select` items |
| Accuracy      | Gets correct results       | any graded item, independent of hints                   |
| Independence  | Solves without help        | inverse of hint usage on any item                       |
| Retention     | Recalls after delay        | delayed `review` items only (§6)                        |
| Transfer      | Applies to novel contexts  | items with `transfer_flag = true`                       |

Default mastery thresholds (doc 04 §3), overridable per skill: Understanding 80, Accuracy 85, Independence 80, Retention 75, Transfer 70.

## 3. Per-event quality `q ∈ [0,1]`

For a graded attempt event with fields `correct ∈ {0,1}`, `hints_used h ∈ [0,6]`, `attempts a ≥ 1`:

```
hint_factor    = max(0, 1 − 0.15 · h)          # 0 hints → 1.0 ; 6 hints → 0.10
attempt_factor = max(0, 1 − 0.25 · (a − 1))    # 1st try → 1.0 ; 5th try → 0.0
q              = correct · hint_factor · attempt_factor
```

`q = 0` for any incorrect final attempt. `q = 1` only for a first-try, hint-free correct answer.

## 4. Difficulty ceiling (why one answer can't create mastery)

Each event can only push a score toward a **ceiling set by the item's difficulty** `d ∈ [1,5]`:

```
ceiling(d) = 40 + 12 · d        # d1→52, d2→64, d3→76, d4→88, d5→100
target     = ceiling(d) · q     # the value this single event argues the score should be
```

A learner who only ever answers easy (d1–d2) items is capped well below the 80–85 thresholds, so **mastery provably requires success on higher-difficulty and transfer items** — satisfying doc 04 §9 and the acceptance criterion "one correct answer cannot create mastery" (doc 11).

## 5. Update rule (per relevant dimension `D`)

Exponential moving average with learning rate `α = 0.25`:

```
on correct evidence (q > 0):   D ← D + α · (target − D)          # only if target > D, else no upward move
on incorrect (q = 0):          D ← D − α · penalty(d)            # floored at 0
penalty(d) = 30 − 4 · d        # failing an EASY item hurts more (d1→26, d5→10)
```

Only dimensions the item is tagged for are updated (§2). Accuracy and Independence update on every graded item; Accuracy uses `correct` directly for its target (`ceiling(d)·correct`), Independence uses `ceiling(d)·hint_factor·correct`.

### Worked example — single first-try correct d3 item

Start `Accuracy = 0`. `q = 1`, `target = 76·1 = 76`. `Accuracy ← 0 + 0.25·(76−0) = 19`. One perfect answer yields **19**, far below 85. Reaching ~85 needs repeated success across ≥ ~8 events including d4–d5 items. ∎ (This is the machine-checkable proof of doc 04 §9.)

### Worked example — hinted, third attempt, d2

`h=2, a=3, correct=1`: `hint_factor=0.70`, `attempt_factor=0.50`, `q=0.35`, `target=64·0.35=22.4`. Small upward nudge; Independence barely moves because `hint_factor` also gates its target.

## 6. Retention (delayed review only)

Retention updates **only** on `review` events with a real elapsed interval (≥ 1 day). Successful recall after a longer interval is stronger evidence:

```
interval_bonus = min(1.3, 1 + 0.05 · interval_days_at_review)
on delayed success:  Retention ← Retention + α · (ceiling(d) · q · interval_bonus − Retention)   # capped at 100
on delayed failure:  Retention ← Retention − α · (25 + 0.3 · overdue_days)                        # floored at 0
```

## 7. Skill-state coupling (doc 04 §§2, 14)

The scores drive the state machine (implemented alongside, spec here for reference):

- All five scores ≥ thresholds **and** no confirmed delayed review yet → `provisionally_mastered`.
- `provisionally_mastered` **and** ≥ 1 successful delayed review at interval ≥ 7 days with Retention ≥ threshold → `mastered`.
- Retention decays with time since last practice; when Retention < threshold and past due → `decayed` / `review_due`.
- Any review failure can demote `mastered`/`provisionally_mastered` back to `practicing` and shortens the interval (§ REVIEW_SCHEDULING).

## 8. Determinism & reproducibility requirements

- Pure function of `(currentScores, event)`; identical event replay yields identical scores (DEC-006).
- No wall-clock reads inside the update — elapsed time arrives as event fields (`interval_days_at_review`, `overdue_days`).
- All constants (`α`, ceilings, penalties, bonuses) live in one named config object so thresholds can be tuned and tested.

## 9. Properties tests MUST assert (feeds doc 11 acceptance)

1. A single correct answer never yields any score ≥ its threshold.
2. Only-easy-item practice cannot reach Accuracy/Understanding thresholds.
3. Hint usage strictly lowers the Independence contribution vs. the same item hint-free.
4. A delayed review failure lowers Retention and (via scheduler) shortens the next interval.
5. Replaying the same event sequence twice yields identical final scores (idempotent, order-preserving).
6. Scores are clamped to `[0,100]` under all inputs.
