import uuid

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import create_token, decode_token, hash_password, verify_password


def test_password_hashing_round_trip() -> None:
    password_hash = hash_password("A-long-demo-password!")

    assert password_hash != "A-long-demo-password!"
    assert verify_password("A-long-demo-password!", password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_round_trip() -> None:
    user_id = uuid.uuid4()
    token = create_token(user_id, "officer", "access")

    payload = decode_token(token, "access")

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "officer"


def test_refresh_token_cannot_be_used_as_access_token() -> None:
    token = create_token(uuid.uuid4(), "landowner", "refresh")

    with pytest.raises(ValueError, match="Invalid"):
        decode_token(token, "access")


def test_production_rejects_default_development_secrets() -> None:
    with pytest.raises(ValidationError, match="must be changed"):
        Settings(app_environment="production", _env_file=None)


def test_provider_database_url_uses_async_driver() -> None:
    settings = Settings(
        database_url="postgresql://demo:secret@db.example.test/bhoomsetu",
        _env_file=None,
    )

    assert settings.database_url.startswith("postgresql+asyncpg://")
