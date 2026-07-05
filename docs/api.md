# API Surface

Base path: `/api/v1`

## Authentication

- `GET /auth/github`
- `GET /auth/github/callback`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/mfa/verify`
- `POST /auth/device/trust`

## Users

- `GET /users/me`
- `PUT /users/me`
- `GET /users/preferences`
- `PUT /users/preferences`

## Repositories

- `GET /repositories`
- `GET /repositories/:id`
- `GET /repositories/:id/contributors`
- `GET /repositories/:id/branches`
- `GET /repositories/:id/health`
- `POST /repositories/:id/sync`

## Analytics

- `GET /analytics/commits`
- `GET /analytics/commits/trend`
- `GET /analytics/commits/heatmap`
- `GET /analytics/commits/churn`

## Pull Requests

- `GET /pull-requests`
- `GET /pull-requests/:id`
- `GET /pull-requests/stale`
- `GET /pull-requests/reviews`
- `GET /pull-requests/statistics`

## Workflows

- `GET /workflows`
- `GET /workflows/:id`
- `GET /workflows/runs`
- `GET /workflows/failures`
- `GET /workflows/deployments`

## Dashboards

- `GET /dashboard/developer`
- `GET /dashboard/executive`
- `GET /dashboard/repository/:id`
- `GET /dashboard/team`

## AI

- `POST /ai/chat`
- `GET /ai/weekly-summary`
- `GET /ai/executive-summary`
- `GET /ai/repository-summary/:id`
- `GET /ai/recommendations`
- `GET /ai/risks`

## Operations

- `GET /notifications`
- `PUT /notifications/read/:id`
- `PUT /notifications/read-all`
- `DELETE /notifications/:id`
- `POST /reports/pdf`
- `POST /reports/excel`
- `POST /reports/csv`
- `GET /reports/history`
- `GET /search`
- `GET /security/sessions`
- `DELETE /security/session/:id`
- `GET /security/devices`
- `DELETE /security/device/:id`
- `GET /security/audit`
- `POST /security/mfa`
- `GET /settings`
- `PUT /settings`
- `POST /webhooks/github`
