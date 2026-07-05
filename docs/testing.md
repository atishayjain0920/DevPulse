# Testing Strategy

DevPulse follows a testing pyramid.

## Unit Tests

- Analytics calculations
- Productivity score and repository health score
- AI response fallbacks
- Validation schemas
- Security helpers

## Integration Tests

- Auth flows with controlled GitHub OAuth fixtures
- Repository sync with controlled GitHub API fixtures
- Webhook HMAC verification
- Dashboard endpoint aggregation
- Report job queueing

## E2E Tests

- Login via GitHub
- Repository synchronization
- Dashboard rendering
- AI summary generation
- Report export
- Logout

## Accessibility

Verify keyboard navigation, focus states, semantic labels, contrast, screen reader behavior, and responsive layout.
