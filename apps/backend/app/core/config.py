from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_environment: str = "development"
    frontend_origin: str = "http://localhost:3000"
    openai_api_key: str | None = None
    openai_vision_model: str = "gpt-4o-mini"
    database_url: str = "postgresql+asyncpg://punit@localhost:5432/bhoomsetu"
    jwt_secret: str = "local-development-access-secret-change-before-deploy"
    jwt_refresh_secret: str = "local-development-refresh-secret-change-before-deploy"
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def reject_development_secrets_in_production(self) -> "Settings":
        if self.app_environment == "production":
            if "local-development" in self.jwt_secret:
                raise ValueError("JWT_SECRET must be changed in production")
            if "local-development" in self.jwt_refresh_secret:
                raise ValueError("JWT_REFRESH_SECRET must be changed in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
