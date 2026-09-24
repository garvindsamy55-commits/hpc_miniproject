from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class WorkerState(str, Enum):
    IDLE = "IDLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"

class WorkerInfo(BaseModel):
    worker_id: str
    name: str
    status: WorkerState
    current_job_id: Optional[str] = None
    current_file: Optional[str] = None
    job_start_time: Optional[str] = None
    completed_count: int = 0
    error_count: int = 0
    last_active_time: Optional[str] = None
    cpu_percent: Optional[float] = None
    memory_percent: Optional[float] = None

class WorkerConfigUpdate(BaseModel):
    worker_count: int = Field(ge=1, le=16, description="Number of parallel workers (1 to 16)")

class WorkerPoolStats(BaseModel):
    total_workers: int
    active_workers: int
    idle_workers: int
    offline_workers: int
    queue_size: int
    system_cpu_percent: float
    system_memory_percent: float
    workers: List[WorkerInfo]
