# Learning System Specification

## 1. Knowledge Model

The curriculum is a directed dependency graph.

Each node is a skill. Each edge means that one skill is a prerequisite for another.

A learner may have different mastery states across branches. The system must not assume that course position alone represents knowledge.

## 2. Skill State

Each skill has the following learner-specific values:

- `unknown`
- `diagnosed_weak`
- `learning`
- `practicing`
- `provisionally_mastered`
- `mastered`
- `review_due`
- `decayed`

## 3. Skill Scores

Each skill tracks five scores from 0 to 100:

- Understanding
- Accuracy
- Independence
- Retention
- Transfer

Suggested initial mastery thresholds:

- Understanding: 80
- Accuracy: 85
- Independence: 80
- Retention: 75
- Transfer: 70

Thresholds may vary by skill but must be explicit.

## 4. Learning Cycle

Each skill follows:

1. Prerequisite check
2. Intuitive introduction
3. Concrete or visual representation
4. Formal explanation
5. Worked examples
6. Guided practice
7. Independent practice
8. Mixed practice
9. Mastery check
10. Spaced review

## 5. Prerequisite Repair

When a learner fails because of a prerequisite:

1. Identify the likely missing prerequisite.
2. Confirm it with one or more targeted items.
3. Pause the current skill.
4. Route the learner to the prerequisite.
5. Return to the paused skill after repair.

The app must preserve context so the learner understands why the detour occurred.

## 6. Adaptive Difficulty

Each question has a difficulty level, initially on a 1 to 5 scale.

Difficulty should increase when:

- Accuracy is consistently high
- Hints are not used
- Response time is reasonable
- Transfer questions are successful

Difficulty should decrease when:

- Multiple errors occur
- The learner repeatedly requests hints
- A prerequisite error pattern appears
- Response time is unusually long
- Confidence is low and accuracy is poor

Difficulty changes must not skip required conceptual forms.

## 7. Hint Ladder

Hints are progressive:

1. Restate the goal
2. Ask a guiding question
3. Remind the learner of a relevant rule
4. Show the first step
5. Show an intermediate step
6. Show the complete solution

Hint use reduces independence evidence but does not count as simple failure.

## 8. Error Diagnosis

Error diagnosis uses:

- Submitted answer
- Expected answer
- Intermediate steps when available
- Common misconception rules
- Recent learner history
- Prerequisite performance
- Response time
- Hint behavior

Where deterministic diagnosis is possible, use it before AI interpretation.

## 9. Mastery Update

Mastery scores should update after validated learning events.

A correct answer should contribute differently depending on:

- Difficulty
- Hint usage
- Number of attempts
- Time since last exposure
- Whether the problem is routine or transfer-based
- Whether the learner explained reasoning

A single correct answer must never produce full mastery.

## 10. Review Scheduling

A newly learned skill begins with short intervals.

Suggested schedule:

- Same day
- 1 day
- 3 days
- 7 days
- 14 days
- 30 days
- 90 days

Review success increases the interval. Review failure lowers retention and shortens the interval.

## 11. Mixed Practice

Mixed practice must require the learner to identify the method.

It should combine:

- Current skill
- Recent prerequisites
- Similar-looking but different operations
- Previously mastered skills
- Word problems
- Transfer questions

## 12. Diagnostic Logic

The diagnostic uses adaptive sampling rather than testing every skill.

It should:

- Begin near the middle of the initial course
- Move upward after strong performance
- Move downward after weak performance
- Confirm boundary skills
- Inspect prerequisite chains
- Mark untested skills as unknown rather than weak
- Recommend the lowest unstable prerequisite as the starting point

## 13. Session Composition

Default session:

1. Due review
2. Current lesson
3. Guided practice
4. Independent practice
5. Mixed challenge
6. Session summary

Available durations:

- 5 minutes
- 15 minutes
- 30 minutes
- 60 minutes
- Custom

## 14. Advancement

A skill may unlock when:

- Required prerequisites meet minimum thresholds
- The learner has completed required lesson components
- The learner has sufficient independent evidence

A skill may be provisionally mastered before delayed retention is confirmed. Full mastery requires later review evidence.
