"""
Configuration settings for E-Com Auditor 2026
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # App
    PROJECT_NAME: str = "E-Com Auditor 2026"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    AES_ENCRYPTION_KEY: str = Field(..., min_length=32)

    # Database
    DATABASE_URL: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "ecom_auditor"
    DB_USER: str = "postgres"
    DB_PASSWORD: str

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_URL: str = ""
    # Secret used by the Telegram bot to authenticate requests to /bot/* endpoints
    BOT_SECRET: str = ""

    # Marketplace APIs
    WILDBERRIES_API_KEY: str = ""
    OZON_CLIENT_ID: str = ""
    OZON_API_KEY: str = ""

    # Government Services
    ROSACCREDITATION_API_KEY: str = ""
    CHESTNYZNAK_API_KEY: str = ""
    FNS_API_KEY: str = ""

    # AI Services
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Payment (legacy)
    PAYMENT_PROVIDER_KEY: str = ""
    PAYMENT_WEBHOOK_SECRET: str = ""

    # Robokassa
    ROBOKASSA_MERCHANT_LOGIN: str = ""
    ROBOKASSA_PASSWORD1: str = ""   # для формирования ссылок оплаты
    ROBOKASSA_PASSWORD2: str = ""   # для проверки result callback
    ROBOKASSA_TEST_MODE: str = "true"

    # Pricing (in rubles)
    PRICE_SINGLE_REPORT: int = 2500
    PRICE_SUBSCRIPTION_MONTHLY: int = 15000

    # VAT Rate (2026)
    VAT_RATE: float = 0.22

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
