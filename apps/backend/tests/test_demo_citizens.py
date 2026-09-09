import asyncio

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models import AcquisitionCase, Landowner, Parcel, Project, User
from scripts import seed_data
from tests.test_phase_one_api import authorization


def test_extra_citizens_are_idempotent_and_have_separate_cases(client: TestClient, monkeypatch):
    async def verify_seed():
        engine = create_async_engine(settings.database_url)
        factory = async_sessionmaker(engine, expire_on_commit=False)
        monkeypatch.setattr(seed_data, "SessionFactory", factory)
        try:
            await seed_data.seed(reset_existing=False)
            async with factory() as db:
                cases = (
                    await db.execute(
                        select(
                            AcquisitionCase.id,
                            AcquisitionCase.current_stage,
                            AcquisitionCase.affected_family_count,
                        )
                        .join(Parcel)
                        .join(Project)
                        .where(Project.name == seed_data.DEMO_PROJECT_NAME)
                        .order_by(AcquisitionCase.id)
                    )
                ).all()
                users = list(
                    await db.scalars(
                        select(User.id).where(
                            User.email.in_([account.email for account in seed_data.EXTRA_CITIZENS])
                        )
                    )
                )
                links = list(
                    await db.scalars(select(Landowner.id).where(Landowner.user_id.in_(users)))
                )
            await seed_data.seed(reset_existing=False)
            async with factory() as db:
                repeated = (
                    await db.execute(
                        select(
                            AcquisitionCase.id,
                            AcquisitionCase.current_stage,
                            AcquisitionCase.affected_family_count,
                        )
                        .join(Parcel)
                        .join(Project)
                        .where(Project.name == seed_data.DEMO_PROJECT_NAME)
                        .order_by(AcquisitionCase.id)
                    )
                ).all()
                repeated_users = list(
                    await db.scalars(
                        select(User.id).where(
                            User.email.in_([account.email for account in seed_data.EXTRA_CITIZENS])
                        )
                    )
                )
                repeated_links = list(
                    await db.scalars(select(Landowner.id).where(Landowner.user_id.in_(users)))
                )
            assert cases == repeated
            assert len(users) == 4 and set(users) == set(repeated_users)
            assert len(links) == 4 and set(links) == set(repeated_links)
        finally:
            await engine.dispose()

    asyncio.run(verify_seed())
    visible_cases = []
    for account in seed_data.EXTRA_CITIZENS:
        login = client.post(
            "/auth/login",
            json={
                "email": account.email,
                "password": seed_data.DEMO_PASSWORD,
            },
        )
        assert login.status_code == 200
        headers = authorization(login.json())
        cases = client.get("/cases", headers=headers)
        assert cases.status_code == 200 and len(cases.json()) == 1
        case_id = cases.json()[0]["id"]
        if visible_cases:
            assert client.get(f"/cases/{visible_cases[0]}", headers=headers).status_code == 404
        visible_cases.append(case_id)
    assert len(set(visible_cases)) == 4
