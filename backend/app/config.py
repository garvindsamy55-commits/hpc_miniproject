import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory: e:\HPC\cloudburst\backend
BACKEND_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # Operating Mode: "local" (Default) or "azure"
    OPERATING_MODE: str = "local"
    
    # Server details
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True
    APP_NAME: str = "CloudBurst"
    APP_SUBTITLE: str = "Parallel File Processing System using Azure"
    VERSION: str = "1.0.0"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    # Storage settings
    STORAGE_DIR: str = str(BACKEND_DIR / "storage")
    UPLOADS_DIR: str = str(BACKEND_DIR / "storage" / "uploads")
    RESULTS_DIR: str = str(BACKEND_DIR / "storage" / "results")
    SAMPLES_DIR: str = str(BACKEND_DIR / "storage" / "samples")
    DATABASE_PATH: str = str(BACKEND_DIR / "storage" / "cloudburst.db")
    
    # Worker & Processing configuration
    DEFAULT_WORKER_COUNT: int = 4
    MAX_WORKER_COUNT: int = 16
    MIN_WORKER_COUNT: int = 1
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = [
        "txt", "csv", "json", "log", "md", "xml", "html",
        "jpg", "jpeg", "png", "gif", "bmp", "webp",
        "pdf"
    ]
    
    # Azure Blob Storage Settings (used when OPERATING_MODE = "azure")
    AZURE_REGION: str = "eastus"
    AZURE_STORAGE_ACCOUNT_NAME: str = "cloudburstdemostorage"
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_BLOB_INPUT_CONTAINER: str = "cloudburst-input-container"
    AZURE_BLOB_OUTPUT_CONTAINER: str = "cloudburst-output-container"
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    AZURE_TENANT_ID: str = ""
    # Legacy aliases kept for compatibility
    AWS_S3_INPUT_BUCKET: str = "cloudburst-input-container"
    AWS_S3_OUTPUT_BUCKET: str = "cloudburst-output-container"

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
for path_str in [settings.STORAGE_DIR, settings.UPLOADS_DIR, settings.RESULTS_DIR, settings.SAMPLES_DIR]:
    os.makedirs(path_str, exist_ok=True)
