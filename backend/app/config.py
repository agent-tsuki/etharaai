import json
import logging
import secrets
from functools import lru_cache
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@db:5432/inventory_db"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost"]
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False

    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if not self.SECRET_KEY:
            if self.DEBUG:
                self.SECRET_KEY = secrets.token_urlsafe(64)
                logger.warning(
                    "WARNING: SECRET_KEY was not set. A random key has been generated for "
                    "this process. All tokens will be invalidated on restart and will not "
                    "work across multiple workers. Set SECRET_KEY in your environment for "
                    "stable operation."
                )
            else:
                raise ValueError("SECRET_KEY environment variable must be set in production")
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
