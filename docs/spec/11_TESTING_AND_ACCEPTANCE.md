# Testing and Acceptance Plan

## 1. Test Categories

- Unit tests
- Integration tests
- End-to-end tests
- Content validation tests
- Educational correctness tests
- Accessibility tests
- Offline tests
- Synchronization tests
- Performance tests
- AI tutor evaluations

## 2. Core Acceptance Criteria

### Curriculum

- Every skill has stable identifiers.
- Every prerequisite references an existing skill.
- The dependency graph contains no unintended cycles.
- Every MVP skill has lesson and practice content.
- Every question has a validator.

### Answer Validation

- Equivalent fractions are accepted.
- Equivalent decimals and percentages are accepted when permitted.
- Units are checked when required.
- Rounding rules are applied consistently.
- Invalid formats produce useful feedback.
- Incorrect answers are not accepted because of AI interpretation.

### Learning Engine

- Locked skills remain unavailable until prerequisites qualify.
- Prerequisite failures trigger remediation.
- Hint use affects independence evidence.
- One correct answer cannot create mastery.
- Delayed review affects retention.
- Review failure shortens the next interval.

### Persistence

- Closing and reopening preserves progress.
- Duplicate events do not duplicate credit.
- Interrupted sessions resume safely.
- Exported progress can be imported.
- Offline events synchronize once when connection returns.

### AI Tutor

- AI failure does not block standard learning.
- AI cannot update official answer data.
- AI cannot directly set mastery.
- AI responses use only approved context.
- Unsafe or malformed model output is rejected or replaced.

## 3. Educational Test Cases

- Learner fails fraction addition because common denominators are weak.
- Learner solves correctly only after multiple hints.
- Learner performs well immediately but fails after seven days.
- Learner can calculate but cannot explain meaning.
- Learner applies a method to a similar-looking but incorrect problem.
- Learner repeatedly makes sign errors.
- Learner misreads graph scale.
- Learner confuses observation with inference.

## 4. Accessibility Acceptance

- All primary flows work by keyboard.
- Screen readers identify controls.
- Focus order is logical.
- Status is not communicated by color alone.
- Text remains usable at enlarged sizes.
- Reduced motion disables nonessential animation.

## 5. Definition of Done

A feature is done only when:

- Requirements are implemented
- Acceptance criteria pass
- Automated tests exist where practical
- Accessibility behavior is verified
- Error states are handled
- Documentation is updated
- No unrelated functionality regresses
