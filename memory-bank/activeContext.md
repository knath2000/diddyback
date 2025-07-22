# Active Context: Diddyback Backend

## Current Focus
The backend is now fully integrated with the StockX API for real-time price tracking. The primary focus has shifted from initial data ingestion to maintaining and serving this new price data, while also ensuring robust API performance and reliability for the Nuxt frontend.

# ## Current State (as of July 26 2025)
- **StockX Integration Complete**:
    - The database schema has been updated to support variant-level price tracking, with `stockxProductId` on the `Variant` model and a new `StockXPrice` table for market snapshots.
    - A cron job (`src/jobs/syncStockxMarket.ts`) runs every 10 minutes to fetch and store the latest lowest ask, highest bid, and last sale prices for all tracked variants.
    - An authentication utility (`src/utils/stockxAuth.ts`) handles the StockX OAuth 2.0 refresh token flow.
    - New API endpoints (`/items/:id/stockx` and `/items/:id/stockx/history`) have been created to serve this data to the frontend.
- **Data Backfill Script Created**: A one-time script (`prisma/backfill-stockx-ids.ts`) has been created to populate the `stockxProductId` for existing variants by searching the StockX API.
- **CORS Policy Hardened**: The CORS configuration in `src/index.ts` has been updated to correctly handle origin-less requests from the Nuxt server-side renderer, fixing critical hydration errors on the frontend.

### ✨ New in this session
1. **Distributed Cron Lock** – Added `JobLock` model + migration and guard logic inside `syncStockxMarket` to ensure only one replica runs the StockX sync when multiple Fly machines are scaled.  
2. **Environment-Aware Back-fill Script** – Re-wrote `prisma/backfill-stockx-ids.ts` to dynamically resolve imports so it can run from raw TS in dev **and** from compiled JS in `/dist` during production.  
3. **Build Pipeline Tweaks** – Build script now compiles the back-fill script into `dist/prisma/` (and added prod alias `db:backfill-stockx-prod`).  
4. **Fly Deploy Attempt** – Latest deploy failed due to TypeScript errors (`esModuleInterop`, duplicate `require`, `import.meta`) in the back-fill compilation step. Fix is queued for next session.

## Immediate Next Steps
1. **Fix Build Errors** – Adjust TypeScript config for the back-fill script (`esModuleInterop`, `module` target) and eliminate duplicate `require` definition so Docker build passes.  
2. **Set & Test STOCKX_REFRESH_TOKEN** – Add the secret in Fly and run `pnpm run db:backfill-stockx-prod` inside the VM.  
3. **Verify Distributed Locking in Prod** – Scale the app to >1 VM and watch logs to confirm that only one instance performs the cron sync.  
4. **Begin Gamification Backend** – After data pipeline is proven stable, start designing DB tables & API for XP, achievements, etc. 