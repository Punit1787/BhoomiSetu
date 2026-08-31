# Phase 4 — Interoperability, realtime and audit status

Status: implementation and local verification complete; hosted Supabase activation pending credentials/project.

## Delivered

- API Setu-shaped land-record and NGDRS deed endpoints.
- Every response is explicitly labelled `is_fixture: true` and “not live government data.”
- Deterministic, plausible fixture fields and deliberate 400–550 ms external-service latency.
- Project Authority portal calls the lookup interaction and displays the fixture disclosure beside the result.
- Supabase Realtime client subscription invalidates TanStack case caches on `cases` changes.
- Supabase SQL activation script covers `cases`, `documents` and `grievances`.
- Concurrency-safe SHA-256 audit-chain writer remains integrated across Phase 1 and Phase 3 mutations.
- Admin audit endpoint filters by case, user and action.
- Full-chain verification endpoint recomputes every row and validates every previous-hash link.

## Verification

- Backend Ruff — pass.
- Full backend suite — 17 tests pass.
- API Setu fixture latency/disclosure — verified.
- Audit action filter — verified against a newly created project.
- Complete accumulated audit chain — valid.
- Frontend lint/test/production build — pass.
- Browser interaction — authority lookup returned the fixture and visible disclosure correctly.

## Hosted realtime activation

Run [`infra/supabase/realtime.sql`](../../infra/supabase/realtime.sql) in the linked Supabase project and set `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_ANON_KEY`. A hosted Supabase project is not currently linked, so the final two-window hosted change-data-capture test remains an external deployment task rather than a locally verified claim.
