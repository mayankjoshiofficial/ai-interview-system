# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str
    DB_NAME: str = "interview_db"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str
    GROQ_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()