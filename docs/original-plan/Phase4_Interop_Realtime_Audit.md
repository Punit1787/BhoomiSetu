# Phase 4 — Interoperability Layer, Real-Time, Audit Trail
### BhoomiSetu (SIH26016) — Standalone phase doc

**Context if you're a fresh Claude chat reading only this file:** BhoomiSetu is a Land Acquisition & Management System for SIH26016, positioned as an orchestration/interoperability layer over existing government systems (BhoomiRashi/DILRMP/state portals), not a replacement. Backend is FastAPI + PostgreSQL/PostGIS via Supabase (Phase 1). This phase owns three cross-cutting concerns: the mock government-API integration layer, real-time push infrastructure, and the tamper-evident audit log.

---

## 1. Scope of this phase

- Mock API Setu-shaped integration endpoints
- Supabase Realtime configuration (server side)
- Audit log service (hash-chaining logic — other phases call into it, you own the mechanism)

## 2. On API Setu — what you're actually building and why

**API Setu** (apisetu.gov.in) is a real, currently-operating Open API platform run by NeGD under MeitY, Government of India. It hosts genuine land-record APIs from states — Karnataka (`landrecordskar`), Goa, Telangana Registration & Stamps, and NGDRS (National Generic Document Registration System). This is not a fictional or defunct system — verify it yourself at apisetu.gov.in and directory.apisetu.gov.in if you want to see the real listings.

**Why you're not getting real access this week:** access requires consumer registration on API Setu, then subscription, then **publisher approval** — a real onboarding workflow meant for verified government/institutional consumers, not achievable by a student team in a week.

**What you're building instead:** a stub layer in your own backend that mimics the *shape* of a real API Setu response, so the integration pattern is demonstrably real and callable live, even though the actual data is fixture data.

### 2.1 Implementation

- Build 2-3 FastAPI routes under `/integrations/apisetu/...`, e.g.:
  - `GET /integrations/apisetu/land-records/{khasra_id}` → returns a fixture JSON response shaped like a real state land-record lookup (owner name, khasra/survey number, area, land-use classification, encumbrance status) — structure this to plausibly resemble what NGDRS or a state land-records API would return
  - Optionally a second stub for a different data shape (e.g. registration/deed lookup) if time allows — one clean example is enough for MVP, a second is a nice-to-have
- These routes should have a small, deliberate artificial delay (e.g. 300-800ms) to look like a real external API call rather than an instant local lookup — this is a small, honest touch that makes the live demo read correctly
- Document these stub endpoints clearly in code comments and in your pitch materials as **fixtures, not real government data** — you never want to accidentally imply live government data in the demo

### 2.2 What to say to judges (coordinate with the presenter doing Q&A prep)

*"BhoomiSetu is designed to consume land-record and registration data through API Setu — the Government of India's own Open API platform, run by NeGD under MeitY. For this prototype we've stubbed those calls with a fixture layer matching the real API Setu response shape, since production access requires formal consumer registration and publisher approval that isn't achievable in a week-long build. In a production deployment, this would go through official consumer onboarding on apisetu.gov.in."*

### 2.3 Where it's called from

Phase 2 (frontend) builds a visible "Check land record" button/panel in the Project Authority portal that calls this stub live during the demo — this is what proves the interoperability-first architecture claim isn't just slideware.

## 3. Real-time updates (server side)

- **Use Supabase Realtime** (Postgres change-data-capture over WebSocket) — do not build a custom WebSocket + Redis pub/sub layer unless Supabase Realtime demonstrably fails for your use case. It's extra infrastructure with no payoff for a week-long build.
- Enable Realtime on the `cases` table (and optionally `documents`, `grievances`) in the Supabase dashboard or via SQL:
  ```sql
  alter publication supabase_realtime add table cases;
  ```
- No custom backend code needed beyond ensuring Phase 1's workflow engine writes clean, complete updates to the `cases` row on every transition (it already does, per Phase 1's exit criteria) — Supabase picks up the change automatically.
- Coordinate with Phase 2 on the exact row shape they need to receive so client-side cache invalidation (TanStack Query) works cleanly.

### 3.1 Testing this properly

Before final rehearsal, test the full loop with two browser windows side by side: Officer approves a document in one window, Citizen dashboard in the other window updates without a manual refresh. This exact sequence is one of your best live-demo moments — don't leave it untested until the last day.

## 4. Audit log service

- **Table:** `audit_log` (id, user_id FK, action, prev_hash, row_hash, created_at) — schema owned by Phase 1, but the *hash-chaining logic* is yours to design and hand back as a shared utility function.
- **Mechanism:** each new row's `row_hash` = `hash(prev_hash + action + user_id + timestamp)`. This is a simple hash chain, not a real blockchain — say this explicitly in the pitch ("tamper-evident audit log," not "blockchain") to avoid overclaiming.
- **Implementation:** a single utility function, e.g. `write_audit_log(db_session, user_id, action) -> None`, that:
  1. Fetches the most recent `row_hash` from the table (or a genesis value if empty)
  2. Computes the new row's hash
  3. Inserts the row
- **Every mutating endpoint across every phase calls this function.** Phase 1's CRUD endpoints, Phase 3's document/grievance actions, the workflow transition function — all of them. Ship this utility early (even a rough version) so other phases can integrate it as they build, rather than retrofitting audit logging everywhere at the end.
- **Verification endpoint (nice-to-have, 🟡):** `GET /audit-log/verify` — walks the chain and confirms no row's hash has been tampered with. This is a strong, cheap thing to show live if a judge asks "how do you know this hasn't been tampered with" — but it's not MVP-blocking if you run out of time.

### 4.1 Audit log viewer

Phase 2 builds the UI; you provide `GET /audit-log?case_id=...&user_id=...&action=...` with filtering support.

## 5. Exit criteria for this phase

- [ ] Mock API Setu stub endpoints return realistic, clearly-fixture-labeled responses with a small artificial delay
- [ ] Supabase Realtime is enabled on the `cases` table and verified working end-to-end with two browser windows
- [ ] `write_audit_log` utility exists, is documented, and is called from at least Phase 1's core mutating endpoints (coordinate with other phases to ensure they adopt it too)
- [ ] Audit log filtering endpoint works for the viewer UI

## 6. What NOT to build in this phase

- Real API Setu registration/access (explicitly out of scope for this build — see Section 2)
- The core CRUD/workflow logic itself (Phase 1 — you hook into it, don't own it)
- Frontend components (Phase 2 — you provide the endpoints/config they consume)
- ML/AI logic (Phase 3)
