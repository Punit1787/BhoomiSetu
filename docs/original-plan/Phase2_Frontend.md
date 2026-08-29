# Phase 2 — Frontend (All 5 Role Portals)
### BhoomiSetu (SIH26016) — Standalone phase doc

**Context if you're a fresh Claude chat reading only this file:** BhoomiSetu is a Land Acquisition & Management System for SIH26016. Backend is a FastAPI service (built in Phase 1) exposing REST endpoints, documented via Swagger/OpenAPI, with JWT auth and role-based access. This phase builds the Next.js frontend consuming that API — 5 distinct role-based portals sharing a component library.

---

## 1. Scope of this phase

- Shared app shell: layout, auth flow, role-based routing
- Landowner/Citizen portal
- Officer portal (mobile-responsive — this is an explicit PS requirement)
- Project Authority portal
- District/State Admin portal
- Senior/Central Admin portal
- Map integration (Leaflet)
- Consuming real-time updates (Supabase Realtime client — the *server-side* Realtime setup is Phase 4's job, but the frontend subscription code lives here)

## 2. Tech stack for this phase

| Tool | Purpose |
|---|---|
| Next.js 14 (App Router) + TypeScript | Framework |
| Tailwind CSS + shadcn/ui | Styling, component library |
| TanStack Query (React Query) | Server state, caching, auto-refetch |
| Zustand | Light client-side state (UI toggles, selections) |
| Leaflet.js + react-leaflet | Interactive maps |
| Supabase JS client | Realtime subscriptions, auth token handling if needed |

## 3. Repo structure

```
apps/
  frontend/
    app/
      (auth)/login, register
      landowner/            <- citizen portal routes
      officer/               <- officer portal routes
      authority/              <- project authority portal routes
      admin/district/          <- district/state admin routes
      admin/senior/              <- senior/central admin routes
      layout.tsx
    components/
      shared/                    <- cross-role components (timeline, case card, etc.)
      ui/                         <- shadcn components
    lib/
      api-client.ts                <- typed fetch wrapper for backend
      auth.ts
    hooks/
```

## 4. Setup steps

1. `npx create-next-app@latest` with TypeScript + Tailwind + App Router.
2. Install shadcn/ui, initialize with your design tokens.
3. Install `@tanstack/react-query`, `zustand`, `leaflet`, `react-leaflet`, `@supabase/supabase-js`.
4. Build `lib/api-client.ts` — a typed fetch wrapper that attaches the JWT from auth state to every request, and handles 401 by attempting refresh-token flow.
5. Set up route guards: a layout-level check per role-prefixed route group (`/officer/*` requires role=officer, etc.) that redirects to login or a 403 page if the JWT role doesn't match.

**Milestone before splitting into portal-specific work:** login works end-to-end against the real backend (Phase 1 must have exit-criteria auth working first), and at least one empty dashboard renders per role behind the route guard.

## 5. Build order within this phase

Build in this order — each portal reuses components from the ones before it, so building in sequence avoids rework.

### 5.1 Shared shell (first)
- App layout, nav per role, auth pages, route guards
- Shared components: `<CaseCard>`, `<StatusBadge>`, `<Timeline>`, `<ResponsibilityTrail>` — these get reused across every portal, so invest real time here

### 5.2 Landowner/Citizen portal (second — this is the core value-prop screen)
- **My Cases** — list of cases tied to the logged-in landowner
- **Case Timeline** — visual stage-by-stage history (uses the shared `<Timeline>` component, fed by `case_stage_history` from the backend)
- **Document Upload** — file picker + upload, shows AI-extracted fields once available (poll or await the extraction endpoint from Phase 3), shows version history if a document is re-uploaded
- **Grievance Submission** — simple form
- **Grievance Status** — list + status badges
- This is the screen judges will find most emotionally resonant — "where is my case, what happens next" — spend disproportionate polish time here relative to admin screens

### 5.3 Officer portal (third — **test on a real mobile viewport, not just responsive CSS in devtools**)
- **Assigned Cases** — list, filterable
- **Document Verification Queue** — shows AI-extracted fields side-by-side with the original upload, confirm/correct UI, approve/reject action
- **Grievance Resolution Queue** — assign, resolve, add notes
- **Stage Transition action** — calls Phase 1's `POST /cases/{id}/transition`

### 5.4 Project Authority portal
- **Project Dashboard** — create/manage projects and parcels
- **Bottleneck View** — counts per stage, click-through to filtered case list (this is one of your five headline differentiators — make the click-through snappy)
- **GIS Map** — see Section 6 below
- **Interoperability Panel** — a visible "Check land record" button that calls Phase 4's mock API Setu stub and displays the (fake but realistically shaped) response live

### 5.5 District/State Admin portal
- **Drill-down view** — State → District → Project (2-level minimum for MVP; deeper drill-down is secondary-tier)
- **Aggregated dashboards** — per-district/state rollups of the national dashboard fields
- **Audit Log Viewer** — filterable table view (built once, can be shared/embedded in Senior portal too)

### 5.6 Senior/Central Admin portal
- **National-style dashboard** — the full field list from the PS: area notified, area acquired, compensation assessed/paid, affected families, R&R status, project progress, possession status, timeline adherence
- **Predictive Risk View** — surfaces Phase 3's ML predictions, aggregated (e.g. "38% of Maharashtra highway cases are high delay risk")
- **MIS Reports** — secondary tier, CSV export is enough if built at all

## 6. Map integration details

- Once Phase 1 exposes parcel geometry via the API, wire up `react-leaflet` with OSM tile layer
- Render parcel polygons from GeoJSON (convert PostGIS geometry to GeoJSON server-side, or client-side via a library — server-side is simpler)
- Color-code polygons by `cases.current_stage` (e.g. a small stage→color map shared as a constant)
- Click handler on each polygon opens the linked case (route to case detail page, or open a side panel — side panel is faster to build and demos well)

## 7. Real-time updates (client side)

- Subscribe to Supabase Realtime channel for `cases` table changes (server-side Realtime config is Phase 4's responsibility — this is the client subscription code)
- On a relevant change event, invalidate the TanStack Query cache for that case / case list, triggering a re-render with fresh data
- This is what powers the "citizen dashboard updates the instant officer approves" demo moment — test it explicitly with two browser windows side by side (Officer + Citizen) before the final rehearsal

## 8. Exit criteria for this phase

- [ ] All 5 portals render, gated correctly by role
- [ ] Landowner can upload a document and see status change reflected without a manual page refresh
- [ ] Officer portal is usable on an actual phone-sized screen, not just desktop
- [ ] Map renders parcels, click opens the correct case
- [ ] Bottleneck view counts match the actual case data
- [ ] Frontend is deployed to Vercel and pointed at the deployed backend, not localhost

## 9. What NOT to build in this phase

- Any backend logic (Phase 1)
- The AI extraction/classification logic itself — only the UI that displays and confirms its output (Phase 3 owns the model calls)
- The mock API Setu server-side stub — only the button/panel calling it (Phase 4)
- CI/CD pipeline configuration (Phase 5)
