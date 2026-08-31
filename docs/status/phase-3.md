# Phase 3 — AI, ML and GIS status

Status: complete and locally verified.

## Delivered

- Vision-LLM-first document extraction with a strict JSON schema when `OPENAI_API_KEY` is configured.
- Automatic Tesseract OCR fallback with English, Marathi and Hindi language packs installed locally.
- Real PNG land-record test fixture extracting owner, survey number, area, date and document type.
- Required officer confirmation/correction endpoint before a document becomes verified.
- Structured grievance classification for category, priority and department, followed by required human routing confirmation.
- Two offline Random Forest models trained on 1,800 reproducible synthetic historical cases:
  - days remaining / case delay risk;
  - compensation disbursal timeline.
- Serialized joblib model bundles with model version, preprocessing, feature names and feature importances.
- Per-case prediction endpoints return days, risk band and the top three features.
- Filterable aggregate prediction endpoint for district/senior dashboards.
- PostGIS `ST_Intersects` endpoint returning parcel GeoJSON.
- Deployment image retrains deterministic model artifacts during the build, so ignored binary files do not need to live in Git.

## Verification

- Ruff — pass.
- Full backend suite — 16 tests pass.
- OCR fallback — verified against a generated scan-like PNG, not a hard-coded service response.
- Both serialized model endpoints — verified against a real seeded PostgreSQL case.
- Aggregate model output — verified.
- PostGIS intersection — verified against an actual stored parcel polygon.

## Responsible scope decision

BhoomiSetu predicts how long compensation disbursal may take, not how much compensation should be. Compensation amount is a statutory RFCTLARR calculation; a government platform should not let a machine-learning model guess it.
