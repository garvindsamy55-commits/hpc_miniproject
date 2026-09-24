import io

def test_generate_sample_datasets(client):
    response = client.post("/api/files/samples")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] >= 4
    assert len(data["files"]) >= 4

def test_list_files(client):
    response = client.get("/api/files")
    assert response.status_code == 200
    data = response.json()
    assert "total_files" in data
    assert "files" in data
    assert isinstance(data["files"], list)

def test_upload_single_file(client):
    file_content = b"Sample parallel processing log data line 1\nSample line 2\n"
    response = client.post(
        "/api/upload",
        files={"file": ("test_upload.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["original_name"] == "test_upload.txt"
    assert data["file_size"] == len(file_content)
    assert data["status"] == "UPLOADED"
    assert data["id"].startswith("file_")

def test_invalid_file_extension(client):
    file_content = b"Dangerous binary file content"
    response = client.post(
        "/api/upload",
        files={"file": ("dangerous_payload.exe", io.BytesIO(file_content), "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]
