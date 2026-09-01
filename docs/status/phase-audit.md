# Phase 1–5 completion audit

Updated: 2026-09-01 Asia/Kolkata

This audit uses the exit criteria in `docs/original-plan/Phase1_*.md` through
`Phase5_*.md`. A feature is not counted merely because a screen or status file
mentions it.

## Phase 1 — Foundation and backend

Result: **4 of 5 exit criteria proven locally; public backend deployment pending.**

- PASS — five-role registration/login, access and refresh JWTs, Argon2 and RBAC.
- PASS — project, parcel, landowner and case APIs are present in OpenAPI.
- PASS — all six legal workflow stages, history and hash-chained audit writes are
  covered by the database-backed API suite.
- PASS — the deterministic seed creates 20 synthetic OSM-derived parcel polygons.
- PENDING — no publicly reachable Render backend URL exists yet.

Evidence: 17 backend tests pass against PostgreSQL/PostGIS; Ruff passes; the
offline production health check has previously returned HTTP 200.

## Phase 2 — Frontend

Result: **5 of 6 exit criteria proven; Vercel deployment pending.**

- PASS — all five role portals render and wrong-role navigation reaches the 403
  route in live browser QA.
- PASS — citizen upload and grievance controls are connected to the real FastAPI
  contracts outside visibly labelled demo mode; responses update the page without
  refresh.
- PASS — officer workflow advancement calls the real transition contract, refreshes
  the cases query and visibly changes the stage; demo mode changes local state.
- PASS — officer layout is browser-verified at 390×844.
- PASS — the Leaflet/OSM authority map renders 20 clickable stage-coloured parcels;
  bottleneck counts are derived from the same case array.
- PENDING — no Vercel production URL is connected to a public backend.

Evidence: ESLint passes; 6 Vitest tests pass; TypeScript/Next production build
passes; browser QA verifies the citizen timeline, officer stage change, role guard,
authority live prediction disclosure and senior aggregate prediction.

## Phase 3 — AI, ML and GIS

Result: **4 technical criteria proven; presenter rehearsal criterion pending.**

- PASS — an actual generated scan is processed through Tesseract OCR and then
  human-confirmed.
- PASS — grievance classification returns category, priority and department.
- PASS — both deterministic Random Forest bundles load and return predictions with
  per-case sensitivity drivers, explicit synthetic-data disclosure and recorded
  holdout metrics.
- PASS — aggregate prediction and PostGIS intersection endpoints operate against
  stored cases/polygons.
- PENDING (human) — the presenting team must rehearse the responsible explanation
  for excluding land-price prediction.

## Phase 4 — Interoperability, realtime and audit

Result: **3 of 4 exit criteria proven; hosted realtime proof pending.**

- PASS — API Setu and NGDRS-shaped fixtures are delayed and explicitly disclose
  that they are not live government data.
- PASS — mutating endpoints use the concurrency-safe audit writer.
- PASS — audit filtering and full-chain verification are tested.
- PENDING — Supabase publications and a two-browser-window hosted CDC test require
  migrated hosted tables plus deployment environment variables.

## Phase 5 — DevOps, testing and deployment

Result: **local delivery prepared; three external/human exit criteria remain.**

- PASS — backend and frontend GitHub Actions definitions exist; the backend CI
  secret variable mismatch found in this audit is corrected.
- PASS — `scripts/reset_demo.sh` is the single deterministic seed/build command.
- PASS — `scripts/start_demo.sh` is the tested offline production fallback.
- READY — `render.yaml` now defines the backend service without committing secrets;
  Vercel monorepo instructions are recorded in `docs/deployment.md`.
- PENDING — public Render and Vercel URLs with automatic deploys.
- PENDING (human) — five live demo rehearsals and spoken judge Q&A.

## Strict completion conclusion

The software is locally implemented and demonstrable, but the original plan's
full Phase 1–5 objective is **not yet complete**. The remaining proof requires:

1. explicit approval to push the latest private-source checkpoint;
2. Render deployment using the hosted Supabase connection secret;
3. Vercel deployment and final CORS configuration;
4. hosted Supabase migrations, realtime publication and a two-window CDC test;
5. five human rehearsals with the team recording the runs.

This strict exit-criteria audit is separate from the SIH evaluation score in
`docs/evaluation-readiness.md` (currently 78%), which weights judge readiness
rather than treating every phase checkbox equally.
