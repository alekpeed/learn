# Product Requirements Document

## 1. Core User Capabilities

The learner must be able to:

- Create or use a local learner profile
- Choose a subject or learning path
- Start from the beginning or take a diagnostic
- Receive a recommended starting point
- Complete structured lessons
- Work through guided examples
- Complete independent practice
- Request progressive hints
- Receive specific error explanations
- Take mastery checks
- Review due material
- View skill-level progress
- Resume an interrupted session
- Ask an AI tutor for alternate explanations
- Continue ordinary learning without AI availability

## 2. Curriculum Requirements

The curriculum must be stored as structured content separate from application code.

Each skill must define:

- Unique skill ID
- Title
- Subject and unit
- Description
- Learning objectives
- Prerequisites
- Successor skills
- Lesson content
- Worked examples
- Practice items
- Common misconceptions
- Mastery requirements
- Review behavior

The system must prevent advancement when critical prerequisites are not sufficiently stable.

## 3. Diagnostic Requirements

The diagnostic must:

- Be optional
- Adapt difficulty based on responses
- Sample prerequisite chains
- Avoid requiring a full-course exam
- Identify strong, weak, and unknown skills
- Locate the lowest unstable prerequisite
- Produce a recommended starting point
- Allow the learner to override the recommendation

## 4. Lesson Requirements

Each lesson must include:

- Learning objective
- Prerequisite reminder
- Intuitive explanation
- Concrete or visual representation
- Formal terminology and notation
- Worked examples
- Guided practice
- Independent practice
- Mixed or transfer question
- Summary
- Next-step recommendation

Lessons must display one primary task at a time.

## 5. Practice Requirements

Practice must support:

- Adaptive difficulty
- Progressive hints
- Immediate answer validation
- Specific error feedback
- Multiple attempts
- Equivalent mathematical answers
- Question variation
- Mixed-skill practice
- Confidence input when enabled

## 6. Mastery Requirements

The system must track:

- Understanding
- Accuracy
- Independence
- Retention
- Transfer

A skill must not be marked mastered based only on one successful session.

Mastery must consider:

- Correctness
- Hint usage
- Attempts
- Difficulty
- Time since learning
- Performance during delayed review
- Performance on unfamiliar applications

## 7. Review Requirements

The app must maintain a review queue.

Default review intervals:

- Same day
- 1 day
- 3 days
- 7 days
- 14 days
- 30 days
- 90 days

Intervals must shorten after failure and lengthen after successful delayed recall.

Review sessions must combine:

- Due skills
- Weak skills
- Recently learned skills
- Previously mastered skills
- Mixed-method questions

## 8. Error Diagnosis Requirements

The system should classify errors into categories such as:

- Arithmetic error
- Sign error
- Place-value error
- Incorrect operation
- Misread problem
- Incorrect rule
- Conceptual misunderstanding
- Missing prerequisite
- Equivalent-form issue
- Unit error
- Graph-reading error
- Guessing pattern
- Correct method with execution mistake

The learner must receive the smallest useful correction rather than the full answer immediately.

## 9. AI Tutor Requirements

The AI tutor may:

- Rephrase explanations
- Give alternate examples
- Ask guiding questions
- Explain errors using verified problem data
- Connect current material to prerequisites
- Generate non-authoritative practice variations
- Answer follow-up questions

The AI tutor may not:

- Change official answers
- Alter prerequisite rules
- Directly set mastery scores
- Replace deterministic validators
- Invent curriculum records
- Modify progress without validated events

## 10. Progress Requirements

The learner must be able to see:

- Current skill
- Current unit
- Skills mastered
- Skills in progress
- Weak prerequisites
- Review-due skills
- Recent improvement
- Study history
- Recommended next action

Progress must be shown at the skill level, not only as one course percentage.

## 11. Offline Requirements

Without an internet connection, the learner must still be able to:

- Open downloaded or bundled lessons
- Complete deterministic practice
- Receive standard hints
- Save progress locally
- Complete reviews
- View the curriculum map

AI tutoring may be unavailable offline.

## 12. Accessibility Requirements

The app must support:

- Keyboard navigation
- Screen-reader labels
- Adjustable text size
- High contrast
- Reduced motion
- Color-independent status indicators
- Captions or text alternatives for media
- Clear focus states
- Plain-language content

## 13. Reliability Requirements

The system must:

- Save attempts without duplication
- Recover safely after interruption
- Preserve local progress
- Avoid losing review schedules
- Prevent AI output from changing verified state
- Log recoverable failures
- Validate imported course content
