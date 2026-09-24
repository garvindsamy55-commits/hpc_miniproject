import json
import datetime
from unittest.mock import MagicMock, patch
from app.azure.blob_client import AzureBlobManager
from app.azure.azure_function import main as azure_blob_function_handler

def test_azure_status_fallback(client):
    # In unconfigured local environment, status must be graceful and not raise 500
    response = client.get("/api/azure/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_connected" in data
    assert "operating_mode" in data
    assert "input_bucket" in data
    assert "output_bucket" in data

def test_aws_legacy_status_endpoint(client):
    response = client.get("/api/aws/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_connected" in data

def test_blob_mocked_operations():
    manager = AzureBlobManager()
    mock_blob = MagicMock()
    mock_blob.name = "sample_data.csv"
    mock_blob.size = 1024
    mock_blob.last_modified = datetime.datetime.now()
    mock_blob.blob_tier = "Hot"
    mock_blob.etag = "abc123etag"
    mock_blob.content_settings = MagicMock(content_type="text/csv")
    
    mock_container_client = MagicMock()
    mock_container_client.list_blobs.return_value = [mock_blob]
    
    with patch.object(manager, "get_container_client", return_value=mock_container_client):
        ok, objects, msg = manager.list_bucket_objects("mock-container")
        assert ok is True
        assert len(objects) == 1
        assert objects[0]["key"] == "sample_data.csv"
        assert objects[0]["size"] == 1024

def test_azure_function_mock():
    mock_blob_stream = MagicMock()
    mock_blob_stream.name = "input-container/test_input.log"
    mock_blob_stream.length = 38
    mock_blob_stream.read.return_value = b"2026-09-24 INFO Test log entry in Azure Function"
    
    with patch("app.azure.azure_function.blob_manager") as mock_bm:
        mock_bm.upload_file_to_s3.return_value = (True, "Uploaded")
        result = azure_blob_function_handler(mock_blob_stream)
        assert result["status"] == "success"
        assert result["source_blob"] == "test_input.log"
        assert result["destination_container"] == "cloudburst-output-container-demo"
