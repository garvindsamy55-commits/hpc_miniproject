from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.models.job_model import (
    BatchProcessRequest,
    JobCreateResponse,
    JobListResponse,
    JobRecord,
    JobActionResponse
)
from app.services.job_service import (
    create_jobs_from_files,
    get_all_jobs,
    get_job_by_id,
    clear_all_jobs
)
from app.workers.worker_pool import worker_pool

router = APIRouter(prefix="/api", tags=["Jobs"])

@router.post("/jobs/process", response_model=JobCreateResponse)
def dispatch_processing_jobs(req: BatchProcessRequest):
    """
    Submits uploaded files to the parallel worker queue for concurrent execution.
    Optionally adjusts worker count for this batch if provided.
    """
    if req.worker_count:
        worker_pool.resize_pool(req.worker_count)
        
    result = create_jobs_from_files(
        file_ids=req.file_ids,
        all_unprocessed=req.all_unprocessed,
        processing_mode=req.processing_mode
    )
    return JobCreateResponse(**result)

@router.get("/jobs", response_model=JobListResponse)
def list_jobs(status: Optional[str] = Query(None, description="Filter jobs by status")):
    """Retrieves all processing jobs with real-time state."""
    raw = get_all_jobs(status_filter=status)
    return JobListResponse(
        total_jobs=raw["total_jobs"],
        queued_count=raw["queued_count"],
        processing_count=raw["processing_count"],
        completed_count=raw["completed_count"],
        failed_count=raw["failed_count"],
        jobs=[JobRecord(**j) for j in raw["jobs"]]
    )

@router.get("/jobs/{job_id}")
def get_job_details(job_id: str):
    """Retrieves details of a specific job including full result metadata."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job

@router.delete("/jobs/clear", response_model=JobActionResponse)
def clear_jobs():
    """Clears completed and failed jobs from queue/history."""
    count = clear_all_jobs()
    return JobActionResponse(
        job_id="all",
        action="clear_completed",
        success=True,
        message=f"Cleared {count} finished jobs"
    )
