import io

from PIL import Image

from app.services.document_ai import _prepare_image


def test_phone_scan_orientation_is_applied_before_ocr():
    image = Image.new("RGB", (200, 300), "white")
    exif = image.getexif()
    exif[274] = 6  # Camera's EXIF orientation: rotate 90 degrees clockwise.
    output = io.BytesIO()
    image.save(output, format="JPEG", exif=exif)
    prepared = _prepare_image(output.getvalue())
    try:
        assert prepared.size == (300, 200)
        assert prepared.mode == "RGB"
    finally:
        prepared.close()


def test_tiff_preview_is_a_browser_readable_png():
    from app.api.intelligence import _scan_preview

    original = io.BytesIO()
    Image.new("RGB", (20, 30), "white").save(original, format="TIFF")
    preview = Image.open(io.BytesIO(_scan_preview(original.getvalue())))
    assert preview.format == "PNG"
    assert preview.size == (20, 30)
    preview.close()


def test_legacy_document_reports_original_unavailable(monkeypatch):
    import asyncio
    import uuid
    from types import SimpleNamespace
    from unittest.mock import AsyncMock

    import pytest
    from fastapi import HTTPException

    from app.api import intelligence

    db = SimpleNamespace(
        get=AsyncMock(return_value=SimpleNamespace(case_id=uuid.uuid4())),
        scalar=AsyncMock(return_value=None),
    )
    access = AsyncMock()
    monkeypatch.setattr(intelligence, "accessible_case_or_404", access)
    with pytest.raises(HTTPException) as error:
        asyncio.run(intelligence.original_document(uuid.uuid4(), False, db, SimpleNamespace()))
    assert error.value.status_code == 404
    assert "older upload" in error.value.detail
    access.assert_awaited_once()
