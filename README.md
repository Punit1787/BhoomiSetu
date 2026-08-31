# BhoomiSetu

BhoomiSetu is a prototype land-acquisition case management system for SIH26016.
It is designed as an orchestration layer over existing government systems, not as
a replacement for them.

## Current result

All five planned implementation phases are complete locally: foundation, five role portals, AI/ML/GIS, interoperability/realtime/audit, and demo operations. Public hosting is deployment-ready but blocked by the signed-in Railway account’s expired trial.

## What is in this repository?

- `apps/backend`: Python/FastAPI application and tests.
- `apps/frontend`: Next.js/TypeScript web application.
- `docs/original-plan`: the six planning files supplied at project start.
- `docs/product`: the current, simplified product scope.
- `docs/architecture`: technical boundaries and decisions.
- `docs/status/current.md`: the short handoff future Codex tasks should read.
- `infra`: Supabase realtime and deployment infrastructure.
- `scripts`: one-command demo reset and offline launch.
- `docs/pitch`: editable final pitch deck.

## What works today?

The application includes five-role JWT/RBAC, a six-stage acquisition workflow,
20 OSM-derived PostGIS parcels, five polished portals, document OCR/AI hooks,
grievance routing, two predictive timeline models, API Setu-shaped fixtures,
realtime client wiring and a verifiable tamper-evident audit chain.

## Local setup

You need Node.js 20+, Python 3.13, Git, PostgreSQL 17, and PostGIS. They are
installed on this Mac. Supabase is not required for local Phase 1 development.

### Fastest offline demo

```bash
./scripts/start_demo.sh
```

This migrates and seeds the database, retrains both deterministic models, builds
the production frontend, and launches the API and web app. Press `Ctrl+C` once
to stop both services. Use `./scripts/reset_demo.sh` when you only need a clean
demo state.

### Run the backend

```bash
cd apps/backend
/Library/Frameworks/Python.framework/Versions/3.13/bin/python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed_data
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/health`. You should see `{"status":"ok"}`.
Interactive API documentation is at `http://localhost:8000/docs`.

### Demo accounts

All local demo accounts use password `DemoPass123!`:

- `citizen@bhoomsetu.local`
- `officer@bhoomsetu.local`
- `authority@bhoomsetu.local`
- `district@bhoomsetu.local`
- `senior@bhoomsetu.local`

These accounts and all parcel/ownership information are synthetic.

### Run the frontend

In a second terminal:

```bash
cd apps/frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Safe working rules

- Never commit `.env` files, passwords, access tokens, or real citizen data.
- Use generated demo data only.
- Do not claim fixture integrations or synthetic ML results are production data.
- Run the relevant tests before considering a coding task complete.
