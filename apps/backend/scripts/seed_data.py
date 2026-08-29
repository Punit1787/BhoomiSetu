import asyncio
from dataclasses import dataclass

from faker import Faker
from geoalchemy2.elements import WKTElement
from sqlalchemy import select

from app.core.database import SessionFactory
from app.core.security import hash_password
from app.models import AcquisitionCase, CaseStageHistory, Landowner, Parcel, Project, User
from app.models.enums import CaseStage, ProjectStatus, UserRole
from app.services.audit import write_audit_log

fake = Faker("en_IN")
DEMO_PASSWORD = "DemoPass123!"
DEMO_PROJECT_NAME = "Pune Ring Road Demonstration"


@dataclass(frozen=True)
class DemoAccount:
    name: str
    email: str
    role: UserRole


DEMO_ACCOUNTS = (
    DemoAccount("Anita Patil", "citizen@bhoomsetu.local", UserRole.LANDOWNER),
    DemoAccount("Field Officer", "officer@bhoomsetu.local", UserRole.OFFICER),
    DemoAccount("Project Authority", "authority@bhoomsetu.local", UserRole.PROJECT_AUTHORITY),
    DemoAccount("District Administrator", "district@bhoomsetu.local", UserRole.DISTRICT_ADMIN),
    DemoAccount("Senior Administrator", "senior@bhoomsetu.local", UserRole.SENIOR_ADMIN),
)

STAGE_PATH = [
    CaseStage.NOTIFICATION,
    CaseStage.VERIFICATION,
    CaseStage.OBJECTION,
    CaseStage.AWARD,
    CaseStage.COMPENSATION,
    CaseStage.POSSESSION,
]


def demo_polygon(index: int) -> WKTElement:
    """Return a small synthetic parcel near Pune for demo use only."""
    row, column = divmod(index, 5)
    longitude = 73.82 + (column * 0.003)
    latitude = 18.50 + (row * 0.003)
    width = 0.0022
    height = 0.0020
    points = [
        (longitude, latitude),
        (longitude + width, latitude),
        (longitude + width, latitude + height),
        (longitude, latitude + height),
        (longitude, latitude),
    ]
    coordinates = ", ".join(f"{x} {y}" for x, y in points)
    return WKTElement(f"POLYGON(({coordinates}))", srid=4326)


async def seed() -> None:
    async with SessionFactory() as db:
        existing = await db.scalar(select(Project).where(Project.name == DEMO_PROJECT_NAME))
        if existing:
            print("Demo data already exists; nothing changed.")
            return

        accounts: dict[UserRole, User] = {}
        for account in DEMO_ACCOUNTS:
            user = User(
                name=account.name,
                email=account.email,
                role=account.role,
                password_hash=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            await db.flush()
            accounts[account.role] = user
            await write_audit_log(db, user.id, f"seed.user:{user.id}:{user.role.value}")

        project = Project(
            name=DEMO_PROJECT_NAME,
            project_type="Highway",
            state="Maharashtra",
            district="Pune",
            status=ProjectStatus.ACTIVE,
        )
        db.add(project)
        await db.flush()

        authority = accounts[UserRole.PROJECT_AUTHORITY]
        officer = accounts[UserRole.OFFICER]
        citizen = accounts[UserRole.LANDOWNER]
        await write_audit_log(db, authority.id, f"seed.project:{project.id}")

        for index in range(20):
            parcel = Parcel(
                project_id=project.id,
                khasra_survey_no=f"PRR-{1001 + index}",
                polygon=demo_polygon(index),
            )
            db.add(parcel)
            await db.flush()

            landowner = Landowner(
                parcel_id=parcel.id,
                user_id=citizen.id if index == 0 else None,
                name=citizen.name if index == 0 else fake.name(),
                contact="demo-only@example.invalid" if index == 0 else fake.phone_number(),
            )
            db.add(landowner)

            current_stage = STAGE_PATH[index % len(STAGE_PATH)]
            acquisition_case = AcquisitionCase(
                parcel_id=parcel.id,
                current_stage=current_stage,
                assigned_officer_id=officer.id,
                affected_family_count=(index % 4) + 1,
            )
            db.add(acquisition_case)
            await db.flush()

            for from_stage, to_stage in zip(
                STAGE_PATH[: STAGE_PATH.index(current_stage)],
                STAGE_PATH[1 : STAGE_PATH.index(current_stage) + 1],
                strict=True,
            ):
                db.add(
                    CaseStageHistory(
                        case_id=acquisition_case.id,
                        from_stage=from_stage,
                        to_stage=to_stage,
                        changed_by=officer.id,
                        reason="Synthetic demonstration history",
                    )
                )
            await write_audit_log(db, authority.id, f"seed.case:{acquisition_case.id}")

        await db.commit()
        print("Created 5 demo accounts, 1 project, 20 parcels, landowners, and cases.")
        print(f"All demo accounts use password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
