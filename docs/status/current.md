# Current status — resume here

Updated: 2026-09-01 Asia/Kolkata

## Completed

- Phases 1–5 remain implemented and verified.
- Private GitHub repository created and `main` pushed to
  `https://github.com/Punit1787/BhoomiSetu`.
- Supabase Free organization and project created. Project ref:
  `adwmdfytfvwdqifruitd`; PostGIS was enabled successfully in its SQL editor.
- Frontend retains the reactive workspace clock/status strip, strong focus states
  and reduced-motion support from the earlier interaction pass.
- Landing and login copy now distinguish live-ready functionality from demo data.
- Honest real-vs-simulated inventory saved in `docs/integration-matrix.md`.
- Official internal evaluation sheet reviewed. Conservative readiness is 31.3/40
  (78%); weighted remaining work is 22%. Full breakdown is in
  `docs/evaluation-readiness.md`.
- Gradient-heavy visual effects were superseded by a crisp reference-led system:
  flat black navigation, white/soft-gray work surfaces, one cobalt accent, thin
  borders, restrained mobile-only depth and no decorative glows/orbs.

## Verification

- Frontend lint passed after the overhaul.
- Component test passed after updating the intentional landing-copy assertion.
- TypeScript and the optimized Next.js production build passed.
- Live browser QA passed at 1440×900 desktop and 390×844 mobile. The landing
  layout is responsive, readable and visually consistent with the supplied refs.
- Earlier baseline: 17 backend tests, Ruff, frontend build, browser QA and offline
  production start all passed.

## Exact next actions

1. Inspect the authenticated authority and officer workflows once public hosting
   is available and capture evaluation evidence screenshots.
2. Resume hosting: Render backend first, then set Supabase connection/realtime,
   then Vercel frontend. Browser navigation to Render was blocked only because
   the Codex browser-control usage allowance was exhausted, not by the project.
3. After backend migrations create `cases`, `documents` and `grievances`, run
   `infra/supabase/realtime.sql` and perform a two-window change test.

## Secrets and blockers

- Never commit the Supabase database password, JWT secrets, OpenAI key, service
  role key or deployment tokens.
- Railway remains unavailable because its account trial expired. No billing was
  enabled. Render Free is the selected backend alternative.
- API Setu/NGDRS data is intentionally fixture-only until official publisher
  approval is granted.
- Crisp redesign/evaluation checkpoint is local commit `a0baa62`. Pushing this
  checkpoint to the private GitHub remote requires explicit user approval because
  it includes an evaluation-derived readiness document. `origin/main` still ends
  at the earlier pushed checkpoint.
