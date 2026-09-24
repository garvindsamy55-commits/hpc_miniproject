import json
import importlib
from unittest.mock import MagicMock, patch
from app.aws.s3_client import S3Manager

def test_aws_status_fallback(client):
    # In unconfigured local environment, status must be graceful and not raise 500
    response = client.get("/api/aws/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_connected" in data
    assert "operating_mode" in data
    assert "input_bucket" in data
    assert "output_bucket" in data

def test_s3_mocked_operations():
    manager = S3Manager()
    mock_blob = MagicMock()
    mock_blob.name = "sample_data.csv"
    mock_blob.size = 1024
    
    import datetime
    mock_blob.last_modified = datetime.datetime.now()
    mock_blob.blob_tier = "Hot"
    mock_blob.etag = '"abc123etag"'
    mock_blob.content_settings = MagicMock(content_type="text/csv")
    
    mock_container_client = MagicMock()
    mock_container_client.list_blobs.return_value = [mock_blob]
    
    with patch.object(manager, "get_container_client", return_value=mock_container_client):
        ok, objects, msg = manager.list_bucket_objects("mock-bucket")
        assert ok is True
        assert len(objects) == 1
        assert objects[0]["key"] == "sample_data.csv"
        assert objects[0]["size"] == 1024
