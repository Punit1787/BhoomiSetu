# Phase 5 — DevOps, Testing, Deployment, Demo Prep
### BhoomiSetu (SIH26016) — Standalone phase doc

**Context if you're a fresh Claude chat reading only this file:** BhoomiSetu is a Land Acquisition & Management System for SIH26016. Backend: FastAPI + PostgreSQL/PostGIS via Supabase (Phase 1). Frontend: Next.js (Phase 2). AI/ML: Phase 3. Interop/Realtime/Audit: Phase 4. This phase owns everything that makes the other four phases reliably demoable: CI/CD, testing discipline, deployment, and the actual demo/pitch mechanics.

---

## 1. Scope of this phase

- CI/CD pipeline (GitHub Actions)
- Test coverage coordination (not writing every test yourself, but making sure the pipeline runs them)
- Deployment (frontend, backend, database)
- Seed-data orchestration for the live demo
- Demo script and rehearsal
- Pitch deck
- Judge Q&A prep (impact/business side)

## 2. Tech/tools for this phase

| Tool | Purpose |
|---|---|
| GitHub Actions | CI — lint + test on every PR |
| Pytest | Backend test runner (tests themselves are written by whoever owns each endpoint — you own the pipeline that runs them) |
| Vitest + React Testing Library | Frontend test runner |
| Vercel | Frontend hosting |
| Render or Railway | Backend hosting |
| Supabase | DB/storage/realtime hosting (shared across all phases) |

## 3. CI/CD setup (do this early — day one, not day five)

1. `.github/workflows/backend.yml` — on every PR touching `apps/backend/**`: install deps, run `pytest`, run a linter (`ruff` or `flake8`)
2. `.github/workflows/frontend.yml` — on every PR touching `apps/frontend/**`: install deps, run `npm run lint`, run `vitest run`
3. Keep both pipelines fast (under a couple minutes) — a slow CI pipeline gets ignored by a team under time pressure, which defeats the purpose
4. **Set this up even with thin test coverage at first.** The pipeline skeleton existing early means other phases add tests into a working structure instead of you retrofitting CI at the end when nobody has time to fix a broken pipeline.

## 4. Deployment

### 4.1 Day-one deploy (before any real features exist)

Deploy a literal "hello world" of both frontend and backend to their target hosts on day one:
- Backend: a FastAPI app with just a health-check route (`GET /health`), deployed to Render/Railway
- Frontend: a default Next.js page, deployed to Vercel, pointed at the (empty) backend URL

**Why this matters:** deployment surprises (env var misconfigurations, build failures, CORS issues) are far cheaper to discover on day one with nothing at stake than on the last day when the whole team is depending on a working deploy for rehearsal. This is one of the highest-leverage things you can do early.

### 4.2 Ongoing deploys

- Backend → Render or Railway, environment variables for `DATABASE_URL`, JWT secrets, LLM API keys, all set via the platform's secret manager, never committed to the repo
- Frontend → Vercel, environment variable for the backend API base URL
- Database/storage/realtime → Supabase (shared connection string across all backend deploys)
- Set up auto-deploy on merge to `main` for both frontend and backend, so the demo environment always reflects the latest merged code

### 4.3 Offline fallback (critical — venue Wi-Fi is the #1 cause of ruined SIH demos)

- Maintain a local/offline-runnable build as backup: docker-compose or a documented local-run script that spins up backend + frontend + a local Postgres with PostGIS, seeded with the same demo data
- Have a pre-recorded demo video as the final fallback if both live and local options fail at the venue

## 5. Seed-data orchestration

- Coordinate with Phase 1 (base generator) and Phase 3 (ML training data extension) so there's **one canonical seed script** that produces a consistent, realistic demo state — not several people's half-finished seed scripts fighting each other
- The demo project ("Pune Ring Road" or similar) should have cases at **varying stages** — not everything freshly created — so the timeline/bottleneck/map views all have something interesting to show immediately without needing live manipulation during the demo
- Re-seeding should be a single command, runnable at the venue right before the demo, so a corrupted demo state from testing/rehearsal doesn't carry into the actual evaluation

## 6. Demo script

Structure around the 20-step demo story used in rehearsal (adapt exact beats to your team's actual build, but this is the shape):

1. **Problem framing** (Presenter, narrating) — the real pain point: fragmented systems, delays, opacity in land acquisition
2. **Project Authority creates a project, adds parcels** — show the map, real OSM-based geometry
3. **Landowner logs in, views their case timeline** — the core value-prop screen
4. **Document upload → AI extraction → confirmation screen** — show the extracted fields, then confirm
5. **Officer verifies, approves — case advances** — show this live in two browser windows (Officer + Citizen) side by side, so the real-time push is visible, not claimed
6. **Grievance submitted → AI classifies → officer resolves**
7. **Compensation status simulation, R&R fields**
8. **Bottleneck view** — click through from an aggregated count to the underlying case list
9. **Predictive risk panel** — show a delay-risk prediction with feature importances, then the aggregated dashboard view
10. **Interoperability panel** — trigger the mock API Setu call live, narrate the honest framing (Section 2 of Phase 4's doc) if a judge asks
11. **Audit log viewer** — close on this as proof of the "one responsibility trail, tamper-evident" claim
12. **Closing pitch line** — impact framing, RFCTLARR/DPDP grounding, business/sustainability model in one sentence

**Rehearse this exact sequence, live, at least 5 times before the final evaluation** — muscle memory matters more than slide polish. Split narration between two presenters: one drives the technical narrative (architecture, "why Postgres not Mongo," "how does the real-time update work"), the other drives the impact narrative (problem framing, social impact, "why does this matter for India"). Everyone else on the team should still be able to answer questions about their own module if a judge addresses them directly — the whole team is present during evaluation, not just the presenters.

## 7. Judge Q&A prep — have these answers rehearsed cold

| Likely question | Answer to have ready |
|---|---|
| "Why not just use DILRMP / BhoomiRashi?" | You're an orchestration/interoperability layer that sits alongside those systems, not a replacement — you coordinate across Central/State/District/Agency stakeholders that those systems don't unify |
| "Do you have real API Setu access?" | No — explain the real onboarding requirement (consumer registration + publisher approval), and that you've built a stub layer matching the real response shape; this is a deliberate, honest scope decision, not an oversight |
| "Why not predict land price / compensation amount?" | Compensation amount is a statutory RFCTLARR calculation, not something an ML model should approximate on a government platform; you predict *disbursal timeline*, a procedural outcome, instead |
| "How accurate is your ML model?" | Trained on synthetic data reflecting realistic RFCTLARR-stage timelines; in production it would retrain on real historical case data from the acquiring authority |
| "Is this a real blockchain?" | No — a simple hash-chained audit log, described honestly as "tamper-evident," not blockchain |
| "How does your auth actually work?" | JWT access + refresh tokens, argon2 password hashing, RBAC enforced via FastAPI dependency injection per route |
| "What's your business/sustainability model?" | Govt SaaS/licensing or state-deployment model — have one crisp sentence ready, agreed on by the team in advance |
| "Data privacy/security?" | RBAC, hash-chained audit trail, DPDP Act 2023-aligned design (role-based access, audit logging, data minimisation), no real citizen data used anywhere in the prototype |

## 8. Freeze discipline

- **Freeze feature changes well before final rehearsal.** Only bug fixes after that point — a last-minute feature is the most common cause of a live-demo crash.
- In the final hours before evaluation, presenters should be protected from grunt work — their only job is rehearsing the pitch, timing the demo, and prepping Q&A answers. The rest of the team handles any last bug fixes.

## 9. Exit criteria for this phase

- [ ] CI pipeline runs on every PR for both frontend and backend
- [ ] Frontend and backend are both deployed to public URLs, auto-deploying from `main`
- [ ] A single seed-data command reliably produces a realistic, varied demo state
- [ ] Local/offline fallback build exists and has been tested at least once
- [ ] Demo script is written down and has been rehearsed live at least 5 times
- [ ] Every judge Q&A answer in Section 7 has been said out loud by the presenters, not just read

## 10. What NOT to build in this phase

- Any actual feature logic (Phases 1-4 own their respective domains — you own making their combined output reliably demoable)
