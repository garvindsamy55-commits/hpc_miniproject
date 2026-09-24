import time

def test_worker_pool_status(client):
    response = client.get("/api/workers")
    assert response.status_code == 200
    data = response.json()
    assert "total_workers" in data
    assert "workers" in data
    assert len(data["workers"]) == data["total_workers"]
    assert data["total_workers"] >= 1

def test_resize_worker_pool(client):
    # Resize to 6
    response = client.post("/api/workers/config", json={"worker_count": 6})
    assert response.status_code == 200
    data = response.json()
    assert data["total_workers"] == 6
    
    # Restore to 4
    response = client.post("/api/workers/config", json={"worker_count": 4})
    assert response.status_code == 200
    assert response.json()["total_workers"] == 4

def test_job_dispatch_and_execution(client):
    # Generate sample files first
    client.post("/api/files/samples")
    
    # Trigger batch job
    process_resp = client.post("/api/jobs/process", json={"all_unprocessed": True, "worker_count": 4})
    assert process_resp.status_code == 200
    data = process_resp.json()
    assert data["queued_jobs_count"] >= 1
    
    # Give workers a brief moment to process
    time.sleep(0.5)
    
    jobs_resp = client.get("/api/jobs")
    assert jobs_resp.status_code == 200
    jobs_data = jobs_resp.json()
    assert jobs_data["total_jobs"] >= 1
    assert (jobs_data["completed_count"] + jobs_data["processing_count"] + jobs_data["queued_count"]) >= 1
