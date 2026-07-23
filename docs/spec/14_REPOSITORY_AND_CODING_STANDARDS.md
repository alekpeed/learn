# Repository and Coding Standards

## 1. General Rules

- Keep curriculum content separate from application logic.
- Keep provider-specific integrations behind interfaces.
- Avoid large unrelated rewrites.
- Add tests with behavior changes.
- Document assumptions.
- Record major architectural decisions.
- Prefer clear code over clever code.
- Fail explicitly when verified data is missing.

## 2. Recommended Repository Areas

- application client
- application service
- learning engine
- validation engine
- curriculum packages
- shared schemas
- AI gateway
- tests
- documentation
- deployment configuration

Exact folder names may vary by technology.

## 3. Naming

- Use stable descriptive identifiers.
- Do not reuse retired content IDs.
- Use consistent terminology from the specifications.
- Avoid framework-specific names in domain models.

## 4. Testing

Every core module must have tests.

Critical modules require:

- Unit tests
- Integration tests
- Edge-case tests
- Regression tests after bugs

## 5. Error Handling

Errors must:

- Be classified
- Include actionable internal context
- Avoid exposing secrets
- Produce useful user-facing messages
- Preserve learner progress when possible

## 6. Logging

Log system failures and important state transitions.

Do not log:

- Secret credentials
- Unnecessary personal content
- Full tutor conversations by default
- Raw sensitive account data

## 7. Documentation

Update documentation when changing:

- Data schemas
- Learning rules
- APIs
- Deployment
- Content formats
- Acceptance criteria

## 8. Change Discipline

Before merging a change:

- Tests pass
- Formatting and static checks pass
- Acceptance criteria are verified
- Related documentation is updated
- Unrelated behavior is unchanged
