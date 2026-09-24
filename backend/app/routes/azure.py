from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from typing import Optional, Dict, Any
from app.config import settings
from app.azure.blob_client import s3_manager as blob_manager
from app.services.file_service import sanitize_filename
from app.models.azure_model import AzureStatusResponse, BlobListResponse, BlobUploadResponse
import os
import tempfile

router = APIRouter(prefix="/api/azure", tags=["Azure Integration"])

@router.get("/status", response_model=AzureStatusResponse)
def get_azure_status():
    """Checks Azure credential resolution and storage container connectivity."""
    info = blob_manager.check_connection()
    return AzureStatusResponse(**info)

@router.get("/storage/files", response_model=BlobListResponse)
@router.get("/blob/files", response_model=BlobListResponse)
def list_blob_container_files():
    """Lists blobs stored in the configured Azure Input and Output containers."""
    in_ok, in_files, in_msg = blob_manager.list_bucket_objects(settings.AZURE_BLOB_INPUT_CONTAINER)
    out_ok, out_files, out_msg = blob_manager.list_bucket_objects(settings.AZURE_BLOB_OUTPUT_CONTAINER)
    
    formatted_in = [
        {**f, "bucket_type": "input"} for f in in_files
    ]
    formatted_out = [
        {**f, "bucket_type": "output"} for f in out_files
    ]
    
    return BlobListResponse(
        input_bucket=settings.AZURE_BLOB_INPUT_CONTAINER,
        input_bucket_accessible=in_ok,
        input_files_count=len(formatted_in),
        input_files=formatted_in,
        output_bucket=settings.AZURE_BLOB_OUTPUT_CONTAINER,
        output_bucket_accessible=out_ok,
        output_files_count=len(formatted_out),
        output_files=formatted_out
    )

@router.post("/storage/upload", response_model=BlobUploadResponse)
@router.post("/blob/upload", response_model=BlobUploadResponse)
async def upload_file_to_blob_container(file: UploadFile = File(...)):
    """Uploads a file directly to the Azure Blob input container."""
    safe_name = sanitize_filename(file.filename or "file.bin")
    
    # Check Azure connection first
    status = blob_manager.check_connection()
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
        success, msg = blob_manager.upload_file_to_s3(tmp_path, settings.AZURE_BLOB_INPUT_CONTAINER, safe_name)
        if not success:
            raise HTTPException(status_code=500, detail=f"Azure Blob upload failed: {msg}")
        return BlobUploadResponse(
            success=True,
            key=safe_name,
            bucket=settings.AZURE_BLOB_INPUT_CONTAINER,
            size=len(content),
            message="Successfully uploaded to Azure Blob Storage"
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.delete("/storage/files/{bucket_type}/{key}")
@router.delete("/blob/files/{bucket_type}/{key}")
def delete_blob_file(bucket_type: str, key: str):
    """Deletes a blob from the Azure input or output container."""
    container = settings.AZURE_BLOB_INPUT_CONTAINER if bucket_type == "input" else settings.AZURE_BLOB_OUTPUT_CONTAINER
    success = blob_manager.delete_file_from_s3(container, key)
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to delete {key} from Azure container {container}")
    return {"success": True, "message": f"Deleted {key} from {container}"}

@router.post("/config")
def update_azure_config(payload: Dict[str, Any] = Body(...)):
    """Updates operating mode and active Azure configuration parameters."""
    if "operating_mode" in payload:
        mode = payload["operating_mode"].lower()
        if mode in ["local", "azure", "aws"]:
            settings.OPERATING_MODE = "azure" if mode in ["azure", "aws"] else "local"
    if "region" in payload and payload["region"]:
        settings.AZURE_REGION = payload["region"]
    if "storage_account" in payload and payload["storage_account"]:
        settings.AZURE_STORAGE_ACCOUNT_NAME = payload["storage_account"]
    if "input_bucket" in payload and payload["input_bucket"]:
        settings.AZURE_BLOB_INPUT_CONTAINER = payload["input_bucket"]
        settings.AWS_S3_INPUT_BUCKET = payload["input_bucket"]
    if "output_bucket" in payload and payload["output_bucket"]:
        settings.AZURE_BLOB_OUTPUT_CONTAINER = payload["output_bucket"]
        settings.AWS_S3_OUTPUT_BUCKET = payload["output_bucket"]
        
    # Reset cached client
    blob_manager._service_client = None
    blob_manager._client_initialized = False
    
    return {
        "success": True,
        "operating_mode": settings.OPERATING_MODE,
        "region": settings.AZURE_REGION,
        "storage_account": settings.AZURE_STORAGE_ACCOUNT_NAME,
        "input_container": settings.AZURE_BLOB_INPUT_CONTAINER,
        "output_container": settings.AZURE_BLOB_OUTPUT_CONTAINER,
        "message": "Configuration updated successfully"
    }
