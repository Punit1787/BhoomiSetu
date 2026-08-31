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

## Railway

`railway.toml` and `apps/backend/Dockerfile` contain the build and health-check
configuration. Deployment still requires an authenticated Railway account and a
PostgreSQL service with PostGIS enabled.

## Verification

After deployment, verify:

1. `/health` returns HTTP 200.
2. `/openapi.json` exposes the expected API paths.
3. Alembic reports the latest revision.
4. A seeded officer can log in.
5. The frontend origin is allowed by CORS.

