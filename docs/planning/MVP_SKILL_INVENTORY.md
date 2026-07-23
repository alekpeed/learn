# MVP Skill Inventory — Fully-Connected Vertical Slice

Status: Proposed for final review at the Phase 0 gate (discharges DEC-011 / contradiction C-1)
ID grammar: `subject.unit.skill`, lower_snake_case (DEC-007)

## Purpose

A single **fully-connected** learning path that satisfies the completion rule (doc 03): the learner can traverse prerequisites → lessons → practice → mastery checks → review end-to-end, from number sense through one-step equations, plus a connected scientific-reasoning + measurement thread. Remaining units from `docs/spec/05_CURRICULUM_ARCHITECTURE.md` are authored unit-by-unit **after** MVP, without schema or engine changes.

Scope: **~40 skills across 7 units** (5 math, 2 science). Every prerequisite edge below references a skill in this list — the slice has no dangling prerequisites (satisfies doc 11 curriculum acceptance).

---

## Mathematics thread

### Unit `math.number_foundations` — Number Foundations
| Skill ID | Title | Prerequisites |
|---|---|---|
| `math.number_foundations.counting_and_quantity` | Counting and quantity | — |
| `math.number_foundations.comparing_numbers` | Comparing numbers | counting_and_quantity |
| `math.number_foundations.place_value` | Place value | comparing_numbers |
| `math.number_foundations.number_line` | The number line | comparing_numbers |
| `math.number_foundations.rounding` | Rounding | place_value, number_line |
| `math.number_foundations.estimation` | Estimation | rounding |

### Unit `math.add_sub` — Addition and Subtraction
| Skill ID | Title | Prerequisites |
|---|---|---|
| `math.add_sub.addition_meaning` | Meaning of addition | number_foundations.counting_and_quantity, number_foundations.number_line |
| `math.add_sub.addition_facts` | Addition facts | addition_meaning |
| `math.add_sub.multi_digit_addition` | Multi-digit addition | addition_facts, number_foundations.place_value |
| `math.add_sub.subtraction_meaning` | Meaning of subtraction | addition_meaning |
| `math.add_sub.subtraction_facts` | Subtraction facts | subtraction_meaning, addition_facts |
| `math.add_sub.multi_digit_subtraction` | Multi-digit subtraction | subtraction_facts, number_foundations.place_value |
| `math.add_sub.inverse_relationship` | Addition–subtraction inverse | addition_facts, subtraction_facts |

### Unit `math.mult_div` — Multiplication and Division
| Skill ID | Title | Prerequisites |
|---|---|---|
| `math.mult_div.repeated_addition` | Multiplication as repeated addition | add_sub.addition_facts |
| `math.mult_div.multiplication_facts` | Multiplication facts | repeated_addition |
| `math.mult_div.multi_digit_multiplication` | Multi-digit multiplication | multiplication_facts, add_sub.multi_digit_addition |
| `math.mult_div.division_meaning` | Meaning of division | multiplication_facts |
| `math.mult_div.division_facts` | Division facts | division_meaning |
| `math.mult_div.mult_div_relationship` | Multiplication–division relationship | multiplication_facts, division_facts |

### Unit `math.fractions` — Fractions
| Skill ID | Title | Prerequisites |
|---|---|---|
| `math.fractions.fraction_meaning` | Meaning of a fraction | mult_div.division_meaning, number_foundations.number_line |
| `math.fractions.equivalent_fractions` | Equivalent fractions | fraction_meaning, mult_div.multiplication_facts |
| `math.fractions.simplifying_fractions` | Simplifying fractions | equivalent_fractions, mult_div.division_facts |
| `math.fractions.add_like_denominators` | Add fractions (like denominators) | fraction_meaning, add_sub.addition_facts |
| `math.fractions.subtract_like_denominators` | Subtract fractions (like denominators) | add_like_denominators, add_sub.subtraction_facts |
| `math.fractions.common_denominators` | Common denominators | equivalent_fractions |
| `math.fractions.add_unlike_denominators` | Add fractions (unlike denominators) | add_like_denominators, common_denominators |

### Unit `math.algebra` — Algebra Foundations
| Skill ID | Title | Prerequisites |
|---|---|---|
| `math.algebra.variables` | Variables | mult_div.mult_div_relationship |
| `math.algebra.expressions` | Expressions | variables |
| `math.algebra.evaluating_expressions` | Evaluating expressions | expressions, add_sub.inverse_relationship |
| `math.algebra.equality` | Equality and balance | evaluating_expressions |
| `math.algebra.one_step_equations` | One-step equations | equality, add_sub.inverse_relationship, mult_div.mult_div_relationship |

`math.algebra.one_step_equations` is the **capstone** of the math thread (aligns with doc 05 §5's example, minus the integer-unit prerequisites which are deferred post-MVP; integers are noted as a follow-on unit).

---

## Scientific reasoning thread

### Unit `science.thinking` — Scientific Thinking
| Skill ID | Title | Prerequisites |
|---|---|---|
| `science.thinking.observation` | Observation | — |
| `science.thinking.inference` | Inference | observation |
| `science.thinking.testable_questions` | Testable questions | inference |
| `science.thinking.hypotheses` | Hypotheses | testable_questions |
| `science.thinking.evidence` | Evidence and conclusions | hypotheses |

### Unit `science.measurement` — Measurement
| Skill ID | Title | Prerequisites |
|---|---|---|
| `science.measurement.si_units` | SI units | thinking.observation |
| `science.measurement.length` | Measuring length | si_units, math.number_foundations.number_line |
| `science.measurement.unit_conversion` | Unit conversion | length, math.mult_div.multiplication_facts |
| `science.measurement.estimation` | Estimation and reasonableness | unit_conversion, math.number_foundations.estimation |
| `science.measurement.accuracy_precision` | Accuracy vs. precision | si_units, thinking.evidence |

---

## Cross-thread edges

The science thread depends on the math thread at three points (`number_line`, `estimation`, `multiplication_facts`), so the diagnostic and prerequisite-repair logic exercise **cross-subject** routing within the MVP — a meaningful test of the graph model, not two isolated lines.

## Verification checklist (run by the content-validation CLI, P0-4)

- [ ] Every prerequisite ID resolves to a skill in this inventory.
- [ ] The graph is a DAG (no cycles) — doc 11 curriculum acceptance.
- [ ] Every skill is reachable from at least one root (`counting_and_quantity`, `observation`).
- [ ] Every skill has an entry in the content schema before Phase 6/7 authoring begins.

## Deferred to post-MVP (author unit-by-unit)

Numerical structure, integers, decimals, percentages, ratios/proportions, measurement foundations (math unit 10), coordinate plane/graphs, and the full science Experiments + Data units. None require engine or schema changes — only new content packages.
