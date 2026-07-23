# Review Scheduling Algorithm (Deterministic)

Status: Draft for approval (Phase 0 / DEC-014). Derived from `docs/spec/04_LEARNING_SYSTEM_SPEC.md` §10 and `docs/spec/02_PRODUCT_REQUIREMENTS.md` §7.
Implemented in: `packages/learning-engine` (Phase 4). Authoritative, testable spec.

## 1. Goal

Given a completed review, deterministically compute the next review time. Intervals **lengthen after successful delayed recall** and **shorten after failure** (doc 04 §10). Pure function of `(reviewState, outcome, elapsed) → newReviewState`; no wall-clock reads inside (times arrive as inputs) so it is replayable (DEC-006).

## 2. Interval ladder

Fixed ordered ladder (doc 02 §7 / doc 04 §10), indexed `0…6`:

```
LADDER = [0d (same day), 1d, 3d, 7d, 14d, 30d, 90d]
```

Per-skill review state:

```
{ ladder_index: int in [0,6], next_review_at: timestamp, last_interval_days: int }
```

A newly learned skill starts at `ladder_index = 0` (same-day) per doc 04 §10 ("begins with short intervals").

## 3. Outcome classification

A review item's quality `q` comes from the mastery-scoring spec §3. The review outcome:

```
success = q ≥ 0.60
```

(The 0.60 gate is a named constant; a hinted/multi-attempt correct answer can still fall below it and count as a miss for scheduling.)

## 4. Update rule

```
PROMOTE_STEP = 1
DEMOTE_STEP  = 2

on success:
    new_index = min(6, ladder_index + PROMOTE_STEP)
on failure:
    new_index = max(0, ladder_index − DEMOTE_STEP)      # shortens more than one rung

next_review_at   = review_time + LADDER[new_index]
last_interval_days = LADDER[new_index]
```

Failure therefore always yields an interval **≤** the current one, and a two-rung drop shortens aggressively (e.g. 30d → 7d), satisfying "review failure ... shortens the interval."

## 5. Overdue handling

`overdue_days = max(0, review_time − scheduled_next_review_at)` (in days) is passed to the retention update (mastery spec §6):

- Overdue **success** → larger `interval_bonus` (stronger retention evidence).
- Overdue **failure** → larger retention penalty (`+0.3 · overdue_days`).

Scheduling index math is unchanged by overdue-ness; only the retention magnitude differs.

## 6. State coupling (doc 04 §§2, 14)

- Success at `ladder_index ≥ 3` (≥ 7 days) with Retention ≥ threshold confirms delayed retention → allows `provisionally_mastered → mastered`.
- Failure demotes the skill state toward `practicing` and may flag `decayed` if Retention falls below threshold.
- `review_due` is set whenever `now ≥ next_review_at`.

## 7. Review-session composition (doc 04 §13, doc 02 §7)

The scheduler exposes a **due queue**; session assembly (a separate selector, Phase 4) combines: due skills, weak skills, recently-learned skills, previously-mastered skills, and mixed-method items. This document covers only the per-skill interval math.

## 8. Worked examples

| Before (index/interval) | Outcome | After index | Next interval |
| ----------------------- | ------- | ----------- | ------------- |
| 0 / same-day            | success | 1           | 1 day         |
| 3 / 7 days              | success | 4           | 14 days       |
| 5 / 30 days             | failure | 3           | 7 days        |
| 1 / 1 day               | failure | 0           | same day      |
| 6 / 90 days             | success | 6 (capped)  | 90 days       |

## 9. Properties tests MUST assert (feeds doc 11 acceptance)

1. Success never decreases the interval; failure never increases it.
2. A failure shortens the next interval by at least one ladder rung (two when not already near the floor).
3. `ladder_index` stays within `[0,6]` under any sequence.
4. Replaying an identical `(outcome, elapsed)` sequence yields identical `next_review_at` (given the same `review_time` inputs).
5. A newly learned skill's first scheduled review uses a short interval (index 0 or 1).
6. Overdue success increases retention more than on-time success for the same item (cross-checked with mastery spec).
