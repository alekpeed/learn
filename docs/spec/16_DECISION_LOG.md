# Decision Log

Record major decisions using the following format.

## Decision Template

### DEC-000: Decision Title

Date:

Status: Proposed, Accepted, Rejected, or Superseded

Context:

Decision:

Reasons:

Alternatives considered:

Consequences:

Related documents:

---

## Initial Decisions

### DEC-001: Initial Curriculum Scope

Status: Accepted

Decision:

The first build covers mathematics from basic arithmetic through introductory algebra, plus scientific reasoning and measurement.

Reason:

This is broad enough to prove the system while remaining bounded.

### DEC-002: Curriculum as Dependency Graph

Status: Accepted

Decision:

Skills are represented as a directed prerequisite graph rather than only a linear course list.

Reason:

Learners may have uneven knowledge and require targeted prerequisite repair.

### DEC-003: Deterministic Grading First

Status: Accepted

Decision:

Official grading and progress updates use deterministic validation wherever possible.

Reason:

AI output is not sufficiently reliable to control verified mastery.

### DEC-004: Local-First Progress

Status: Accepted

Decision:

The MVP stores learner progress locally first. Cloud synchronization is added later.

Reason:

This reduces infrastructure requirements and supports offline use.

### DEC-005: AI as Tutor, Not Authority

Status: Accepted

Decision:

AI may explain and guide but may not alter official answers, curriculum structure, or mastery state.

Reason:

The product requires verifiable educational behavior.
