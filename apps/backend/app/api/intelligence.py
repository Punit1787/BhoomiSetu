import json
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, UploadFile, status
from PIL import UnidentifiedImageError
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import AcquisitionCase, Document, Grievance, Parcel, Project, User
from app.models.enums import DocumentStatus, UserRole
from app.schemas.intelligence import (
    AggregatePredictionResponse,
    DocumentConfirmationRequest,
    DocumentExtractedFields,
    DocumentExtractionResponse,
    GrievanceConfirmationRequest,
    GrievanceCreateRequest,
    GrievanceResponse,
    PredictionResponse,
    SpatialParcelResponse,
)
from app.services.audit import write_audit_log
from app.services.case_access import accessible_case_or_404, scope_case_query
from app.services.document_ai import extract_document
from app.services.grievance_ai import classify_grievance
from app.services.master_data import DOCUMENT_TYPES, missing_document_fields, validate_survey_number
from app.services.predictive import predict

router = APIRouter(tags=["AI, predictions and GIS"])
OFFICER_ROLES = (
    UserRole.OFFICER,
    UserRole.PROJECT_AUTHORITY,
    UserRole.DISTRICT_ADMIN,
    UserRole.SENIOR_ADMIN,
)


@router.post(
    "/cases/{case_id}/documents",
    response_model=DocumentExtractionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_and_extract_document(
    case_id: uuid.UUID,
    file: UploadFile = File(...),
    document_type: str = Form(default="land_record"),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
) -> DocumentExtractionResponse:
    await accessible_case_or_404(db, case_id, actor, for_update=True)
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(422, "Choose a standard document type")
    if file.content_type not in {"image/png", "image/jpeg", "image/tiff"}:
        raise HTTPException(
            status_code=415, detail="OCR currently accepts PNG, JPEG or TIFF images"
        )
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Document exceeds the 10 MB limit")
    version = (
        await db.scalar(
            select(func.coalesce(func.max(Document.version), 0)).where(Document.case_id == case_id)
        )
    ) + 1
    try:
        fields = await extract_document(content, file.content_type or "image/png")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(422, "Cannot read this image. Upload a valid document scan.") from exc
    document = Document(
        case_id=case_id,
        version=version,
        file_url=f"metadata-only://{(file.filename or 'scan').split('/')[-1][:200]}",
        document_type=document_type,
        created_at=datetime.now(UTC),
        extracted_fields=fields.model_dump(),
        status=DocumentStatus.EXTRACTED,
    )
    db.add(document)
    await db.flush()
    await write_audit_log(
        db, actor.id, f"document.extract:{document.id}:{fields.extraction_method}"
    )
    await db.commit()
    return DocumentExtractionResponse(
        document_id=document.id, status=document.status, fields=fields
    )


@router.post("/documents/{document_id}/extract", response_model=DocumentExtractionResponse)
async def reextract_document(
    document_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(*OFFICER_ROLES)),
) -> DocumentExtractionResponse:
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    await accessible_case_or_404(db, document.case_id, actor)
    if file.content_type not in {"image/png", "image/jpeg", "image/tiff"}:
        raise HTTPException(415, "OCR currently accepts PNG, JPEG or TIFF images")
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Document exceeds the 10 MB limit")
    try:
        fields = await extract_document(content, file.content_type or "image/png")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(422, "Cannot read this image") from exc
    document.extracted_fields = fields.model_dump()
    document.status = DocumentStatus.EXTRACTED
    await write_audit_log(
        db, actor.id, f"document.reextract:{document.id}:{fields.extraction_method}"
    )
    await db.commit()
    return DocumentExtractionResponse(
        document_id=document.id, status=document.status, fields=fields
    )


@router.post("/documents/{document_id}/confirm", response_model=DocumentExtractionResponse)
async def confirm_document(
    document_id: uuid.UUID,
    payload: DocumentConfirmationRequest,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(*OFFICER_ROLES)),
) -> DocumentExtractionResponse:
    document = await db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    await accessible_case_or_404(db, document.case_id, actor)
    allowed = {
        "owner_name",
        "khasra_survey_number",
        "area_hectares",
        "document_type",
        "document_date",
    }
    if set(payload.fields) - allowed:
        raise HTTPException(422, "Only extracted record fields can be corrected")
    merged = {**(document.extracted_fields or {}), **payload.fields}
    try:
        merged = DocumentExtractedFields.model_validate(merged).model_dump()
    except ValidationError as exc:
        raise HTTPException(422, "Invalid extracted fields") from exc
    if payload.approved:
        missing = missing_document_fields(document.document_type, merged)
        if missing:
            raise HTTPException(422, "Required before verification: " + ", ".join(missing))
        if merged.get("khasra_survey_number"):
            try:
                validate_survey_number(merged["khasra_survey_number"])
            except ValueError as exc:
                raise HTTPException(422, str(exc)) from exc
    document.extracted_fields = merged
    document.status = DocumentStatus.VERIFIED if payload.approved else DocumentStatus.REJECTED
    await write_audit_log(db, actor.id, f"document.confirm:{document.id}:{document.status}")
    await db.commit()
    return DocumentExtractionResponse(
        document_id=document.id, status=document.status, fields=merged
    )


@router.post(
    "/cases/{case_id}/grievances",
    response_model=GrievanceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_and_classify_grievance(
    case_id: uuid.UUID,
    payload: GrievanceCreateRequest,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
) -> GrievanceResponse:
    await accessible_case_or_404(db, case_id, actor)
    classification = await run_in_threadpool(classify_grievance, payload.description)
    grievance = Grievance(
        case_id=case_id,
        description=payload.description,
        created_at=datetime.now(UTC),
        category=classification.category,
        priority=classification.priority,
        department=classification.suggested_department,
    )
    db.add(grievance)
    await db.flush()
    await write_audit_log(
        db, actor.id, f"grievance.classify:{grievance.id}:{classification.category}"
    )
    await db.commit()
    return GrievanceResponse(id=grievance.id, case_id=case_id, classification=classification)


@router.post("/grievances/{grievance_id}/classify", response_model=GrievanceResponse)
async def classify_existing_grievance(
    grievance_id: uuid.UUID,
    payload: GrievanceCreateRequest,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(*OFFICER_ROLES)),
) -> GrievanceResponse:
    grievance = await db.get(Grievance, grievance_id)
    if grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    await accessible_case_or_404(db, grievance.case_id, actor)
    classification = await run_in_threadpool(classify_grievance, payload.description)
    grievance.category, grievance.priority, grievance.department = (
        classification.category,
        classification.priority,
        classification.suggested_department,
    )
    grievance.description = payload.description
    await write_audit_log(db, actor.id, f"grievance.reclassify:{grievance.id}")
    await db.commit()
    return GrievanceResponse(
        id=grievance.id, case_id=grievance.case_id, classification=classification
    )


@router.post("/grievances/{grievance_id}/confirm")
async def confirm_grievance(
    grievance_id: uuid.UUID,
    payload: GrievanceConfirmationRequest,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles(*OFFICER_ROLES)),
) -> dict[str, Any]:
    grievance = await db.get(Grievance, grievance_id)
    if grievance is None:
        raise HTTPException(status_code=404, detail="Grievance not found")
    await accessible_case_or_404(db, grievance.case_id, actor)
    grievance.category, grievance.priority, grievance.department = (
        payload.category,
        payload.priority,
        payload.department,
    )
    await write_audit_log(db, actor.id, f"grievance.confirm:{grievance.id}:{payload.department}")
    await db.commit()
    return {
        "id": grievance.id,
        "confirmed": True,
        "category": grievance.category,
        "priority": grievance.priority,
        "department": grievance.department,
    }


async def _prediction_features(db: AsyncSession, case_id: uuid.UUID) -> dict[str, Any]:
    row = (
        await db.execute(
            select(AcquisitionCase, Parcel, Project)
            .join(Parcel, AcquisitionCase.parcel_id == Parcel.id)
            .join(Project, Parcel.project_id == Project.id)
            .where(AcquisitionCase.id == case_id)
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Case not found")
    case, _, project = row
    objection_count = await db.scalar(
        select(func.count()).select_from(Grievance).where(Grievance.case_id == case_id)
    )
    officer_load = (
        await db.scalar(
            select(func.count())
            .select_from(AcquisitionCase)
            .where(AcquisitionCase.assigned_officer_id == case.assigned_officer_id)
        )
        if case.assigned_officer_id
        else 0
    )
    return {
        "project_type": project.project_type,
        "state": project.state,
        "district": project.district,
        "current_stage": case.current_stage.value,
        "parcel_count": 1,
        "objection_count": objection_count or 0,
        "document_turnaround_days": 12,
        "officer_open_load": officer_load or 0,
        "days_in_compensation": 18 if case.current_stage.value == "compensation" else 0,
    }


@router.get("/cases/{case_id}/prediction/delay", response_model=PredictionResponse)
async def delay_prediction(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
) -> PredictionResponse:
    await accessible_case_or_404(db, case_id, actor)
    return predict("delay_model.joblib", await _prediction_features(db, case_id))


@router.get("/cases/{case_id}/prediction/compensation-timeline", response_model=PredictionResponse)
async def compensation_prediction(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
) -> PredictionResponse:
    await accessible_case_or_404(db, case_id, actor)
    return predict("compensation_timeline_model.joblib", await _prediction_features(db, case_id))


@router.get("/predictions/aggregate", response_model=AggregatePredictionResponse)
async def aggregate_predictions(
    state: str | None = None,
    project_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.DISTRICT_ADMIN, UserRole.SENIOR_ADMIN)),
) -> AggregatePredictionResponse:
    query = select(AcquisitionCase.id).join(Parcel).join(Project)
    if state:
        query = query.where(Project.state.ilike(state))
    if project_type:
        query = query.where(Project.project_type.ilike(project_type))
    case_ids = list(await db.scalars(query.limit(500)))
    if not case_ids:
        return AggregatePredictionResponse(
            case_count=0, high_risk_pct=0, avg_disbursal_days=0, trend="stable"
        )
    delays, compensation = [], []
    for case_id in case_ids:
        features = await _prediction_features(db, case_id)
        delays.append(predict("delay_model.joblib", features))
        compensation.append(
            predict("compensation_timeline_model.joblib", features).predicted_days_remaining
        )
    high_pct = round(sum(item.risk_band == "high" for item in delays) * 100 / len(delays), 1)
    return AggregatePredictionResponse(
        case_count=len(case_ids),
        high_risk_pct=high_pct,
        avg_disbursal_days=round(sum(compensation) / len(compensation), 1),
        trend="up" if high_pct > 30 else "stable",
    )


@router.post("/gis/parcels/intersect", response_model=list[SpatialParcelResponse])
async def intersect_parcels(
    geometry: dict[str, Any] = Body(...),
    project_id: uuid.UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
) -> list[SpatialParcelResponse]:
    boundary = func.ST_SetSRID(func.ST_GeomFromGeoJSON(json.dumps(geometry)), 4326)
    query = (
        select(Parcel, func.ST_AsGeoJSON(Parcel.polygon))
        .join(AcquisitionCase, AcquisitionCase.parcel_id == Parcel.id)
        .where(func.ST_Intersects(Parcel.polygon, boundary))
    )
    query = scope_case_query(query, actor)
    if project_id:
        query = query.where(Parcel.project_id == project_id)
    rows = (await db.execute(query)).all()
    return [
        SpatialParcelResponse(
            id=parcel.id,
            project_id=parcel.project_id,
            khasra_survey_no=parcel.khasra_survey_no,
            polygon=json.loads(polygon),
        )
        for parcel, polygon in rows
    ]
