# diddyback – Backend Service

This folder contains the standalone backend for **Supreme Price Tracker**.
It exposes a simple REST API using **Express** & **Prisma**.

## Prerequisites

1. **Node.js 18+**
2. **PostgreSQL** database – a connection string in `DATABASE_URL` env var.
3. `pnpm`, `npm`, or `yarn` – choose your favourite package manager.

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm run generate

# Push schema to database (creates tables)
pnpm run db:push

# Start dev server with hot-reload
pnpm run dev
```

API will be available at `http://localhost:4000` (or the `PORT` env variable).

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | health check |
| GET | `/items` | paginated list of items (`?page` / `?limit`) |
| GET | `/items/:id` | single item by id or slug |
| GET | `/items/:id/prices` | price history for an item (`?platform` / `?limit`) |

## Deployment

The backend is self-contained and can be deployed to any Node-capable platform (Fly.io, Render, Heroku, etc.).
Remember to set `DATABASE_URL` and `PORT` environment variables. 