# Phase 5 — DevOps, deployment and demo status

Status: local delivery complete; public deployment and human rehearsal remain external actions.

## Delivered and verified

- Separate fast GitHub Actions pipelines for backend/PostGIS and frontend.
- Backend CI now sets the application's actual `JWT_SECRET` variable; the prior
  `JWT_ACCESS_SECRET` name silently fell back to a development default.
- Root Render Blueprint defines the free Docker backend, generated JWT secrets,
  prompted Supabase/CORS variables and health check. Vercel monorepo setup is
  documented with `apps/frontend` as the Root Directory.
- One canonical `scripts/reset_demo.sh` command for migrations, two model builds, five accounts and 20 varied OSM-derived cases.
- One `scripts/start_demo.sh` production-mode offline fallback with coordinated cleanup and configurable test ports.
- Offline fallback test: backend health returned OK and frontend returned HTTP 200.
- Timed 7–8 minute demo script, presenter split and five-run rehearsal ledger.
- Judge Q&A pack with honest interoperability, ML, audit, privacy and sustainability answers.
- Editable 11-slide PowerPoint pitch deck generated with the bundled artifact tool.
- Every slide rendered and inspected; structural test reports no overflow.

## External items not falsely claimed

- Public URLs and auto-deploy are blocked because the authenticated Railway account’s trial has expired.
- Hosted Supabase realtime needs a linked project and its environment variables.
- Five live human rehearsals must be performed by the presenting team; the ledger is provided but deliberately blank.
