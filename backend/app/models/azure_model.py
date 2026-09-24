from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class BlobObjectInfo(BaseModel):
    key: str
    size: int
    last_modified: str
    storage_class: str = "Standard"
    bucket_type: str  # 'input' or 'output'
    etag: Optional[str] = None
    content_type: Optional[str] = None

class AzureStatusResponse(BaseModel):
    is_connected: bool
    operating_mode: str
    region: str
    profile: Optional[str] = None
    input_bucket: str
    input_bucket_accessible: bool
    output_bucket: str
    output_bucket_accessible: bool
    message: str
    error_details: Optional[str] = None
    credentials_source: Optional[str] = None

# Backward compatibility alias
AWSStatusResponse = AzureStatusResponse
S3ObjectInfo = BlobObjectInfo

class BlobListResponse(BaseModel):
    input_bucket: str
    input_bucket_accessible: bool
    input_files_count: int
    input_files: List[BlobObjectInfo]
    output_bucket: str
    output_bucket_accessible: bool
    output_files_count: int
    output_files: List[BlobObjectInfo]

# Backward compatibility alias
S3ListResponse = BlobListResponse

class BlobUploadResponse(BaseModel):
    success: bool
    key: str
    bucket: str
    size: int
    message: str

# Backward compatibility alias
S3UploadResponse = BlobUploadResponse
