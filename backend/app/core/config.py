from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://utors:utors_dev_password@db:5432/utors_db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ENV: str = "development"
    BACKEND_PORT: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
