# Backend Project Brief – Supreme Price Tracker

This memory-bank folder tracks ONLY the **backend** service (`diddyback`).

## Purpose
Build and operate the server-side layer that powers the Supreme Price Tracker:
1. REST API for item catalog, price history, user watchlists and alerts.
2. Database schema & migrations.
3. Authentication & authorization (custom JWT).
4. Background jobs for price polling.
5. Deployment & observability on Railway.

## Success Criteria
- API latency <200 ms cached, <2 s fresh.
- 99.9 % uptime (Railway autoscaled container).
- Price updates within 15-30 min.
- Secure JWT auth, rate limiting, OWASP top-10 compliance.
- Zero-downtime deploys via Railway build pipeline. 