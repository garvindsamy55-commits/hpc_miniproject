def test_performance_benchmark(client):
    payload = {
        "file_count": 4,
        "file_size_kb": 20,
        "worker_counts": [1, 2, 4],
        "workload_type": "mixed"
    }
    response = client.post("/api/performance/benchmark", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "benchmark_id" in data
    assert data["file_count"] == 4
    assert len(data["points"]) == 3
    
    for pt in data["points"]:
        assert "worker_count" in pt
        assert "execution_time_ms" in pt
        assert "speedup" in pt
        assert "efficiency" in pt
        assert "throughput_files_sec" in pt
        assert pt["execution_time_ms"] > 0
        assert pt["speedup"] > 0

def test_metrics_endpoint(client):
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_files" in data
    assert "completed_files" in data
    assert "pending_jobs" in data
    assert "active_workers" in data
    assert "average_speedup" in data
