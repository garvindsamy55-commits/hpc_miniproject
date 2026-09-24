# Backwards-compatibility shim.
# All actual logic has been migrated to app.azure.blob_client (Azure Blob Storage).
# This module re-exports AzureBlobManager as S3Manager so existing imports
# like `from app.aws.s3_client import s3_manager` continue to work unchanged.
from app.azure.blob_client import AzureBlobManager as S3Manager, s3_manager

__all__ = ["S3Manager", "s3_manager"]
