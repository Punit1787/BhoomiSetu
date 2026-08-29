# Decision 0001: Build a vertical slice first

## Status

Accepted.

## Decision

Build login, a seeded case, a citizen timeline, and an officer transition before
developing the complete feature list.

## Why

The original plan separates work by technical phase. That is useful for ownership
but risks producing several incomplete subsystems. A vertical slice proves that the
frontend, API, data model, authorization, and workflow agree while changes are still
cheap.

## Consequence

Maps, document AI, predictive models, realtime delivery, and API Setu fixtures are
deferred until the basic case journey passes tests.

