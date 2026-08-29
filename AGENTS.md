# Codex project guidance

## Product

BhoomiSetu is an SIH26016 prototype for managing the land-acquisition lifecycle.
It is an interoperability/orchestration layer, not a replacement for existing
government land-record systems.

The first milestone is the narrow vertical slice described in `README.md` and
`docs/product/mvp-scope.md`. Prefer completing and verifying that path over
starting secondary features.

## Read only what the task needs

Always read `docs/status/current.md`. Read the relevant file under
`docs/architecture` or `docs/original-plan` only when the task needs it. Do not
load all six original planning documents by default.

## Repository boundaries

- Backend code lives in `apps/backend`.
- Frontend code lives in `apps/frontend`.
- Shared product decisions live in `docs/architecture/decisions`.
- Keep HTTP handlers thin; business rules belong in backend services.
- Case stages may only change through the workflow service.
- Use one frontend application with role-specific views, not five applications.

## Required verification

- Backend change: run `pytest` and `ruff check .` from `apps/backend`.
- Frontend change: run `npm run lint` and `npm test` from `apps/frontend`.
- Cross-stack change: run checks for both applications.
- State clearly when checks cannot run because dependencies or services are absent.

## Safety and honesty

- Never commit secrets or real personal/citizen data.
- Use synthetic demo data.
- Label API Setu responses as fixtures until official access exists.
- Label ML trained on synthetic data as prototype analytics; do not claim real accuracy.
- Do not make legal, ownership, valuation, or compensation decisions with AI.
- Do not deploy, purchase services, or create external accounts without user approval.

## Keep context efficient

After meaningful work, replace the contents of `docs/status/current.md` with a
short factual handoff: completed, verified, next task, and known blockers. Do not
turn it into a diary.

