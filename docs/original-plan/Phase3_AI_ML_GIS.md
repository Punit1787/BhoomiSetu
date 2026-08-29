# Phase 3 — AI Pipeline, Predictive ML, GIS/PostGIS
### BhoomiSetu (SIH26016) — Standalone phase doc

**Context if you're a fresh Claude chat reading only this file:** BhoomiSetu is a Land Acquisition & Management System for SIH26016. Backend is FastAPI + PostgreSQL/PostGIS (Phase 1). This phase owns everything "intelligent": document field extraction, grievance classification, predictive analytics (delay-risk and compensation-disbursal-timeline — explicitly NOT land-price/valuation, see Section 4 for why), and the PostGIS spatial query layer.

---

## 1. Scope of this phase

- Document AI extraction (vision LLM, structured output)
- Grievance AI classification
- Human-confirmation endpoints for both
- Predictive ML: delay-risk model + compensation-disbursal-timeline model
- PostGIS spatial query support (backend side — frontend Leaflet work is Phase 2)
- Extending the synthetic data generator for ML training data

## 2. Tech stack for this phase

| Tool | Purpose |
|---|---|
| Vision-capable LLM API (Claude/GPT-4o-class) | Document field extraction, grievance classification |
| Tesseract OCR | Documented fallback for document extraction, not primary path |
| scikit-learn | RandomForestRegressor / GradientBoostingRegressor for prediction |
| joblib | Model serialization |
| pandas / numpy | Feature engineering for ML training |
| PostGIS (via Phase 1's Postgres) | Spatial queries |
| Faker | Extending Phase 1's synthetic data generator |

## 3. Document extraction pipeline

1. **Endpoint:** `POST /documents/{id}/extract` (or triggered automatically on upload — coordinate with Phase 1/2 on which)
2. **Prompt design:** send the document image/PDF to a vision-capable LLM with a **strict JSON schema** for the expected output (e.g. name, khasra number, area, document type, date). Do not accept free-text output — force structured JSON.
3. **Test against one real sample document first** before wiring up the confirmation UI around it — validate the extraction actually works on messy/real-world-ish scans before building anything downstream.
4. **Fallback:** Tesseract OCR path, documented as a fallback if the LLM call fails or is unavailable — this doesn't need to be a great fallback, just a documented one, so you can honestly say "AI extraction has a fallback path" without over-building it.
5. **Human confirmation is not optional** — write the extracted fields to `documents.extracted_fields` (JSONB) and require an officer confirm/correct action (Phase 2 builds the UI, Phase 1 owns the underlying document table, you own the extraction call and confirmation endpoint) before the document is marked "verified."

## 4. Grievance classification pipeline

1. **Endpoint:** `POST /grievances/{id}/classify` (or triggered on submission)
2. Same pattern as document extraction: LLM prompt with strict JSON schema output — category, priority, suggested department
3. Human-confirms/routes before it's actioned — same discipline as documents

## 5. Predictive ML — full design

### 5.1 Scope decision — read this before building anything

The problem statement's Expected Solution asks for **"predictive analytics to support policy formulation and efficient project execution"** — it never mentions land price, valuation, or market value. Build predictive models for **procedural/timeline outcomes**, not land pricing or compensation amounts:

- **Do build:** delay-risk prediction, compensation-disbursal-timeline prediction
- **Do NOT build:** land-price prediction, compensation-*amount* prediction — these need real market/registry data you don't have, and compensation amount is a statutory RFCTLARR calculation, not something an ML model should approximate on a government platform, even as a demo. If a judge asks about this, the team's answer is: *"We predict how long disbursal will take, not how much compensation should be — the amount is a statutory calculation, not something we'd want an ML model guessing for a government platform."*

### 5.2 Model 1 — Delay-risk / days-to-completion

**Target:** days remaining to possession (regression), or Low/Medium/High risk band (classification) if time is tight — classification is simpler to explain and slightly faster to build if you're behind schedule.

**Features:**
| Feature | Type | Source |
|---|---|---|
| Project type | categorical | `projects.type` |
| State/district | categorical | `projects.state` / `district` |
| Number of parcels in case | numeric | derived |
| Current stage | categorical | `cases.current_stage` |
| Number of objections raised | numeric | derived from `case_stage_history` |
| Document verification turnaround so far | numeric (days) | derived from `documents` timestamps |
| Officer's current open-case load | numeric | derived |

### 5.3 Model 2 — Compensation-disbursal-timeline

**Target:** days estimated for a case to move from "Assessed" to "Disbursed" (or risk band of delay in that specific transition)

**Features:** same base feature set as Model 1, plus time-already-spent-in-Compensation-stage and objection history specifically around the Award/Compensation stages.

Both models share most of their feature engineering — build one shared feature-extraction function, then train two separate models on top of it. This keeps the actual incremental work small (roughly a half-day once the first model's pipeline exists).

### 5.4 Training data

Extend Phase 1's `scripts/seed_data.py` to also generate a **larger synthetic historical dataset** — a few hundred to a couple thousand rows of "completed" or "in-progress" cases with plausible stage durations, objection counts, etc. Keep durations realistic relative to RFCTLARR-typical timelines (don't invent implausibly fast or slow numbers — a quick web search on typical land acquisition timelines in India will keep this grounded).

### 5.5 Training & serving

- Train **once, offline**, as a standalone script (e.g. `scripts/train_models.py`) — not a live/on-demand training pipeline. Do not retrain in real time.
- Serialize both models with `joblib` (`delay_model.pkl`, `compensation_timeline_model.pkl`)
- Load both into FastAPI at startup (module-level load, not per-request)
- Endpoints:
  - `GET /cases/{id}/prediction/delay` → `{ predicted_days_remaining, risk_band, top_features: [...] }`
  - `GET /cases/{id}/prediction/compensation-timeline` → same shape
- **Always return feature importances** (top 2-3 contributing features) alongside the prediction number — this is what makes it read as real ML to judges rather than a black-box guess. Use `.feature_importances_` from the trained model (works natively for RandomForest/GradientBoosting).

### 5.6 Aggregation endpoint (for Senior/Admin dashboard)

`GET /predictions/aggregate?state=...&project_type=...` → returns something like `{ high_risk_pct: 38, avg_disbursal_days: 145, trend: "up" }` — computed by running the model over all matching cases and summarizing. This is what powers the "38% of Maharashtra highway cases are at high delay risk" dashboard line.

### 5.7 Effort estimate

Both models together, given shared feature engineering: roughly one day for one person. Fold into your workload alongside document/grievance AI work — not a separate phase in the team's calendar, just a distinct section of this doc.

## 6. PostGIS spatial queries (backend side)

- Beyond storing polygons (Phase 1's job), you own any actual spatial *query* logic:
  - "which parcels intersect this project boundary" — `ST_Intersects`
  - Converting stored geometry to GeoJSON for the frontend map — `ST_AsGeoJSON`
- This is 🟡 secondary-tier polish (a nice technical flex for judge Q&A) — don't let it block the MVP predictive/AI work above.

## 7. Exit criteria for this phase

- [ ] Document extraction works end-to-end against at least one real sample document, with a documented OCR fallback
- [ ] Grievance classification works end-to-end
- [ ] Both ML models trained on synthetic data, serialized, loaded, and serving predictions with feature importances
- [ ] Aggregate prediction endpoint works for the Senior dashboard
- [ ] You can answer "why not land price?" with the Section 5.1 line without hesitation

## 8. What NOT to build in this phase

- Any frontend UI (Phase 2 — you only own the model/AI call and its endpoint)
- The workflow state machine itself (Phase 1 — you call into it, don't own it)
- Real-time push mechanics (Phase 4)
- Mock API Setu stubs (Phase 4 — different from your AI/ML work even though both are "external-looking" integrations)
