from fastapi import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Setting(BaseSettings):
    DATABASE_USERNAME : str
    DATABASE_PASSWORD : str
    DATABASE_NAME : str
    DATABASE_HOST : str
    DATABASE_PORT : str
    SECRET_KEY : str
    ALGORITHM : str
    ACCESS_TOKEN_EXPIRY : int

    model_config = SettingsConfigDict(env_file=".env")

setting = Setting()
