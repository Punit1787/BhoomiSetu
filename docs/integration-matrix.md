# BhoomiSetu integration matrix

This is the honest source-of-truth for what is live, local, simulated, or gated.

| Capability | Technology or provider | Current mode | Real or simulated? | Production path |
|---|---|---|---|---|
| Web application | Next.js 16, React 19, TypeScript | Running locally | Real | Deploy the same build to Vercel or Render |
| Backend API | FastAPI, Pydantic, SQLAlchemy async | Running locally with tested routes | Real | Deploy the Docker image to Render |
| Database | PostgreSQL 17 + PostGIS | Local database and a hosted Supabase project | Real | Point `DATABASE_URL` at Supabase and run Alembic |
| Hosted database project | Supabase project `adwmdfytfvwdqifruitd` | Created; PostGIS enabled | Real | Add deployment secrets, migrate, seed, then enable publications |
| Realtime updates | Supabase Realtime + TanStack Query invalidation | Client and SQL prepared; hosted tables not migrated yet | Real code, activation pending | Run migrations, then `infra/supabase/realtime.sql` |
| Parcel map | Leaflet + OpenStreetMap tiles | Active | Real software and real OSM basemap | Keep attribution and optionally use a managed OSM tile provider at scale |
| Parcel geometry | PostGIS polygons derived from OSM Kharadi Bypass | Seeded demo geometry | Real geometry engine; synthetic parcel boundaries | Replace with authenticated cadastral survey geometry |
| Authentication | JWT access/refresh tokens, Argon2, five-role RBAC | Active | Real | Rotate strong deployment secrets and add government identity/SSO if available |
| Workflow and audit | Six-stage workflow service + hash-chained audit records | Active and tested | Real | Add external timestamping/signing for stronger non-repudiation |
| Document extraction | OpenAI vision adapter with strict JSON schema | Used only when `OPENAI_API_KEY` is supplied | Real integration path, currently unconfigured | Add an approved OpenAI API key in the backend secret manager |
| OCR fallback | Tesseract with English, Hindi and Marathi packs | Installed and tested locally | Real and offline | Keep as resilience fallback |
| Grievance classification | LLM adapter with human confirmation | Falls back without an LLM key | Real integration path; demo result may be fallback | Configure an approved LLM key; keep mandatory human confirmation |
| Delay and timeline models | scikit-learn Random Forest | Trained and serialized | Real model, synthetic training data | Retrain on de-identified, approved historical cases and validate bias/accuracy |
| API Setu land records | FastAPI adapter matching API Setu/state shapes | Clearly labelled fixture response | Simulated data | Register as an API Setu consumer, subscribe, and obtain publisher approval |
| NGDRS deed lookup | FastAPI adapter matching NGDRS shape | Clearly labelled fixture response | Simulated data | Obtain official institutional access and map the provider response into the adapter |
| Demo users, cases and metrics | Deterministic seed data + Faker | Demo mode | Simulated | Replace only with consented or legally authorized records; never use real citizen data in demos |
| Backend hosting | Railway was attempted | Blocked by expired Railway trial | Not deployed | Use Render Free or activate a paid Railway plan |
| Source control | Private GitHub repository `Punit1787/BhoomiSetu` | Pushed and tracking `main` | Real | Keep secrets out of Git and use protected deployment variables |

## Why API Setu remains a fixture

API Setu is a real Government of India platform, but the relevant land-record
publishers require consumer registration, subscription and publisher approval.
There is no honest anonymous switch that makes those records live. BhoomiSetu's
adapter isolates the fixture so approved credentials can replace it without
changing the portal or the rest of the backend.

## Safe next upgrades

1. Complete Supabase migration and realtime publication.
2. Deploy FastAPI to Render and Next.js to Vercel.
3. Add an approved OpenAI API key if live vision extraction is needed.
4. Apply for API Setu publisher access; keep the fixture disclosure until access
   is actually granted.
5. Retrain procedural models only on approved, de-identified historical data.
