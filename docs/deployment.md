# Deployment

## Recommended Targets

- Frontend: Vercel
- Backend: Railway, Render, or AWS EC2
- Database: Neon PostgreSQL or Supabase PostgreSQL
- Redis: Upstash Redis
- CI/CD: GitHub Actions

## Environment Variables

Configure all variables from `backend/.env.example` and `frontend/.env.example`.

Never commit real secrets.

## Production Checklist

- Use HTTPS.
- Set secure HTTP-only cookies.
- Set strong JWT and encryption secrets.
- Configure GitHub OAuth callback URL.
- Configure GitHub webhook secret.
- Run Prisma migrations.
- Enable Redis-backed queues.
- Verify webhook signature enforcement.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
