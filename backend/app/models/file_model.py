from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class FileRecord(BaseModel):
    id: str
    filename: str
    original_name: str
    file_size: int
    file_type: str
    file_path: str
    sha256_hash: Optional[str] = None
    storage_type: str = "local"
    upload_time: str
    status: str = "UPLOADED"

class FileUploadResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    file_size: int
    file_type: str
    storage_type: str
    upload_time: str
    status: str
    message: str

class FileListResponse(BaseModel):
    total_files: int
    total_size_bytes: int
    files: List[FileRecord]

class FileDeleteResponse(BaseModel):
    id: str
    filename: str
    deleted: bool
    message: str
