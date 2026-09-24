import os
import re
import uuid
import shutil
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
from app.config import settings
from app.database import get_db_connection, log_event
from app.services.processor import compute_sha256

logger = logging.getLogger("cloudburst.file_service")

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename against path traversal and hazardous characters."""
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', Path(filename).name)
    return clean if clean else f"file_{uuid.uuid4().hex[:8]}"

def validate_file_extension(filename: str) -> str:
    """Validates file extension against allowed list."""
    ext = Path(filename).suffix.lower().lstrip(".")
    if not ext or ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    return ext

def save_uploaded_file(file: UploadFile) -> Dict[str, Any]:
    """Saves uploaded file to disk and records metadata in database."""
    safe_name = sanitize_filename(file.filename or "unknown")
    ext = validate_file_extension(safe_name)
    
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    unique_name = f"{file_id}_{safe_name}"
    target_path = os.path.join(settings.UPLOADS_DIR, unique_name)
    
    # Save file contents
    size_bytes = 0
    with open(target_path, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            size_bytes += len(chunk)
            if size_bytes > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                # Cleanup and reject
                buffer.close()
                if os.path.exists(target_path):
                    os.remove(target_path)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
                )
            buffer.write(chunk)
            
    sha256 = compute_sha256(target_path)
    
    # Insert record into database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO files (id, filename, original_name, file_size, file_type, file_path, sha256_hash, storage_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'local', 'UPLOADED')
    """, (file_id, unique_name, safe_name, size_bytes, ext, target_path, sha256))
    conn.commit()
    conn.close()
    
    log_event("INFO", "STORAGE", f"Saved file {safe_name} ({size_bytes} bytes)", {"file_id": file_id, "sha256": sha256})
    
    return {
        "id": file_id,
        "filename": unique_name,
        "original_name": safe_name,
        "file_size": size_bytes,
        "file_type": ext,
        "storage_type": "local",
        "file_path": target_path,
        "sha256_hash": sha256,
        "status": "UPLOADED"
    }

def get_all_files() -> List[Dict[str, Any]]:
    """Retrieves all file records from SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files ORDER BY upload_time DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_file_by_id(file_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single file record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files WHERE id = ?", (file_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_file(file_id: str) -> bool:
    """Deletes a file from storage and database."""
    file_record = get_file_by_id(file_id)
    if not file_record:
        return False
        
    path = file_record.get("file_path")
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except Exception as e:
            logger.warning(f"Error removing physical file {path}: {e}")
            
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM files WHERE id = ?", (file_id,))
    cursor.execute("DELETE FROM jobs WHERE file_id = ?", (file_id,))
    conn.commit()
    conn.close()
    
    log_event("WARN", "STORAGE", f"Deleted file record {file_id} ({file_record.get('original_name')})")
    return True

def generate_sample_datasets() -> List[Dict[str, Any]]:
    """Generates synthetic demonstration datasets (Text, CSV, JSON, Log) for instant benchmarking and demo."""
    sample_files = [
        {
            "name": "hpc_cluster_telemetry.log",
            "type": "log",
            "content": """2026-09-24 10:00:01 INFO [Node-01] Cluster heartbeat OK. Load average 1.24
2026-09-24 10:00:02 INFO [Node-02] Azure Blob Sync job initialized for container cloudburst-in
2026-09-24 10:00:05 WARN [Node-03] Memory utilization reached 82% threshold
2026-09-24 10:00:07 ERROR [Node-04] Worker thread timeout in matrix multiplication partition 4
2026-09-24 10:00:10 INFO [Node-01] Parallel worker pool scaled from 2 to 8 instances
2026-09-24 10:00:15 INFO [Node-02] Task queue processed 1400 batch items in 412ms
2026-09-24 10:00:18 WARN [Node-04] Re-queueing aborted worker job J-9921
2026-09-24 10:00:22 INFO [Node-03] Garbage collection completed. Reclaimed 512MB RAM
"""
        },
        {
            "name": "cloud_pricing_matrix.csv",
            "type": "csv",
            "content": """InstanceType,vCPUs,MemoryGB,StorageType,NetworkGbps,HourlyCostUSD
Standard_D2s_v5,2,8,PremiumSSD,12.5,0.0960
Standard_D4s_v5,4,16,PremiumSSD,12.5,0.1920
Standard_D8s_v5,8,32,PremiumSSD,12.5,0.3840
Standard_D16s_v5,16,64,PremiumSSD,12.5,0.7680
Standard_E4s_v5,4,32,PremiumSSD,12.5,0.2520
Standard_E8s_v5,8,64,PremiumSSD,12.5,0.5040
Standard_F8s_v2,8,16,PremiumSSD,12.5,0.3380
Standard_NC6s_v3,6,112,NVMe,24.0,3.0600
"""
        },
        {
            "name": "distributed_pipeline_config.json",
            "type": "json",
            "content": """{
  "system": "CloudBurst Distributed Engine",
  "version": "1.0.0",
  "architecture": {
    "compute_layer": "FastAPI Parallel Worker Pool",
    "cloud_storage": "Azure Blob Storage",
    "serverless_trigger": "Azure Functions Blob Trigger",
    "message_broker": "Local In-Memory Priority Queue (Future: Azure Service Bus)"
  },
  "scaling_policy": {
    "min_workers": 2,
    "max_workers": 16,
    "target_cpu_utilization": 75.0,
    "scale_up_cooldown_sec": 30
  },
  "benchmarks_enabled": true,
  "hpc_algorithms": [
    "SHA-256 Checksum",
    "Tabular Statistics Aggregation",
    "Linguistic Tokenizer",
    "Structural AST Parsing"
  ]
}"""
        },
        {
            "name": "amdahls_law_summary.txt",
            "type": "txt",
            "content": """Amdahl's Law in High Performance and Cloud Computing:
Amdahl's Law predicts the theoretical speedup in latency of the execution of a task at fixed workload that can be expected of a system whose resources are improved.

Formula:
Speedup(S) = 1 / ((1 - P) + (P / N))

Where:
- P is the proportion of execution time that can be parallelized (0 <= P <= 1)
- (1 - P) is the strictly serial portion
- N is the number of parallel processing worker threads or compute cores

Key Takeaway for CloudBurst:
Even with an infinite number of parallel workers (N -> infinity), the theoretical maximum speedup is strictly capped at 1 / (1 - P).
If 90% of file processing is parallelizable (P = 0.90) and 10% is serial disk I/O, the maximum speedup achievable is 10x.
"""
        }
    ]
    
    created_records = []
    for sample in sample_files:
        file_id = f"sample_{uuid.uuid4().hex[:8]}"
        filename = f"{file_id}_{sample['name']}"
        target_path = os.path.join(settings.UPLOADS_DIR, filename)
        
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(sample["content"])
            
        size_bytes = os.path.getsize(target_path)
        sha256 = compute_sha256(target_path)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO files (id, filename, original_name, file_size, file_type, file_path, sha256_hash, storage_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'local', 'UPLOADED')
        """, (file_id, filename, sample["name"], size_bytes, sample["type"], target_path, sha256))
        conn.commit()
        conn.close()
        
        created_records.append({
            "id": file_id,
            "filename": filename,
            "original_name": sample["name"],
            "file_size": size_bytes,
            "file_type": sample["type"],
            "storage_type": "local",
            "status": "UPLOADED"
        })
        
    log_event("INFO", "STORAGE", f"Generated {len(created_records)} sample demonstration datasets")
    return created_records
