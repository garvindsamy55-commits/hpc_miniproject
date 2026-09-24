import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import settings
from app.database import get_db_connection
from app.aws.s3_client import s3_manager

router = APIRouter(prefix="/api/storage", tags=["Storage"])

def get_dir_size_and_count(dir_path: str):
    """Calculates total size and file count in a directory."""
    total_size = 0
    count = 0
    if os.path.exists(dir_path):
        for root, _, files in os.walk(dir_path):
            for f in files:
                fp = os.path.join(root, f)
                total_size += os.path.getsize(fp)
                count += 1
    return total_size, count

@router.get("")
def get_storage_overview():
    """Returns local disk storage usage and AWS S3 configuration details."""
    upload_bytes, upload_count = get_dir_size_and_count(settings.UPLOADS_DIR)
    results_bytes, results_count = get_dir_size_and_count(settings.RESULTS_DIR)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count, SUM(file_size) as size FROM files")
    db_file_stats = dict(cursor.fetchone() or {})
    conn.close()
    
    # Azure / Cloud Status
    azure_info = s3_manager.check_connection()
    cloud_storage_info = {
        "is_connected": azure_info["is_connected"],
        "region": azure_info["region"],
        "input_bucket": azure_info["input_bucket"],
        "input_bucket_accessible": azure_info["input_bucket_accessible"],
        "output_bucket": azure_info["output_bucket"],
        "output_bucket_accessible": azure_info["output_bucket_accessible"],
        "message": azure_info["message"]
    }
    
    return {
        "operating_mode": settings.OPERATING_MODE,
        "local_storage": {
            "uploads_dir": settings.UPLOADS_DIR,
            "uploads_count": upload_count,
            "uploads_bytes": upload_bytes,
            "uploads_formatted": f"{round(upload_bytes / (1024 * 1024), 2)} MB",
            "results_dir": settings.RESULTS_DIR,
            "results_count": results_count,
            "results_bytes": results_bytes,
            "results_formatted": f"{round(results_bytes / 1024, 2)} KB"
        },
        "azure_blob_storage": cloud_storage_info,
        "aws_s3_storage": cloud_storage_info
    }

@router.get("/results/{job_id}")
def download_result_artifact(job_id: str):
    """Downloads the generated JSON processing result for a specific job."""
    result_path = os.path.join(settings.RESULTS_DIR, f"{job_id}_result.json")
    if not os.path.exists(result_path):
        raise HTTPException(status_code=404, detail="Result file not found for this job")
    return FileResponse(
        path=result_path,
        filename=f"result_{job_id}.json",
        media_type="application/json"
    )

@router.get("/files/{file_id}/download")
def download_input_file(file_id: str):
    """Downloads an uploaded source file."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files WHERE id = ?", (file_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
        
    fp = row["file_path"]
    if not os.path.exists(fp):
        raise HTTPException(status_code=404, detail="Physical file missing on disk")
        
    return FileResponse(
        path=fp,
        filename=row["original_name"],
        media_type="application/octet-stream"
    )
