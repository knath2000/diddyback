# Backend Tech Context

## Runtime & Frameworks
- **Node.js 18+** (CommonJS build)
- **Express 4.19** – HTTP layer
- **Prisma ORM 6.x** – Database access

## Database
- **Primary**: Railway PostgreSQL (free serverless)
- **Alternative**: Neon Postgres or PlanetScale MySQL (branching)

## Auth & Security
- **bcrypt** for password hashing
- **jsonwebtoken** for JWT issuance & verification
- **helmet** + **cors** middlewares
- **Rate limiting**: `express-rate-limit` (per-IP)

## Background Jobs
- Railway cron (or GitHub Actions) hitting `/jobs/poll` endpoint

## Observability
- **Sentry SDK** for Node
- **Prometheus-compatible** metrics via `/metrics`

## Build & Deployment
- Build: `tsc -p tsconfig.json`
- Container: Railway Nixpack (installs pnpm, builds, runs)
- Start: `node dist/index.js` 