import io
import uuid

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFont

from tests.test_phase_one_api import authorization, register


def make_sample_land_record() -> bytes:
    image = Image.new("RGB", (1400, 820), "white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 42)
    lines = [
        "MAHARASHTRA LAND OWNERSHIP RECORD",
        "Document Type: 7/12 Land Extract",
        "Owner: Asha Dattatray Patil",
        "Survey No: KH-101",
        "Area (ha): 0.72",
        "Document Date: 31/08/2026",
    ]
    for index, line in enumerate(lines):
        draw.text((80, 70 + index * 105), line, fill="black", font=font)
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    return stream.getvalue()


def test_phase_three_ai_ml_and_gis(client: TestClient) -> None:
    suffix = uuid.uuid4().hex
    authority = register(client, "project_authority", suffix)
    officer = register(client, "officer", suffix)
    landowner = register(client, "landowner", suffix)
    district = register(client, "district_admin", suffix)
    authority_headers = authorization(authority)

    project = client.post(
        "/projects",
        headers=authority_headers,
        json={
            "name": "Phase Three Intelligence",
            "project_type": "Highway",
            "state": "Maharashtra",
            "district": "Pune",
            "status": "active",
        },
    )
    assert project.status_code == 201, project.text
    project_id = project.json()["id"]
    polygon = [
        [[73.947, 18.551], [73.949, 18.551], [73.949, 18.553], [73.947, 18.553], [73.947, 18.551]]
    ]
    parcel = client.post(
        f"/projects/{project_id}/parcels",
        headers=authority_headers,
        json={"khasra_survey_no": f"AI-{suffix[:6]}", "polygon": polygon},
    )
    assert parcel.status_code == 201, parcel.text
    linked_owner = client.post(
        f"/parcels/{parcel.json()['id']}/landowners",
        headers=authority_headers,
        json={
            "name": "Asha Dattatray Patil",
            "contact": "demo-only@example.invalid",
            "user_id": landowner["user"]["id"],
        },
    )
    assert linked_owner.status_code == 201, linked_owner.text
    acquisition_case = client.post(
        "/cases",
        headers=authority_headers,
        json={
            "parcel_id": parcel.json()["id"],
            "assigned_officer_id": officer["user"]["id"],
            "affected_family_count": 3,
        },
    )
    assert acquisition_case.status_code == 201, acquisition_case.text
    case_id = acquisition_case.json()["id"]

    extraction = client.post(
        f"/cases/{case_id}/documents",
        headers=authorization(landowner),
        files={"file": ("sample-7-12.png", make_sample_land_record(), "image/png")},
    )
    assert extraction.status_code == 201, extraction.text
    fields = extraction.json()["fields"]
    assert fields["extraction_method"] == "tesseract_ocr"
    assert "Asha" in fields["owner_name"]
    assert fields["khasra_survey_number"] == "KH-101"
    assert fields["area_hectares"] == 0.72

    confirmation = client.post(
        f"/documents/{extraction.json()['document_id']}/confirm",
        headers=authorization(officer),
        json={"approved": True, "fields": {"owner_name": "Asha Dattatray Patil"}},
    )
    assert confirmation.status_code == 200, confirmation.text
    assert confirmation.json()["status"] == "verified"

    grievance = client.post(
        f"/cases/{case_id}/grievances",
        headers=authorization(landowner),
        json={
            "description": (
                "My compensation payment has not been received for three months "
                "and this is urgent."
            )
        },
    )
    assert grievance.status_code == 201, grievance.text
    assert grievance.json()["classification"]["category"] == "compensation"
    assert grievance.json()["classification"]["priority"] == "urgent"

    for endpoint in ("delay", "compensation-timeline"):
        prediction = client.get(
            f"/cases/{case_id}/prediction/{endpoint}", headers=authority_headers
        )
        assert prediction.status_code == 200, prediction.text
        assert prediction.json()["predicted_days_remaining"] > 0
        assert len(prediction.json()["top_features"]) == 3

    aggregate = client.get(
        "/predictions/aggregate?state=Maharashtra&project_type=Highway",
        headers=authorization(district),
    )
    assert aggregate.status_code == 200, aggregate.text
    assert aggregate.json()["case_count"] >= 1

    intersection = client.post(
        "/gis/parcels/intersect",
        headers=authority_headers,
        json={
            "type": "Polygon",
            "coordinates": [
                [
                    [73.946, 18.550],
                    [73.950, 18.550],
                    [73.950, 18.554],
                    [73.946, 18.554],
                    [73.946, 18.550],
                ]
            ],
        },
    )
    assert intersection.status_code == 200, intersection.text
    assert parcel.json()["id"] in {item["id"] for item in intersection.json()}
