# Current status — resume here

Updated: 2026-09-01 Asia/Kolkata

## Verified this checkpoint

- Real seeded login now works: frontend credentials match backend
  (`@bhoomsetu.local`, `DemoPass123!`).
- Frontend auth now matches the backend contract (`name`, not `full_name`) and
  normalizes backend `project_authority` to the `/portal/authority` route.
- Live cases use stable UUID-derived references when synthetic case numbers are absent.
- Backend row-level access now restricts citizens to linked parcels and officers to
  assigned cases across case lists/details, transitions, documents, grievances,
  predictions and spatial results. Unauthorized lookups return 404.
- Real browser proof passed: officer JWT login, live `/cases`, PostgreSQL-backed
  transition, visible refresh, and persisted `VERIFICATION|1 history|1 audit`.
- Real citizen login showed exactly one linked case and the authenticated name.
- Citizen selection now resolves against live query data; case-detail stage history
  is fetched and normalized from `changed_at/reason` to the timeline model.
- Backend Ruff and all 17 PostgreSQL/PostGIS tests pass.
- Frontend ESLint, 6 Vitest contract tests, TypeScript and production build pass.
- ML v2 records a reproducible model card and exposes honest synthetic-data,
  real-validation and holdout-MAE metadata through the prediction contract.
- The authority portal now displays a live per-case prediction with case-specific
  sensitivity drivers; the senior portal consumes the aggregate prediction API.
- Production-build browser QA proves the authority view renders a live 218-day
  high-risk result with three drivers and disclosure; the senior view renders 55%
  high-risk across 20 cases and a 58.5-day compensation-timeline average.
- Production-build citizen QA proves one linked case and the normalized persisted
  verification-stage timeline.
- Production-build citizen QA also proves an authenticated grievance write and
  classification (`compensation`, `low`, Compensation & Treasury Cell) plus an
  actual generated PNG upload through Tesseract OCR at 90% extraction confidence.
- Live portals now wait for authorized case data instead of briefly substituting
  fixture IDs, eliminating startup requests such as `/cases/case-001` in live mode.
- Local backend/frontend verification services were stopped cleanly.

## Resume exactly here

1. Start backend on 8001 with `FRONTEND_ORIGIN=http://127.0.0.1:3100`.
2. Build frontend with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001`, then start
   it on 3100.
3. With explicit approval to clear current synthetic demo interactions, run the
   revised `scripts/seed_data.py` twice and prove the restored state is identical.
4. External completion still needs explicit approval: push private source, deploy
   Render/Vercel, migrate/seed Supabase, enable realtime, run two-window CDC QA,
   and record five human rehearsals.

## Boundaries

- API Setu/NGDRS are disclosed fixtures; ML uses synthetic data and never predicts
  land value or legal outcomes.
- No secrets or real citizen data belong in Git.
- Remote `origin/main` predates the crisp redesign; current work remains local until
  the user explicitly approves private GitHub egress. Resume from local commit
  `0bf7b46` (the implementation checkpoint); the following status-only commit may
  sit on top of it.
