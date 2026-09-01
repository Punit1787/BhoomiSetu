# Phase 2 — Frontend status

Status: implementation and local verification complete; public deployment pending hosting plan.

## Delivered

- Shared Next.js App Router shell, responsive navigation, reusable case card, status badge, timeline, and responsibility trail.
- Typed API client with JWT attachment, refresh-token retry, and 401 handling.
- Persisted role session and role-route guard with dedicated 403 experience.
- TanStack Query cache and optional Supabase Realtime subscription that invalidates case queries immediately.
- Five distinct role portals:
  - Citizen: cases, detailed six-stage timeline, document upload state, grievance submission and status.
  - Officer: mobile-first assigned queue, filters, AI field confirmation UI, grievance/transition action surfaces.
  - Project Authority: metrics, actual Leaflet/OSM parcel map, 20 stage-colored clickable polygons, bottleneck counts, interoperability control.
  - District/State Admin: State → District → Project drill-down, rollups, export control, audit viewer.
  - Senior/Central Admin: required national MIS fields, timeline adherence actions, and predictive-risk presentation.
- Intentional demo-data fallback lets the complete interface run during judging even when hosted services are unavailable.
- Citizen document upload and grievance submission now call the real FastAPI
  mutation contracts in live mode and report their returned status immediately.
- Officer stage advancement now sends the backend's `new_stage`/`reason` contract,
  invalidates the live cases query and visibly updates the stage. Demo mode remains
  clearly labelled and updates local state only.

## Verification

- `npm run lint` — pass.
- `npm test` — 4 tests pass, including transition, multipart upload and grievance
  request-contract coverage.
- Browser interaction — citizen grievance result, officer visible stage change and
  cross-role 403 redirect pass.
- `npm run build` — pass; all application routes compiled.
- Browser QA — landing/login/citizen flow pass.
- Mobile QA — officer portal verified at 390 × 844.
- GIS QA — 20 Leaflet SVG polygons rendered; no browser console errors.

## External deployment blocker

Railway refused project creation because the signed-in account trial has expired. The frontend and backend remain deployment-ready, but a hosting plan or an alternate hosting account is required for public URLs.
