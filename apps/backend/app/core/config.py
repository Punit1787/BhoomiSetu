from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://punit@localhost:5432/bhoomsetu"
    jwt_secret: str = "local-development-access-secret-change-before-deploy"
    jwt_refresh_secret: str = "local-development-refresh-secret-change-before-deploy"
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
