# Phase 1 status

## Completed locally

- Monorepo and Git repository
- PostgreSQL 17 and PostGIS 3.6 installation
- Local `bhoomsetu` and isolated `bhoomsetu_test` databases
- Async SQLAlchemy models for all Phase 1 tables
- Alembic initial migration
- JWT access and refresh tokens with Argon2 password hashing
- Registration/login for all five roles
- Backend-enforced RBAC
- Project, parcel, landowner, and case APIs
- PostGIS polygon storage and GeoJSON retrieval
- Six-stage workflow service, stage history, and illegal-transition validation
- Hash-chained audit writes with concurrency protection
- Idempotent seed script with five accounts and twenty varied cases
- Backend linting and fourteen automated tests
- CI workflow backed by an isolated PostGIS service
- FastAPI-generated Swagger/OpenAPI documentation

## Intentionally local

- Demo parcel boundaries and citizens are synthetic.
- Supabase is deferred; local PostgreSQL provides the same Phase 1 database behavior.
- Public deployment requires selecting and signing into Render, Railway, or another host.

## Phase 1 exit checklist

- [x] Five roles can register/login and receive JWTs.
- [x] RBAC rejects a wrong-role request in an automated test.
- [x] CRUD exists for projects, parcels, landowners, and cases.
- [x] Swagger/OpenAPI documents the API.
- [x] A case moves through all six stages.
- [x] Stage history and audit records populate.
- [x] Twenty realistic synthetic parcel geometries are seeded near Pune.
- [ ] Backend is publicly deployed (external account/hosting decision required).

