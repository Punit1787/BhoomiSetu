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
