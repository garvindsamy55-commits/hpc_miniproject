def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["app_name"] == "CloudBurst"
    assert "operating_mode" in data
    assert "worker_count" in data
    assert data["worker_count"] >= 1
