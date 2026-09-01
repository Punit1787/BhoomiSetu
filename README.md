# BhoomiSetu

**Transparent, GIS-enabled land-acquisition workflow orchestration for SIH26016.**

BhoomiSetu connects landowners, field officers, project authorities and government
administrators around one auditable six-stage acquisition journey. It complements
existing government systems through adapters; it does not replace statutory land
records or automate legal decisions.

## Showcase

- Five protected role portals with JWT refresh, RBAC and case-level access control
- Notification → verification → objection → award → compensation → possession
- PostGIS parcel storage and an interactive OpenStreetMap/Leaflet command view
- Image OCR with officer confirmation and optional OpenAI vision extraction
- Human-confirmed grievance classification and department routing
- Delay-risk and compensation-disbursal timeline models with visible limitations
- API Setu/NGDRS-shaped adapter fixtures, Supabase realtime wiring and hash-chained audit logs
- Responsive judge-ready UI, deterministic synthetic demo and automated CI

## Responsible-data statement

The demonstration contains **no real citizen or cadastral data**. It uses 20
synthetic parcel/case records positioned from an OpenStreetMap road trace and 1,800
reproducible synthetic histories for model training. The two Random Forest models
are functional pipeline prototypes, not production policy engines:

| Model | Synthetic 80/20 holdout MAE | R² | Production status |
|---|---:|---:|---|
| Acquisition days remaining | 12.92 days | 0.951 | Not validated on real records |
| Compensation-disbursal timeline | 5.83 days | 0.898 | Not validated on real records |

These metrics show fit to the synthetic generator only. BhoomiSetu never predicts
land value, compensation amount, ownership, eligibility or legal outcomes. Real
deployment requires approved, de-identified authority histories and independent
temporal, district-level, fairness and drift validation. See the tracked
[`model_card.json`](apps/backend/scripts/data/model_card.json).

## Architecture

```text
Next.js 16 / TypeScript
        │ REST + JWT
FastAPI / Python 3.13 ── OCR + scikit-learn models
        │
PostgreSQL 17 + PostGIS ── optional Supabase realtime
```

The backend is containerized for Render; the frontend is ready for Vercel. Detailed
boundaries are in [`docs/architecture/system.md`](docs/architecture/system.md).

## Run locally

Install Git, Docker Desktop, Python 3.13 and Node.js 22, then:

```bash
git clone https://github.com/Punit1787/BhoomiSetu.git
cd BhoomiSetu
./scripts/bootstrap.sh
./scripts/start_demo.sh
```

Open `http://localhost:3000`; API documentation is at
`http://localhost:8000/docs`. All five synthetic accounts use `DemoPass123!`:

- `citizen@bhoomsetu.local`
- `officer@bhoomsetu.local`
- `authority@bhoomsetu.local`
- `district@bhoomsetu.local`
- `senior@bhoomsetu.local`

Run `./scripts/check.sh` before committing. `./scripts/reset_demo.sh` intentionally
clears demo interactions and restores the canonical showcase.

## Repository guide

| Path | Purpose |
|---|---|
| `apps/backend` | FastAPI APIs, models, migrations, training and tests |
| `apps/frontend` | Next.js portals and frontend tests |
| `infra/supabase` | Optional hosted realtime publication SQL |
| `scripts` | Bootstrap, verification, reset and offline demo commands |
| `docs/demo-script.md` | Presenter walkthrough |
| `docs/judge-qa.md` | Concise responsible-technology answers |
| `docs/integration-matrix.md` | Clear real/fixture/synthetic disclosure |
| `docs/team-setup.md` | Collaborator and secret-management workflow |
| `docs/deployment.md` | Render, Vercel and Supabase deployment |
| `docs/pitch` | Editable SIH presentation |

## Deployment

Import this private repository into Render using `render.yaml`, deploy the frontend
from `apps/frontend` on Vercel, and store all secrets in provider environment
settings. Never commit `.env` files. Full instructions are in
[`docs/deployment.md`](docs/deployment.md).

## License and data

This repository is an SIH prototype. OpenStreetMap-derived geometry must retain
OpenStreetMap attribution. Government adapter fixtures and synthetic data must not
be presented as live government records.
