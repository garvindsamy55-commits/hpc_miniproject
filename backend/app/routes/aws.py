from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from typing import Optional, Dict, Any
from app.config import settings
from app.azure.blob_client import s3_manager
from app.services.file_service import sanitize_filename
from app.models.azure_model import AzureStatusResponse as AWSStatusResponse, BlobListResponse as S3ListResponse, BlobUploadResponse as S3UploadResponse
import os
import tempfile

router = APIRouter(prefix="/api/aws", tags=["Azure / AWS Integration (Legacy Alias)"])

@router.get("/status", response_model=AWSStatusResponse)
def get_aws_status():
    """Checks Azure credential resolution and container connectivity (legacy AWS endpoint)."""
    info = s3_manager.check_connection()
    return AWSStatusResponse(**info)

@router.get("/s3/files", response_model=S3ListResponse)
def list_s3_bucket_files():
    """Lists objects stored in the configured Input and Output storage containers."""
    in_ok, in_files, in_msg = s3_manager.list_bucket_objects(settings.AWS_S3_INPUT_BUCKET)
    out_ok, out_files, out_msg = s3_manager.list_bucket_objects(settings.AWS_S3_OUTPUT_BUCKET)
    
    formatted_in = [
        {**f, "bucket_type": "input"} for f in in_files
    ]
    formatted_out = [
        {**f, "bucket_type": "output"} for f in out_files
    ]
    
    return S3ListResponse(
        input_bucket=settings.AWS_S3_INPUT_BUCKET,
        input_bucket_accessible=in_ok,
        input_files_count=len(formatted_in),
        input_files=formatted_in,
        output_bucket=settings.AWS_S3_OUTPUT_BUCKET,
        output_bucket_accessible=out_ok,
        output_files_count=len(formatted_out),
        output_files=formatted_out
    )

@router.post("/s3/upload", response_model=S3UploadResponse)
async def upload_file_to_s3_bucket(file: UploadFile = File(...)):
    """Uploads a file directly to the storage input container."""
    safe_name = sanitize_filename(file.filename or "file.bin")
    
    # Check connection first
    status = s3_manager.check_connection()
    if not status["is_connected"]:
        raise HTTPException(
            status_code=503,
            detail="Azure credentials not configured. Please switch to Local Demo Mode or configure Azure credentials."
        )
        
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
        
    try:
        success, msg = s3_manager.upload_file_to_s3(tmp_path, settings.AWS_S3_INPUT_BUCKET, safe_name)
        if not success:
            raise HTTPException(status_code=500, detail=f"Storage upload failed: {msg}")
        return S3UploadResponse(
            success=True,
            key=safe_name,
            bucket=settings.AWS_S3_INPUT_BUCKET,
            size=len(content),
            message="Successfully uploaded to Azure Blob Storage"
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.delete("/s3/files/{bucket_type}/{key}")
def delete_s3_file(bucket_type: str, key: str):
    """Deletes an object from the input or output container."""
    bucket = settings.AWS_S3_INPUT_BUCKET if bucket_type == "input" else settings.AWS_S3_OUTPUT_BUCKET
    success = s3_manager.delete_file_from_s3(bucket, key)
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to delete {key} from container {bucket}")
    return {"success": True, "message": f"Deleted {key} from {bucket}"}

@router.post("/config")
def update_aws_config(payload: Dict[str, Any] = Body(...)):
    """Updates operating mode and active storage configuration parameters."""
    if "operating_mode" in payload:
        mode = payload["operating_mode"].lower()
        if mode in ["local", "aws", "azure"]:
            settings.OPERATING_MODE = "azure" if mode in ["aws", "azure"] else "local"
    if "region" in payload and payload["region"]:
        settings.AZURE_REGION = payload["region"]
    if "input_bucket" in payload and payload["input_bucket"]:
        settings.AWS_S3_INPUT_BUCKET = payload["input_bucket"]
        settings.AZURE_BLOB_INPUT_CONTAINER = payload["input_bucket"]
    if "output_bucket" in payload and payload["output_bucket"]:
        settings.AWS_S3_OUTPUT_BUCKET = payload["output_bucket"]
        settings.AZURE_BLOB_OUTPUT_CONTAINER = payload["output_bucket"]
        
    s3_manager._service_client = None
    s3_manager._client_initialized = False
    
    return {
        "success": True,
        "operating_mode": settings.OPERATING_MODE,
        "region": settings.AZURE_REGION,
        "profile": getattr(settings, "AWS_PROFILE", None),
        "input_bucket": settings.AWS_S3_INPUT_BUCKET,
        "output_bucket": settings.AWS_S3_OUTPUT_BUCKET,
        "message": "Configuration updated successfully"
    }
