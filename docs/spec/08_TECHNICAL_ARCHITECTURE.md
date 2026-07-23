# Technical Architecture

## 1. Architecture Principles

- Coder-agnostic
- Framework-independent requirements
- Local-first learner progress
- Structured curriculum data
- Deterministic grading
- AI isolated from verified state
- Modular subject support
- Testable services
- Replaceable external providers

## 2. Logical Components

### Client Application

Responsible for:

- Interface
- Navigation
- Lesson rendering
- Answer input
- Local caching
- Offline behavior
- Progress display

### Application Service

Responsible for:

- Learner state
- Session orchestration
- Mastery updates
- Review scheduling
- Diagnostic flow
- Access control
- Synchronization

### Curriculum Service

Responsible for:

- Course packages
- Skill graph
- Lesson retrieval
- Question retrieval
- Content versioning
- Content validation

### Validation Engine

Responsible for:

- Numeric equivalence
- Fraction equivalence
- Percentage equivalence
- Algebraic equivalence where supported
- Unit validation
- Structured response checking
- Error-rule matching

### Learning Engine

Responsible for:

- Prerequisite checks
- Difficulty selection
- Mastery scoring
- Review scheduling
- Skill-state transitions
- Remediation routing

### AI Tutor Gateway

Responsible for:

- Prompt construction
- Context filtering
- Provider abstraction
- Output validation
- Rate and cost controls
- Logging
- Fallback behavior

### Persistence Layer

Responsible for:

- Local database
- Optional cloud database
- Sync queue
- Conflict handling
- Backups
- Export and import

## 3. Local-First Behavior

The client should write learning events locally first.

When cloud synchronization exists:

1. Create local event.
2. Mark event pending.
3. Send to server.
4. Confirm server receipt.
5. Mark synchronized.
6. Resolve conflicts through event IDs and timestamps.

## 4. State Model

Progress should be derived from immutable or append-only learning events where practical.

Examples:

- Question attempted
- Hint requested
- Answer submitted
- Lesson completed
- Mastery check completed
- Review completed
- Skill state changed

## 5. AI Isolation

AI output must not directly write:

- Correct-answer records
- Mastery scores
- Review dates
- Prerequisite relationships
- Curriculum definitions

AI suggestions must pass through controlled application logic.

## 6. Content Packaging

Course content should be versioned.

Each package should include:

- Manifest
- Courses
- Units
- Skills
- Lessons
- Questions
- Validators
- Misconceptions
- Media references
- Schema version
- Content version

## 7. Security

Minimum requirements:

- Keep AI provider credentials server-side
- Validate all content imports
- Sanitize rendered content
- Use least-privilege access
- Encrypt cloud traffic
- Protect account data
- Avoid storing unnecessary personal data
- Provide account and local-data deletion

## 8. Observability

Log:

- Application errors
- Validation failures
- Sync failures
- Content-load failures
- AI gateway failures
- Performance metrics

Do not log private learner text unnecessarily.

## 9. Replaceability

The implementation must allow replacement of:

- Frontend framework
- Database provider
- Authentication provider
- AI provider
- Hosting provider
- Analytics provider

Provider-specific code should remain behind interfaces.
