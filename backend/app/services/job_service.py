import os
import json
import uuid
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.config import settings
from app.database import get_db_connection, log_event
from app.workers.worker_pool import worker_pool

logger = logging.getLogger("cloudburst.job_service")

def create_jobs_from_files(
    file_ids: Optional[List[str]] = None,
    all_unprocessed: bool = False,
    processing_mode: str = "local"
) -> Dict[str, Any]:
    """Creates processing jobs for specified files or all unprocessed files and queues them."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if all_unprocessed:
        cursor.execute("SELECT * FROM files WHERE status IN ('UPLOADED', 'FAILED')")
        files_to_process = [dict(r) for r in cursor.fetchall()]
    elif file_ids:
        placeholders = ",".join("?" for _ in file_ids)
        cursor.execute(f"SELECT * FROM files WHERE id IN ({placeholders})", file_ids)
        files_to_process = [dict(r) for r in cursor.fetchall()]
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="No file IDs or unprocessed flag provided")
        
    if not files_to_process:
        conn.close()
        return {
            "queued_jobs_count": 0,
            "job_ids": [],
            "message": "No eligible files found to process"
        }
        
    created_job_ids = []
    job_payloads = []
    for f in files_to_process:
        job_id = f"job_{uuid.uuid4().hex[:10]}"
        cursor.execute("""
            INSERT INTO jobs (job_id, file_id, filename, file_size, status, processing_mode)
            VALUES (?, ?, ?, ?, 'QUEUED', ?)
        """, (job_id, f["id"], f["filename"], f["file_size"], processing_mode))
        
        # Mark file status
        cursor.execute("UPDATE files SET status = 'PROCESSING' WHERE id = ?", (f["id"],))
        
        created_job_ids.append(job_id)
        
        job_payloads.append({
            "job_id": job_id,
            "file_id": f["id"],
            "filename": f["original_name"],
            "file_path": f["file_path"],
            "file_size": f["file_size"],
            "processing_mode": processing_mode
        })
        
    conn.commit()
    conn.close()
    
    # Dispatch to worker pool now that DB lock is released
    for payload in job_payloads:
        worker_pool.submit_job(payload)
    
    log_event("INFO", "JOB", f"Batch job created: {len(created_job_ids)} jobs dispatched to worker pool")
    
    return {
        "queued_jobs_count": len(created_job_ids),
        "job_ids": created_job_ids,
        "message": f"Successfully queued {len(created_job_ids)} file processing jobs"
    }

def get_all_jobs(status_filter: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves all jobs and aggregates counts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if status_filter:
        cursor.execute("SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC", (status_filter,))
    else:
        cursor.execute("SELECT * FROM jobs ORDER BY created_at DESC")
        
    job_rows = [dict(r) for r in cursor.fetchall()]
    
    # Summary counts
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'QUEUED' THEN 1 ELSE 0 END) as queued,
            SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
            SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
        FROM jobs
    """)
    stats = dict(cursor.fetchone() or {})
    conn.close()
    
    return {
        "total_jobs": stats.get("total", 0) or 0,
        "queued_count": stats.get("queued", 0) or 0,
        "processing_count": stats.get("processing", 0) or 0,
        "completed_count": stats.get("completed", 0) or 0,
        "failed_count": stats.get("failed", 0) or 0,
        "jobs": job_rows
    }

def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single job and parses its output JSON result if complete."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    job_dict = dict(row)
    result_path = job_dict.get("result_location")
    if result_path and os.path.exists(result_path):
        try:
            with open(result_path, "r", encoding="utf-8") as f:
                job_dict["result_details"] = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read result file {result_path}: {e}")
            job_dict["result_details"] = None
    return job_dict

def clear_all_jobs() -> int:
    """Clears completed or failed jobs from history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    log_event("INFO", "JOB", f"Cleared {count} historical jobs from database")
    return count
