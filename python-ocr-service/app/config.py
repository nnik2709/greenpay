"""
Configuration settings for GreenPay MRZ OCR Service
"""
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application configuration"""

    # Service Information
    SERVICE_NAME: str = "GreenPay MRZ OCR"
    VERSION: str = "1.0.0"

    # Server Configuration
    HOST: str = os.getenv("OCR_HOST", "127.0.0.1")  # Localhost only by default
    PORT: int = int(os.getenv("OCR_PORT", "5000"))
    WORKERS: int = int(os.getenv("OCR_WORKERS", "2"))

    # Upload Limits
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png"]

    # OCR Configuration
    OCR_LANG: str = "en"  # PaddleOCR language
    OCR_USE_GPU: bool = os.getenv("OCR_USE_GPU", "false").lower() == "true"
    OCR_CONFIDENCE_THRESHOLD: float = 0.7  # Minimum confidence for MRZ detection

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 60  # Requests per minute

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "[%(asctime)s] [%(name)s] %(levelname)s - %(message)s"

    # CORS (for development)
    CORS_ENABLED: bool = os.getenv("CORS_ENABLED", "false").lower() == "true"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://greenpay.eywademo.cloud"
    ]


settings = Settings()
