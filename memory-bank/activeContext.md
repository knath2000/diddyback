# Active Context: Diddyback Backend

## Current Focus
Stabilizing the Fly.io deployment and resolving the database seeding issue.

## Current State
- The application successfully builds and deploys to Fly.io.
- The `docker-entrypoint.sh` script correctly runs database migrations on startup.
- Health checks are configured with a `30s` grace period and are passing, keeping the application online.
- CORS is configured to allow requests from the local frontend (`http://localhost:3000`).
- The application is configured to have at least one machine running at all times (`min_machines_running = 1`).

### 🚨 Blocker
The `pnpm db:seed` command hangs indefinitely when run on the production machine via `flyctl ssh console`. This prevents the production database from being populated with initial data, so the API currently returns empty arrays for item queries.

## Immediate Next Steps (Next Session)
1.  **Diagnose the hanging seed command**:
    *   Investigate why the `pnpm db:seed` process is not completing.
    *   Explore potential issues with Prisma's connection to the Neon database within the Fly.io runtime.
    *   Consider alternative methods for seeding the production database if the `ssh console` command proves unreliable.
2.  **Verify Data**: Once the database is successfully seeded, confirm that the `/api/items` endpoint returns the correct data. 