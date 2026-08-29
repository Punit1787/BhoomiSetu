# BhoomiSetu

BhoomiSetu is a prototype land-acquisition case management system for SIH26016.
It is designed as an orchestration layer over existing government systems, not as
a replacement for them.

## First goal

Build one reliable demonstration:

1. A user opens the application.
2. A citizen views a seeded land-acquisition case.
3. An officer advances the case to the next legal stage.
4. The citizen view shows the new status.

Everything else is added only after this path works.

## What is in this repository?

- `apps/backend`: Python/FastAPI application and tests.
- `apps/frontend`: Next.js/TypeScript web application.
- `docs/original-plan`: the six planning files supplied at project start.
- `docs/product`: the current, simplified product scope.
- `docs/architecture`: technical boundaries and decisions.
- `docs/status/current.md`: the short handoff future Codex tasks should read.
- `infra`: deployment and local infrastructure files (added later).

## What works today?

This first setup provides a backend health endpoint and a frontend welcome page.
It deliberately does not yet contain authentication, a database, or real case
management. See `docs/status/current.md` for the next task.

## Local setup

You need Node.js 20+, Python 3.13, Git, PostgreSQL 17, and PostGIS. They are
installed on this Mac. Supabase is not required for local Phase 1 development.

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
