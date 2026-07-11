from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "mamacare_db"
    FIREBASE_SERVICE_ACCOUNT_B64: str
    FRONTEND_URL: str = "http://localhost:5173"
    PORT: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
