# Implementation Backlog

Each task must include objective, dependencies, acceptance criteria, and tests.

## Foundation

### FND-001 Initialize Project

Objective: Create the base application and test environment.

Acceptance:

- Application starts
- Development and production builds succeed
- Automated test command succeeds

### FND-002 Create Navigation Shell

Objective: Implement primary routes and layout.

Acceptance:

- All MVP screens have routes
- Unknown routes show a recovery page
- Keyboard navigation works

### FND-003 Local Learner Profile

Objective: Create and persist a local learner.

Acceptance:

- Profile survives restart
- User can reset local data
- Reset requires confirmation

## Curriculum

### CUR-001 Define Content Schema

Objective: Define machine-validatable schemas for courses, skills, lessons, and questions.

Acceptance:

- Valid examples pass
- Invalid references fail
- Schema version is required

### CUR-002 Skill Graph Loader

Objective: Load skills and prerequisites.

Acceptance:

- Missing references are detected
- Cycles are reported
- Topological ordering works where applicable

### CUR-003 Lesson Renderer

Objective: Render standard lesson components.

Acceptance:

- All required component types display
- Missing optional content does not break rendering
- Accessibility labels exist

## Practice

### PRC-001 Numeric Input

### PRC-002 Fraction Equivalence

### PRC-003 Decimal and Percentage Equivalence

### PRC-004 Unit Validation

### PRC-005 Progressive Hint System

### PRC-006 Attempt Persistence

### PRC-007 Error Classification Rules

Each task must include deterministic tests.

## Learning Engine

### LRN-001 Skill State Machine

### LRN-002 Mastery Score Updates

### LRN-003 Prerequisite Gating

### LRN-004 Remediation Routing

### LRN-005 Adaptive Difficulty

### LRN-006 Review Scheduler

### LRN-007 Mixed Practice Selector

## Diagnostic

### DIA-001 Diagnostic Session

### DIA-002 Adaptive Question Selection

### DIA-003 Boundary Confirmation

### DIA-004 Starting-Point Recommendation

### DIA-005 Diagnostic Results Screen

## Progress and UX

### UX-001 Dashboard

### UX-002 Curriculum Map

### UX-003 Lesson Screen

### UX-004 Practice Screen

### UX-005 Mastery Check

### UX-006 Review Queue

### UX-007 Progress Details

### UX-008 Settings and Accessibility

## AI Tutor

### AI-001 Provider-Neutral Gateway

### AI-002 Context Builder

### AI-003 Explanation Mode

### AI-004 Guided Mode

### AI-005 Output Validation

### AI-006 Offline Fallback

### AI-007 Tutor Evaluation Suite

## Content

Content work should be divided by unit. Each content task must include:

- Skills
- Lessons
- Worked examples
- Practice sets
- Validators
- Hints
- Misconceptions
- Review items
- Content tests

## Release

### REL-001 Offline Verification

### REL-002 Export and Import

### REL-003 Accessibility Audit

### REL-004 Performance Audit

### REL-005 Production Deployment

### REL-006 Release Checklist
