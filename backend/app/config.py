import json
from typing import Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Setting(BaseSettings):
    DATABASE_URL: str
    DATABASE_URL_POOLED: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRY: int = 240  # 4 hours (240 minutes)
    CORS_ORIGINS: Union[list[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://medical-billing-jade.vercel.app",
    ]
    ENABLE_SCHEDULER: bool = True
    SCHEDULER_INTERVAL_MINUTES: int = 1

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    v = v[1:-1]
            return [i.strip().strip("'\"") for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


setting = Setting()

