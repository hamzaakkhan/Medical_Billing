from pydantic_settings import BaseSettings, SettingsConfigDict


class Setting(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRY: int = 30
    CORS_ORIGINS: list[str] 
    ENABLE_SCHEDULER: bool = True
    SCHEDULER_INTERVAL_MINUTES: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


setting = Setting()

