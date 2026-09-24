import os
import logging
from typing import Optional, Dict, Any, Tuple, List
from app.config import settings
from app.database import log_event

logger = logging.getLogger("cloudburst.azure")

class AzureBlobManager:
    """
    Encapsulates Azure Blob Storage operations using the azure-storage-blob SDK.
    Safely resolves credentials and handles authentication/connectivity errors.
    """
    def __init__(self):
        self._blob_service_client = None
        self._is_authenticated = False

    def _get_service_client(self):
        """Creates or returns an Azure BlobServiceClient."""
        if self._blob_service_client is None:
            try:
                from azure.storage.blob import BlobServiceClient
                conn_str = settings.AZURE_STORAGE_CONNECTION_STRING
                if conn_str:
                    self._blob_service_client = BlobServiceClient.from_connection_string(conn_str)
                else:
                    account_url = (
                        f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
                    )
                    from azure.identity import DefaultAzureCredential
                    credential = DefaultAzureCredential()
                    self._blob_service_client = BlobServiceClient(
                        account_url=account_url, credential=credential
                    )
            except ImportError:
                logger.warning(
                    "azure-storage-blob is not installed. Running in Local Demo Mode."
                )
        return self._blob_service_client

    def check_connection(self) -> Dict[str, Any]:
        """
        Validates Azure credentials and Blob container accessibility.
        Returns a rich status report for the frontend dashboard.
        """
        status = {
            "is_connected": False,
            "operating_mode": settings.OPERATING_MODE,
            "region": settings.AZURE_REGION,
            "profile": settings.AZURE_STORAGE_ACCOUNT_NAME,
            "input_bucket": settings.AZURE_BLOB_INPUT_CONTAINER,
            "input_bucket_accessible": False,
            "output_bucket": settings.AZURE_BLOB_OUTPUT_CONTAINER,
            "output_bucket_accessible": False,
            "message": "",
            "error_details": None,
            "credentials_source": None,
        }

        try:
            client = self._get_service_client()
            if client is None:
                status["message"] = (
                    "Azure SDK not installed. Running in Local Demo Mode with simulated storage."
                )
                status["error_details"] = (
                    "Install azure-storage-blob: pip install azure-storage-blob"
                )
                return status

            # Verify connectivity by listing containers (lightweight call)
            _ = list(client.list_containers(max_results=1))
            status["is_connected"] = True
            status["credentials_source"] = (
                f"Account: {settings.AZURE_STORAGE_ACCOUNT_NAME}"
            )

            # Check input container
            try:
                cc = client.get_container_client(settings.AZURE_BLOB_INPUT_CONTAINER)
                cc.get_container_properties()
                status["input_bucket_accessible"] = True
            except Exception as e:
                logger.warning(f"Input container check failed: {e}")
                status["error_details"] = f"Input container error: {e}"

            # Check output container
            try:
                cc = client.get_container_client(settings.AZURE_BLOB_OUTPUT_CONTAINER)
                cc.get_container_properties()
                status["output_bucket_accessible"] = True
            except Exception as e:
                logger.warning(f"Output container check failed: {e}")

            status["message"] = "Connected to Azure Blob Storage successfully."
            return status

        except Exception as e:
            status["is_connected"] = False
            status["message"] = (
                "Azure credentials not configured. Running in Local Demo Mode with simulated storage."
            )
            status["error_details"] = str(e)
            return status

    def list_bucket_objects(
        self, container_name: str
    ) -> Tuple[bool, List[Dict[str, Any]], str]:
        """Lists blobs in the given Azure Blob container."""
        try:
            client = self._get_service_client()
            if client is None:
                return False, [], "Azure SDK not installed"

            cc = client.get_container_client(container_name)
            blobs = []
            for blob in cc.list_blobs():
                blobs.append(
                    {
                        "key": blob.name,
                        "size": blob.size,
                        "last_modified": blob.last_modified.strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                        if blob.last_modified
                        else "",
                        "storage_class": blob.blob_tier or "Hot",
                        "etag": (blob.etag or "").strip('"'),
                    }
                )
            return True, blobs, "OK"
        except Exception as e:
            logger.warning(f"Error listing Azure container {container_name}: {e}")
            return False, [], str(e)

    def upload_file_to_s3(
        self, local_path: str, container_name: str, blob_name: str
    ) -> Tuple[bool, str]:
        """Uploads a local file to the specified Azure Blob container."""
        try:
            client = self._get_service_client()
            if client is None:
                return False, "Azure SDK not installed"

            cc = client.get_container_client(container_name)
            with open(local_path, "rb") as f:
                cc.upload_blob(name=blob_name, data=f, overwrite=True)

            url = (
                f"https://{settings.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
                f"/{container_name}/{blob_name}"
            )
            log_event(
                "INFO",
                "AZURE",
                f"Uploaded {blob_name} to Azure container {container_name}",
            )
            return True, url
        except Exception as e:
            logger.error(f"Failed to upload {blob_name} to Azure Blob Storage: {e}")
            return False, str(e)

    def download_file_from_s3(
        self, container_name: str, blob_name: str, local_destination: str
    ) -> bool:
        """Downloads an Azure blob to a local file."""
        try:
            client = self._get_service_client()
            if client is None:
                return False

            cc = client.get_container_client(container_name)
            with open(local_destination, "wb") as f:
                data = cc.download_blob(blob_name)
                data.readinto(f)
            return True
        except Exception as e:
            logger.error(
                f"Failed to download {blob_name} from Azure Blob Storage: {e}"
            )
            return False

    def delete_file_from_s3(self, container_name: str, blob_name: str) -> bool:
        """Deletes a blob from Azure Blob Storage."""
        try:
            client = self._get_service_client()
            if client is None:
                return False

            cc = client.get_container_client(container_name)
            cc.delete_blob(blob_name)
            log_event(
                "WARN",
                "AZURE",
                f"Deleted blob {blob_name} from container {container_name}",
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete {blob_name} from Azure Blob Storage: {e}")
            return False


s3_manager = AzureBlobManager()
