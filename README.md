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
- Recorded compensation/R&R, family counts, eight KPI groups and comparative dashboards
- Filtered MIS reports with selectable columns, CSV export and browser print/PDF
- Rule-based inbox alerts, recorded deadline monitoring and per-user read receipts
- English, Hindi, Marathi, Gujarati and Kannada labels; browser read-aloud for citizens
- Standard master data, document validation and hash-chained audit logs
- API Setu/NGDRS-shaped fixtures, responsive role workspaces and automated CI

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
PostgreSQL + PostGIS on Render ── 30-second UI refresh
```

The backend is hosted on Render; the frontend is hosted on Vercel. Detailed
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
| `docs/deployment.md` | Render/Vercel deployment and keepalive limits |
| `docs/pitch` | Editable SIH presentation |

## Deployment

[Open the frontend](https://bhoomi-setu-steel.vercel.app) ·
[API health](https://bhoomsetu-api.onrender.com/health).

Render uses `render.yaml`; Vercel builds `apps/frontend`. Store all secrets in
provider environment settings. Never commit `.env` files. Full instructions are in
[`docs/deployment.md`](docs/deployment.md).

## Design reference

The interface adapts the user-provided [landbridge-pro](https://github.com/abdullahkabadi7-lab/landbridge-pro)
design (revision `88504a9`), including its landscape asset, to the existing Next.js
application and real BhoomiSetu APIs. Reference mock authentication/data is not used.

## License and data

This repository is an SIH prototype. OpenStreetMap-derived geometry must retain
OpenStreetMap attribution. Government adapter fixtures and synthetic data must not
be presented as live government records.
