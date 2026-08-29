# Phase 1 — Foundation & Backend Core
### BhoomiSetu (SIH26016) — Standalone phase doc

**Context if you're a fresh Claude chat reading only this file:** BhoomiSetu is a Land Acquisition & Management System for SIH26016. It's an interoperability layer over existing government land-record systems (BhoomiRashi/DILRMP/state portals), not a replacement. Backend: Python FastAPI + PostgreSQL/PostGIS via Supabase. Frontend (separate phase): Next.js. This phase covers everything that has to exist before other phases can build on top of it.

---

## 1. Scope of this phase

- Repo setup
- Supabase project + PostGIS
- Database schema (SQLAlchemy models + Alembic migrations)
- Auth (JWT + argon2 + RBAC)
- Core CRUD APIs: projects, parcels, landowners, cases
- Workflow engine (state machine for case stages)
- Synthetic data generator (base version — ML-specific extensions happen in Phase 3)

## 2. Tech stack for this phase

| Tool | Purpose |
|---|---|
| Python FastAPI | Backend framework, async |
| SQLAlchemy 2.0 (async) | ORM |
| Alembic | Migrations |
| PostgreSQL 15+ with PostGIS | Database |
| Supabase | Hosted Postgres+PostGIS+Storage |
| PyJWT / python-jose | JWT issuance |
| argon2-cffi | Password hashing |
| Faker (Python) | Synthetic data |
| Pytest | Testing (setup now, deepen in Phase 5) |

## 3. Repo structure

```
apps/
  backend/
    app/
      models/          <- SQLAlchemy models
      schemas/          <- Pydantic schemas
      routers/          <- FastAPI route modules
      services/          <- business logic (workflow engine, etc.)
      core/              <- auth, config, db session
      alembic/           <- migrations
    tests/
    requirements.txt
  frontend/               <- Phase 2 owns this
```

## 4. Setup steps (in order)

1. Create GitHub repo, monorepo layout above.
2. Create Supabase project. In the Supabase SQL editor, run:
   ```sql
   create extension if not exists postgis;
   ```
   Do this immediately — before any migrations — so geometry columns work from the start.
3. Set up `.env` for backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
4. Install: `fastapi`, `uvicorn`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `python-jose[cryptography]`, `argon2-cffi`, `pydantic`, `python-multipart`, `faker`.
5. Initialize Alembic (`alembic init app/alembic`), configure `env.py` to point at your async engine and import all models so autogenerate works.

## 5. Data model — build tables in this order

Full ER diagram is in the central master doc — this is the same schema, just with build sequencing notes.

1. **`users`** — id, name, email, role (enum: landowner, officer, project_authority, district_admin, senior_admin), password_hash
2. **`projects`** — id, name, type, state, district, status
3. **`parcels`** — id, project_id FK, khasra_survey_no, polygon (PostGIS `Geometry(Polygon, 4326)`)
4. **`landowners`** — id, parcel_id FK, name, contact
5. **`cases`** — id, parcel_id FK (unique — one case per parcel), current_stage (enum matching workflow), assigned_officer_id FK, affected_family_count, created_at
6. **`case_stage_history`** — id, case_id FK, from_stage, to_stage, changed_by FK, changed_at
7. **`documents`** — id, case_id FK, version int, parent_document_id FK (nullable, self-referential), file_url, extracted_fields (JSONB), status
8. **`grievances`** — id, case_id FK, category, priority, department, status
9. **`compensation_status`** — id, case_id FK, status (enum: assessed, approved, disbursed)
10. **`rr_status`** — id, case_id FK, rehabilitation_stage, resettlement_site_assigned (bool)
11. **`audit_log`** — id, user_id FK, action, prev_hash, row_hash, created_at *(you own writing to this table from every mutating endpoint — the log service itself is Phase 4's job, but every endpoint you build here must call it)*

Note: `delay_predictions` table belongs to Phase 3 (ML) — don't build it here, just leave the FK relationship in mind.

## 6. Auth & RBAC

- JWT access token (short-lived, ~15min) + refresh token (longer-lived, ~7 days)
- Password hashing: argon2
- RBAC pattern: a FastAPI dependency `require_role(*roles)` that reads the decoded JWT's role claim and raises 403 if not in the allowed set. Apply per-router or per-route.
- **Milestone to hit before moving on:** all 5 roles can register/login and receive a valid JWT, and at least one protected endpoint correctly rejects the wrong role. Nothing else is usefully buildable — by you or other phases — until this works.

## 7. Core CRUD APIs

Standard REST patterns, async SQLAlchemy sessions via FastAPI dependency injection.

- `POST /projects`, `GET /projects`, `GET /projects/{id}`
- `POST /projects/{id}/parcels`, `GET /parcels/{id}`
- `POST /parcels/{id}/landowners`
- `POST /cases` (auto-created when a parcel is added to an active project, or explicit creation endpoint)
- `GET /cases`, `GET /cases/{id}` — support filter query params: project_id, state, stage, officer_id
- Every mutating endpoint (POST/PATCH/DELETE) writes an audit_log row — build this habit in from the start rather than retrofitting.

## 8. Workflow engine

Do **not** pull in an external workflow/state-machine library — a plain enum + transition table is enough for a week-long build and is easier for teammates to read.

```python
STAGE_TRANSITIONS = {
    "notification": ["verification"],
    "verification": ["objection"],
    "objection": ["award", "verification"],  # objection upheld -> back to verification
    "award": ["compensation"],
    "compensation": ["possession"],
    "possession": [],  # terminal
}
```

- One function: `transition_case(case_id, new_stage, actor_id)` — validates the transition is legal per the table above, updates `cases.current_stage`, inserts a `case_stage_history` row, and writes the audit log row. This function is the single place stage changes happen — every other phase (frontend, AI pipeline) calls into this, never updates `cases.current_stage` directly.
- Endpoint: `POST /cases/{id}/transition` with body `{ "new_stage": "...", "reason": "..." }`.

## 9. Synthetic data generator (base version)

Build a script `scripts/seed_data.py`:
- Generate one demo project ("Pune Ring Road" or similar), with real OSM-derived parcel polygons (fetch a real stretch of road boundary from OpenStreetMap and split it into N polygons — this is legitimate, OSM data is open-licensed, and it looks far more credible than hand-drawn placeholder shapes)
- Generate ~20-50 landowners across those parcels using Faker
- Generate cases at varying stages (don't put everything at "Notification" — you want a demo that already shows variety across the timeline)
- Generate a handful of documents and grievances at different statuses

**Hand-off note to Phase 3 (AI/ML):** this script needs to be extended later to also generate a larger synthetic *historical* case-duration dataset for ML training — keep the generator modular (a function per entity type) so that's a clean addition, not a rewrite.

## 10. Exit criteria for this phase

Before other phases (frontend, AI/ML, interop) can fully build against you:
- [ ] All 5 roles can register/login, JWT works, RBAC rejects wrong-role access on at least one test endpoint
- [ ] Full CRUD for projects/parcels/landowners/cases works and is documented in the auto-generated Swagger UI
- [ ] A case can be moved through all 6 workflow stages via the transition endpoint, and `case_stage_history` + `audit_log` both populate correctly
- [ ] Demo project is seeded with realistic OSM-based parcel geometry
- [ ] Backend is deployed (even a bare-bones version) to Render/Railway so Phase 5 doesn't discover deployment problems late

## 11. What NOT to build in this phase

- Document/grievance AI logic (Phase 3)
- ML prediction endpoints (Phase 3)
- Real-time push (Phase 4)
- Mock API Setu stubs (Phase 4)
- Any frontend code (Phase 2)
