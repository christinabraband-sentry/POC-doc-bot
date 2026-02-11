from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://poc_user:poc_password@localhost:5432/poc_doc_bot"

    # Gong API
    gong_api_base_url: str = "https://api.gong.io/v2"
    gong_access_key: str = ""
    gong_access_key_secret: str = ""

    # Anthropic Claude API
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"

    # Sentry
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 1.0

    # App
    app_url: str = "http://localhost:3000"
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
