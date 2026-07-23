# Deployment and Operations Guide

## 1. Environments

Maintain separate:

- Development
- Testing or staging
- Production

## 2. Configuration

Configuration must be externalized.

Examples:

- Database connection
- Authentication provider
- AI provider
- AI model
- Feature flags
- Logging level
- Content package source

Secrets must not be committed to the repository.

## 3. Build

The project must provide documented commands or procedures for:

- Install
- Development run
- Test
- Content validation
- Production build
- Database migration
- Deployment

## 4. Database Changes

Database migrations must:

- Be versioned
- Be reversible where practical
- Preserve learner data
- Be tested against representative data

## 5. Content Releases

Course content should be releasable independently from application code when possible.

A content release must include:

- Content version
- Schema version
- Validation result
- Change summary
- Compatibility requirements

## 6. Backups

Cloud deployments must define:

- Backup frequency
- Retention period
- Restore procedure
- Restore testing schedule

Local-only MVP builds must provide progress export.

## 7. Monitoring

Monitor:

- Application availability
- Error rate
- Sync failures
- Content-load failures
- AI gateway failures
- Response latency
- Database health

## 8. Rollback

Every production release must have a rollback procedure.

Application and content rollbacks should be considered separately.

## 9. Incident Handling

For a severe failure:

1. Preserve data.
2. Disable the failing feature if possible.
3. Restore core learning access.
4. Identify affected versions.
5. Correct the issue.
6. Test recovery.
7. Document the incident.

## 10. Operational Priority

Core lessons, deterministic practice, saved progress, and review scheduling have priority over AI tutoring and nonessential visual features.
