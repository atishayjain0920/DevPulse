# Architecture

DevPulse follows a modular monolith architecture.

## Layers

- Frontend feature modules own UI, hooks, service calls, validation, and local state.
- Backend route modules delegate to services; controllers stay thin.
- Service modules own business rules for analytics, AI, repositories, profiles, reports, notifications, and security.
- Prisma owns persistence and migrations.
- BullMQ handles idempotent background work.
- Socket.IO publishes authorized realtime events.

## Data Flow

1. GitHub OAuth grants read-only access.
2. Manual sync, scheduled sync, or webhooks collect repository metadata, commits, PRs, workflow runs, deployments, and contributors.
3. Data is normalized into PostgreSQL.
4. Analytics services calculate KPIs, productivity scores, health scores, risk detections, heatmaps, and trends.
5. Dashboard APIs return cached aggregates.
6. AI services consume structured analytics and produce summaries, recommendations, and Q&A responses.
7. Realtime events update subscribed dashboard clients.

## Extension Points

- Add providers under backend modules without changing dashboard contracts.
- Add future GitLab, Bitbucket, Jira, Jenkins, Azure DevOps, Slack, or Teams integrations by mapping their events into the normalized analytics pipeline.
- Add new source integrations by mapping provider payloads into Prisma-backed repositories while preserving route and service interfaces.
