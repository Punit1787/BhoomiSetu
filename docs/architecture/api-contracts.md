# API contracts

This document will become the shared agreement between frontend and backend.

## Available now

### `GET /health`

Response:

```json
{
  "status": "ok",
  "service": "bhoomsetu-api"
}
```

### Authentication

- `POST /auth/register` — create one of the five prototype roles.
- `POST /auth/login` — receive access and refresh tokens.
- `POST /auth/refresh` — exchange a valid refresh token.

Use the access token as `Authorization: Bearer <token>`.

### Projects and parcels

- `POST /projects`
- `GET /projects`
- `GET /projects/{project_id}`
- `POST /projects/{project_id}/parcels`
- `GET /parcels/{parcel_id}`
- `POST /parcels/{parcel_id}/landowners`

### Cases and workflow

- `POST /cases`
- `GET /cases` with `project_id`, `state`, `stage`, and `officer_id` filters.
- `GET /cases/{case_id}` including stage history.
- `POST /cases/{case_id}/transition`

Exact request and response schemas are always available in the live Swagger UI
at `/docs`; that generated contract is authoritative.
