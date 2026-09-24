from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.services.file_service import (
    save_uploaded_file,
    get_all_files,
    get_file_by_id,
    delete_file,
    generate_sample_datasets
)
from app.models.file_model import FileRecord, FileUploadResponse, FileListResponse, FileDeleteResponse

router = APIRouter(prefix="/api", tags=["Files"])

@router.post("/upload", response_model=FileUploadResponse)
async def upload_single_file(file: UploadFile = File(...)):
    """Uploads a single file and performs initial validation & cryptographic hashing."""
    record = save_uploaded_file(file)
    return FileUploadResponse(
        id=record["id"],
        filename=record["filename"],
        original_name=record["original_name"],
        file_size=record["file_size"],
        file_type=record["file_type"],
        storage_type=record["storage_type"],
        upload_time=time_now(),
        status=record["status"],
        message="File uploaded successfully"
    )

@router.post("/upload/multiple", response_model=List[FileUploadResponse])
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """Uploads multiple files simultaneously with validation and indexing."""
    results = []
    for f in files:
        rec = save_uploaded_file(f)
        results.append(FileUploadResponse(
            id=rec["id"],
            filename=rec["filename"],
            original_name=rec["original_name"],
            file_size=rec["file_size"],
            file_type=rec["file_type"],
            storage_type=rec["storage_type"],
            upload_time=time_now(),
            status=rec["status"],
            message="Uploaded"
        ))
    return results

@router.get("/files", response_model=FileListResponse)
def list_files():
    """Returns list of all uploaded files with aggregate size."""
    raw_files = get_all_files()
    total_size = sum(f.get("file_size", 0) for f in raw_files)
    return FileListResponse(
        total_files=len(raw_files),
        total_size_bytes=total_size,
        files=[FileRecord(**f) for f in raw_files]
    )

@router.get("/files/{file_id}", response_model=FileRecord)
def get_file_details(file_id: str):
    """Gets details for a specific file."""
    record = get_file_by_id(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")
    return FileRecord(**record)

@router.delete("/files/{file_id}", response_model=FileDeleteResponse)
def remove_file(file_id: str):
    """Deletes a file from storage and database."""
    success = delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File record not found")
    return FileDeleteResponse(
        id=file_id,
        filename=file_id,
        deleted=True,
        message="File deleted successfully"
    )

@router.post("/files/samples")
def create_sample_files():
    """Generates demonstration test files for immediate processing."""
    created = generate_sample_datasets()
    return {
        "success": True,
        "count": len(created),
        "files": created,
        "message": f"Generated {len(created)} sample datasets"
    }

def time_now() -> str:
    import datetime
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
