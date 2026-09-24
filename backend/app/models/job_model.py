from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class JobRecord(BaseModel):
    job_id: str
    file_id: Optional[str] = None
    filename: str
    file_size: int
    status: JobStatus
    worker_id: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    processing_time_ms: Optional[float] = None
    processing_mode: str = "local"  # 'local' or 'lambda'
    result_location: Optional[str] = None
    result_summary: Optional[Any] = None
    error_message: Optional[str] = None
    created_at: str

class BatchProcessRequest(BaseModel):
    file_ids: Optional[List[str]] = None
    all_unprocessed: bool = False
    processing_mode: str = "local" # 'local' or 'lambda'
    worker_count: Optional[int] = None # Optional override for batch run

class JobCreateResponse(BaseModel):
    queued_jobs_count: int
    job_ids: List[str]
    message: str

class JobListResponse(BaseModel):
    total_jobs: int
    queued_count: int
    processing_count: int
    completed_count: int
    failed_count: int
    jobs: List[JobRecord]

class JobActionResponse(BaseModel):
    job_id: str
    action: str
    success: bool
    message: str
