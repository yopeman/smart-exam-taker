from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Smart Exam Taker"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "sqlite:///./smart_exam_taker.db"

    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    VERIFY_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    FRONTEND_BASE_URL: str = "http://localhost:5173"

    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""
    EMAIL_FROM: str = "Smart Exam Taker <support@sexam.com>"

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    REDIS_URL: str = ""


settings = Settings()
