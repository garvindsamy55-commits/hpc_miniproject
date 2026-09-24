from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class BenchmarkRequest(BaseModel):
    file_count: int = Field(default=8, ge=2, le=30, description="Number of synthetic test files to process")
    file_size_kb: int = Field(default=256, ge=10, le=5000, description="Approximate size per synthetic file in KB")
    worker_counts: List[int] = Field(default=[1, 2, 4, 8], description="List of worker pool counts to benchmark")
    workload_type: str = Field(default="mixed", description="text, hash_compute, image_transform, or mixed")

class WorkerBenchmarkPoint(BaseModel):
    worker_count: int
    execution_time_ms: float
    speedup: float  # S = T1 / Tp
    efficiency: float  # E = S / p (0.0 to 1.0)
    efficiency_percent: Optional[float] = None
    throughput_files_sec: float
    throughput_mb_sec: float
    cpu_utilization_percent: float

class BenchmarkRunResult(BaseModel):
    benchmark_id: str
    workload_type: str
    file_count: int
    total_size_bytes: int
    sequential_time_ms: float
    points: List[WorkerBenchmarkPoint]
    best_worker_count: int
    max_speedup: float
    max_throughput_files_sec: float
    timestamp: str

class SystemMetricsResponse(BaseModel):
    total_files: int
    completed_files: int
    pending_jobs: int
    failed_jobs: int
    active_workers: int
    total_workers: int
    avg_processing_time_ms: float
    overall_throughput_files_sec: float
    average_speedup: float
    average_efficiency: float
    system_cpu_percent: float
    system_memory_percent: float
    operating_mode: str
