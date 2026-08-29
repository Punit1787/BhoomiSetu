# System architecture

## Components

- **Web application:** one Next.js application with role-aware routes and shared UI.
- **Application API:** one FastAPI service containing authentication, cases, workflow,
  documents, grievances, reporting, and integration adapters.
- **Database:** PostgreSQL with PostGIS when parcel geometry is introduced.
- **File storage and realtime:** Supabase is the planned provider, introduced only
  after the first local vertical slice works.

## Dependency direction

```text
Browser -> Next.js web app -> FastAPI -> services -> database
                                      -> external adapters
```

HTTP route handlers validate requests and call services. Services contain business
rules. Database models store state. External integrations sit behind adapters so a
fixture can be replaced without changing the rest of the application.

## Important invariants

1. A case stage changes only through the workflow service.
2. Every successful transition creates a history record in the same transaction.
3. Role checks happen on the server, even if the frontend hides an action.
4. AI output is untrusted until a human confirms it.
5. Demo fixtures are visibly labelled as fixtures.

## Planned case stages

```text
notification -> verification -> objection -> award -> compensation -> possession
```

The permitted return from `objection` to `verification` will be handled by the
workflow transition table rather than scattered conditional statements.

