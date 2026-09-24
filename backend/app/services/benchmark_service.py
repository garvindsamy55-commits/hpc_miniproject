import os
import time
import uuid
import json
import logging
import psutil
import concurrent.futures
from typing import List, Dict, Any
from app.config import settings
from app.database import get_db_connection, log_event
from app.services.processor import process_file

logger = logging.getLogger("cloudburst.benchmark_service")

def create_synthetic_workload(count: int, size_kb: int, workload_dir: str) -> List[str]:
    """Generates synthetic benchmark files of defined count and size."""
    os.makedirs(workload_dir, exist_ok=True)
    generated_paths = []
    
    # Base text snippet
    snippet = "CloudBurst High Performance Computing Parallel File Processor Benchmark Stream Data 2026. " * 10
    snippet_bytes = snippet.encode("utf-8")
    repeat_count = max(1, (size_kb * 1024) // len(snippet_bytes))
    
    for i in range(count):
        file_path = os.path.join(workload_dir, f"bench_file_{i+1:03d}.txt")
        with open(file_path, "wb") as f:
            for _ in range(repeat_count):
                f.write(snippet_bytes)
        generated_paths.append(file_path)
        
    return generated_paths

def execute_workload_with_workers(file_paths: List[str], worker_count: int, temp_results_dir: str) -> float:
    """Executes the workload using ThreadPoolExecutor with `worker_count` threads and returns elapsed ms."""
    start_time = time.perf_counter()
    
    def task_wrapper(f_path):
        dummy_job_id = f"bench_{uuid.uuid4().hex[:8]}"
        return process_file(f_path, dummy_job_id, temp_results_dir)
        
    with concurrent.futures.ThreadPoolExecutor(max_workers=worker_count) as executor:
        list(executor.map(task_wrapper, file_paths))
        
    end_time = time.perf_counter()
    return round((end_time - start_time) * 1000, 2)

def run_performance_benchmark(
    file_count: int = 8,
    file_size_kb: int = 256,
    worker_counts: List[int] = [1, 2, 4, 8],
    workload_type: str = "mixed"
) -> Dict[str, Any]:
    """
    Executes a real HPC benchmark comparing sequential execution (1 worker)
    against multiple parallel worker configurations.
    Computes real dynamic Speedup, Efficiency, and Throughput.
    """
    benchmark_id = f"bench_{uuid.uuid4().hex[:10]}"
    bench_dir = os.path.join(settings.STORAGE_DIR, "benchmark_tmp", benchmark_id)
    bench_results_dir = os.path.join(bench_dir, "results")
    os.makedirs(bench_results_dir, exist_ok=True)
    
    log_event("INFO", "BENCHMARK", f"Starting benchmark {benchmark_id} with {file_count} files across worker configs {worker_counts}")
    
    try:
        # 1. Generate workload files
        workload_paths = create_synthetic_workload(file_count, file_size_kb, bench_dir)
        total_size_bytes = sum(os.path.getsize(p) for p in workload_paths)
        total_size_mb = total_size_bytes / (1024 * 1024)
        
        # 2. Run sequential baseline (1 worker) first
        seq_time_ms = execute_workload_with_workers(workload_paths, 1, bench_results_dir)
        # Prevent division by zero
        seq_time_ms = max(1.0, seq_time_ms)
        
        benchmark_points = []
        best_speedup = 1.0
        best_workers = 1
        max_throughput = 0.0
        
        for w_count in worker_counts:
            # Measure CPU before and after
            cpu_before = psutil.cpu_percent(interval=None)
            exec_time_ms = execute_workload_with_workers(workload_paths, w_count, bench_results_dir) if w_count != 1 else seq_time_ms
            exec_time_ms = max(0.5, exec_time_ms)
            cpu_after = psutil.cpu_percent(interval=None)
            avg_cpu = round((cpu_before + cpu_after) / 2, 1)
            
            # HPC Calculations
            speedup = round(seq_time_ms / exec_time_ms, 2)
            efficiency = round(speedup / w_count, 3)
            duration_sec = exec_time_ms / 1000.0
            throughput_files_sec = round(file_count / duration_sec, 2)
            throughput_mb_sec = round(total_size_mb / duration_sec, 2)
            
            if speedup > best_speedup:
                best_speedup = speedup
                best_workers = w_count
            if throughput_files_sec > max_throughput:
                max_throughput = throughput_files_sec
                
            benchmark_points.append({
                "worker_count": w_count,
                "execution_time_ms": exec_time_ms,
                "speedup": speedup,
                "efficiency": efficiency,
                "efficiency_percent": round(efficiency * 100, 1),
                "throughput_files_sec": throughput_files_sec,
                "throughput_mb_sec": throughput_mb_sec,
                "cpu_utilization_percent": avg_cpu
            })
            
        # 3. Store benchmark in SQLite
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO benchmarks (
                id, benchmark_name, file_count, total_size_bytes, 
                sequential_time_ms, parallel_time_ms, worker_count, 
                speedup, efficiency, throughput_files_sec, throughput_mb_sec, details_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            benchmark_id,
            f"Benchmark ({file_count} files, {file_size_kb}KB)",
            file_count,
            total_size_bytes,
            seq_time_ms,
            benchmark_points[-1]["execution_time_ms"],
            best_workers,
            best_speedup,
            benchmark_points[-1]["efficiency"],
            max_throughput,
            benchmark_points[-1]["throughput_mb_sec"],
            json.dumps(benchmark_points)
        ))
        conn.commit()
        conn.close()
        
        log_event("SUCCESS", "BENCHMARK", f"Benchmark {benchmark_id} completed. Best Speedup: {best_speedup}x with {best_workers} workers")
        
        return {
            "benchmark_id": benchmark_id,
            "workload_type": workload_type,
            "file_count": file_count,
            "total_size_bytes": total_size_bytes,
            "total_size_formatted": f"{round(total_size_mb, 2)} MB",
            "sequential_time_ms": seq_time_ms,
            "points": benchmark_points,
            "best_worker_count": best_workers,
            "max_speedup": best_speedup,
            "max_throughput_files_sec": max_throughput,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        }
        
    finally:
        # Cleanup temporary synthetic files
        try:
            import shutil
            if os.path.exists(bench_dir):
                shutil.rmtree(bench_dir, ignore_errors=True)
        except Exception as e:
            logger.warning(f"Failed to cleanup benchmark directory: {e}")

def get_benchmark_history() -> List[Dict[str, Any]]:
    """Retrieves recent benchmark runs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM benchmarks ORDER BY created_at DESC LIMIT 10")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    for r in rows:
        if r.get("details_json"):
            try:
                r["details"] = json.loads(r["details_json"])
            except Exception:
                r["details"] = []
    return rows
