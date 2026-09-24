import os
import time
import queue
import threading
import concurrent.futures
import psutil
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings
from app.database import get_db_connection, log_event
from app.services.processor import process_file

logger = logging.getLogger("cloudburst.worker_pool")

class WorkerSlot:
    """Represents a virtual compute worker slot in the pool."""
    def __init__(self, worker_id: str, name: str):
        self.worker_id = worker_id
        self.name = name
        self.status = "IDLE"  # IDLE, BUSY, OFFLINE
        self.current_job_id: Optional[str] = None
        self.current_file: Optional[str] = None
        self.job_start_time: Optional[float] = None
        self.completed_count: int = 0
        self.error_count: int = 0
        self.last_active_time: float = time.time()
        
    def to_dict(self) -> Dict[str, Any]:
        start_iso = datetime.fromtimestamp(self.job_start_time).strftime("%Y-%m-%d %H:%M:%S") if self.job_start_time else None
        active_iso = datetime.fromtimestamp(self.last_active_time).strftime("%Y-%m-%d %H:%M:%S") if self.last_active_time else None
        return {
            "worker_id": self.worker_id,
            "name": self.name,
            "status": self.status,
            "current_job_id": self.current_job_id,
            "current_file": self.current_file,
            "job_start_time": start_iso,
            "completed_count": self.completed_count,
            "error_count": self.error_count,
            "last_active_time": active_iso
        }

class WorkerPoolManager:
    """
    Manages the multi-worker parallel execution engine, task dispatching,
    worker allocation, concurrency limits, and status tracking.
    """
    _instance = None
    _lock = threading.RLock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(WorkerPoolManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.worker_count = settings.DEFAULT_WORKER_COUNT
        self.workers: Dict[str, WorkerSlot] = {}
        self.task_queue: queue.Queue = queue.Queue()
        self._available_worker_ids = queue.Queue()
        self.executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=settings.MAX_WORKER_COUNT, 
            thread_name_prefix="CloudBurstWorker"
        )
        self._is_running = True
        self._init_workers(self.worker_count)
        self._start_dispatcher()
        self._initialized = True
        logger.info(f"WorkerPoolManager initialized with {self.worker_count} parallel workers.")

    def _init_workers(self, count: int):
        """Initializes active worker slots and populates available worker queue."""
        self.workers.clear()
        # Drain queue
        while not self._available_worker_ids.empty():
            try:
                self._available_worker_ids.get_nowait()
            except queue.Empty:
                break
                
        for i in range(1, count + 1):
            w_id = f"Worker-{i:02d}"
            name = f"Parallel Compute Worker {i}"
            slot = WorkerSlot(w_id, name)
            self.workers[w_id] = slot
            self._available_worker_ids.put(w_id)

    def resize_pool(self, new_count: int):
        """Dynamically adjusts worker pool size (1 to 16) with zero restart latency."""
        new_count = max(settings.MIN_WORKER_COUNT, min(settings.MAX_WORKER_COUNT, new_count))
        with self._lock:
            self.worker_count = new_count
            self._init_workers(new_count)
            log_event("INFO", "WORKER", f"Worker pool resized to {new_count} parallel workers")

    def _start_dispatcher(self):
        """Background dispatcher thread that assigns queued tasks to free worker slots."""
        def dispatch_loop():
            while self._is_running:
                try:
                    # 1. Wait for a job in queue
                    try:
                        job_data = self.task_queue.get(timeout=0.05)
                    except queue.Empty:
                        continue

                    # 2. Acquire a free worker slot
                    try:
                        worker_id = self._available_worker_ids.get(timeout=2.0)
                    except queue.Empty:
                        # Re-queue task and try again
                        self.task_queue.put(job_data)
                        time.sleep(0.02)
                        continue

                    worker = self.workers.get(worker_id)
                    if not worker or not self.executor:
                        self.task_queue.put(job_data)
                        if worker_id in self.workers:
                            self._available_worker_ids.put(worker_id)
                        continue

                    # Submit task to ThreadPoolExecutor
                    self.executor.submit(self._execute_job_task, job_data, worker)
                    self.task_queue.task_done()
                except Exception as e:
                    logger.error(f"Dispatcher error: {e}")
                    time.sleep(0.05)

        t = threading.Thread(target=dispatch_loop, daemon=True, name="CloudBurstDispatcher")
        t.start()

    def submit_job(self, job_data: Dict[str, Any]):
        """Queues a job for parallel worker processing."""
        job_id = job_data["job_id"]
        log_event("INFO", "JOB", f"Job {job_id} ({job_data.get('filename')}) queued for parallel processing", {"job_id": job_id})
        self.task_queue.put(job_data)

    def _execute_job_task(self, job_data: Dict[str, Any], worker: WorkerSlot):
        """Worker task execution with timing, real computation, and error resilience."""
        job_id = job_data["job_id"]
        filepath = job_data["file_path"]
        filename = job_data["filename"]
        
        # 1. Update Worker and DB to PROCESSING
        start_ts = time.time()
        worker.status = "BUSY"
        worker.current_job_id = job_id
        worker.current_file = filename
        worker.job_start_time = start_ts
        worker.last_active_time = start_ts
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE jobs 
            SET status = 'PROCESSING', worker_id = ?, start_time = CURRENT_TIMESTAMP
            WHERE job_id = ?
        """, (worker.worker_id, job_id))
        conn.commit()
        conn.close()
        
        log_event("INFO", "WORKER", f"Worker {worker.worker_id} started processing job {job_id} ({filename})", {"worker_id": worker.worker_id, "job_id": job_id})
        
        try:
            # 2. Perform real computation via processor
            results = process_file(filepath, job_id, settings.RESULTS_DIR)
            duration_ms = results.get("processing_time_ms", 0)
            
            # 3. Update DB to COMPLETED
            summary_json = json.dumps(results.get("computed_metadata", {}))
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE jobs 
                SET status = 'COMPLETED', 
                    end_time = CURRENT_TIMESTAMP, 
                    processing_time_ms = ?, 
                    result_location = ?,
                    result_summary = ?
                WHERE job_id = ?
            """, (duration_ms, results.get("result_filepath"), summary_json, job_id))
            
            # Update file status as well
            if job_data.get("file_id"):
                cursor.execute("UPDATE files SET status = 'PROCESSED', sha256_hash = ? WHERE id = ?", (results.get("sha256_hash"), job_data.get("file_id")))
                
            conn.commit()
            conn.close()
            
            worker.completed_count += 1
            log_event("SUCCESS", "JOB", f"Job {job_id} completed successfully by {worker.worker_id} in {duration_ms}ms", {"job_id": job_id, "worker_id": worker.worker_id, "duration_ms": duration_ms})
            
        except Exception as e:
            logger.error(f"Error executing job {job_id} on worker {worker.worker_id}: {e}", exc_info=True)
            worker.error_count += 1
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE jobs 
                SET status = 'FAILED', 
                    end_time = CURRENT_TIMESTAMP, 
                    error_message = ?
                WHERE job_id = ?
            """, (str(e), job_id))
            if job_data.get("file_id"):
                cursor.execute("UPDATE files SET status = 'FAILED' WHERE id = ?", (job_data.get("file_id"),))
            conn.commit()
            conn.close()
            
            log_event("ERROR", "JOB", f"Job {job_id} failed on worker {worker.worker_id}: {str(e)}", {"job_id": job_id, "error": str(e)})
            
        finally:
            # Release Worker slot back to pool
            worker.status = "IDLE"
            worker.current_job_id = None
            worker.current_file = None
            worker.job_start_time = None
            worker.last_active_time = time.time()
            self._available_worker_ids.put(worker.worker_id)

    def get_stats(self) -> Dict[str, Any]:
        """Returns live worker pool stats, queue size, and system resource utilization."""
        worker_list = [w.to_dict() for w in self.workers.values()]
        active_count = sum(1 for w in self.workers.values() if w.status == "BUSY")
        idle_count = sum(1 for w in self.workers.values() if w.status == "IDLE")
        
        cpu_usage = psutil.cpu_percent(interval=None)
        mem_usage = psutil.virtual_memory().percent
        
        return {
            "total_workers": len(self.workers),
            "active_workers": active_count,
            "idle_workers": idle_count,
            "offline_workers": 0,
            "queue_size": self.task_queue.qsize(),
            "system_cpu_percent": round(cpu_usage, 1),
            "system_memory_percent": round(mem_usage, 1),
            "workers": worker_list
        }

# Global worker manager singleton
worker_pool = WorkerPoolManager()
