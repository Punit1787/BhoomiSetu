# Deployment

## Backend requirements

The backend container runs the latest Alembic migration before starting FastAPI.
The host must provide:

- `DATABASE_URL` using the `postgresql+asyncpg://` driver form
- `JWT_SECRET` with a long random value
- `JWT_REFRESH_SECRET` with a different long random value
- `APP_ENVIRONMENT=production`
- `FRONTEND_ORIGIN` set to the deployed frontend origin

PostGIS must be enabled once in the hosted database:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Render (selected backend host)

The root [`render.yaml`](../render.yaml) defines a free Docker web service,
generated JWT secrets, the `/health` probe and prompts for the Supabase database
URL and final frontend origin. Import the private Git repository as a Render
Blueprint. Do not put either prompted value in Git.

The Supabase connection string must use SQLAlchemy's async driver form. Convert
the provider URL prefix from `postgresql://` to `postgresql+asyncpg://` without
changing the remaining credentials or query parameters.

## Vercel frontend

Import the same Git repository as a Vercel project and set its Root Directory to
`apps/frontend`. Configure these deployment variables:

- `NEXT_PUBLIC_API_BASE_URL` — the Render `https://...onrender.com` origin;
- `NEXT_PUBLIC_SUPABASE_URL` — the hosted Supabase project URL;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the public anonymous key, never the service-role key.

After Vercel assigns the production URL, set Render's `FRONTEND_ORIGIN` to that
exact origin and redeploy the backend so CORS permits the frontend.

## Railway (inactive alternative)

`railway.toml` remains as an alternative, but the current account trial is
expired. Render is the selected path.

## Verification

After deployment, verify:

1. `/health` returns HTTP 200.
2. `/openapi.json` exposes the expected API paths.
3. Alembic reports the latest revision.
4. A seeded officer can log in.
5. The frontend origin is allowed by CORS.
