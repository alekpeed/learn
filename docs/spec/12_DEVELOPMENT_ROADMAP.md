# Development Roadmap

## Phase 0: Project Definition

Deliverables:

- Approved documentation package
- Confirmed MVP scope
- Initial decision log
- Repository structure
- Content schema draft

## Phase 1: Application Foundation

Build:

- Application shell
- Navigation
- Local learner profile
- Settings
- Local persistence
- Basic error handling
- Test framework

Exit criteria:

- App opens reliably
- Profile and settings persist
- Navigation works
- Automated tests run

## Phase 2: Curriculum Platform

Build:

- Course package schema
- Skill graph loader
- Dependency validation
- Lesson renderer
- Content versioning
- Sample course package

Exit criteria:

- Valid course loads
- Invalid course produces clear errors
- Skill relationships display correctly

## Phase 3: Practice and Validation

Build:

- Question renderer
- Numeric validator
- Fraction validator
- Decimal and percentage validator
- Unit validator
- Attempt tracking
- Hint events
- Feedback display

Exit criteria:

- Core question types work
- Equivalent answers are accepted
- Attempts persist

## Phase 4: Learning Engine

Build:

- Skill states
- Mastery scores
- Difficulty selection
- Prerequisite remediation
- Advancement logic
- Review scheduling

Exit criteria:

- Learner can progress through a small dependency chain
- Review dates update correctly
- Mastery cannot be gained through one answer

## Phase 5: Diagnostic

Build:

- Adaptive diagnostic flow
- Boundary detection
- Starting-point recommendation
- Diagnostic results screen
- Override option

Exit criteria:

- Diagnostic identifies plausible starting points
- Untested skills remain unknown

## Phase 6: MVP Mathematics Content

Create and validate all scoped mathematics units.

Exit criteria:

- Full path from number foundations through introductory functions
- No missing prerequisite references
- All questions validated

## Phase 7: Scientific Reasoning Content

Create and validate all scoped science-foundation units.

Exit criteria:

- Complete scientific reasoning and measurement course
- Graph and unit questions function correctly

## Phase 8: AI Tutor

Build:

- Tutor gateway
- Provider interface
- Context assembly
- Guided and explanation modes
- Fallback behavior
- Evaluation suite

Exit criteria:

- Tutor cannot alter verified state
- App remains functional without tutor

## Phase 9: Quality and Release

Complete:

- End-to-end tests
- Accessibility audit
- Offline testing
- Performance testing
- Data export
- Recovery testing
- Deployment setup

Exit criteria:

- All MVP acceptance criteria pass
- Documentation matches the implementation
