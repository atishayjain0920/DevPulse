# DevPulse

DevPulse is a full-stack Developer Productivity Intelligence Dashboard for read-only GitHub analytics, repository health, CI/CD visibility, AI-assisted recommendations, notifications, reports, and security monitoring.

## Stack

- Frontend: React 19, TypeScript, Vite, TanStack Query, React Router, Recharts, React Hook Form, Zod, Zustand, Lucide
- Backend: Node.js, Express, TypeScript, Zod, JWT, Passport-ready GitHub OAuth, Helmet, CORS, rate limiting, Pino, Socket.IO
- Database: PostgreSQL with Prisma ORM
- Jobs/cache: Redis-ready BullMQ queue

## Quick Start

```bash
cd devpulse
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
```

The backend listens on `http://localhost:4000`; the frontend listens on `http://localhost:5174`.

## Core Features

- GitHub OAuth flow scaffold with read-only scopes, secure cookies, refresh-token rotation hooks, trusted devices, MFA endpoints, and active session management.
- Role-based access for Developer, Team Lead, and Administrator experiences.
- Repository dashboards with commits, pull requests, contributors, branches, workflows, deployments, health, risks, and AI summaries.
- Analytics engine for commit trends, churn, heatmaps, PR performance, CI/CD reliability, productivity score, engineering KPIs, and repository health score.
- AI intelligence layer that uses structured analytics only and responds transparently when data is unavailable.
- In-app notifications, report queueing for PDF/Excel/CSV, global search, settings, audit logs, and security center.
- GitHub webhook endpoint with HMAC verification in production.
- Socket.IO realtime channel for repository sync, health updates, workflow/build events, notifications, and AI summary readiness.

## API Docs

Run the backend and open `http://localhost:4000/docs`.

All API responses use:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-07-02T00:00:00.000Z",
    "requestId": "..."
  }
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed."
  },
  "meta": {
    "timestamp": "2026-07-02T00:00:00.000Z",
    "requestId": "..."
  }
}
```

## Database

The Prisma schema in `backend/prisma/schema.prisma` models users, roles, organizations, GitHub accounts, repositories, branches, commits, contributors, pull requests, reviews, workflows, runs, deployments, repository health, risks, developer profiles, achievements, notifications, AI summaries, AI chat, dashboard preferences, sessions, trusted devices, audit logs, webhooks, export jobs, search history, and system settings.

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Security Notes

- OAuth tokens are encrypted with AES-256-GCM helpers before storage.
- Webhook signatures are verified with GitHub HMAC SHA-256 in production.
- API routes use validation, rate limiting, request IDs, CORS, Helmet, structured logging, and centralized error handling.
- AI prompts intentionally avoid secrets, access tokens, environment variables, sensitive config, and repository source code.
- The application is read-only with respect to GitHub repositories.
