from fastapi import APIRouter
from app.models.worker_model import WorkerPoolStats, WorkerConfigUpdate
from app.workers.worker_pool import worker_pool

router = APIRouter(prefix="/api", tags=["Parallel Workers"])

@router.get("/workers", response_model=WorkerPoolStats)
def get_worker_pool_status():
    """Returns live worker slots, busy states, CPU/Memory telemetry, and queue metrics."""
    stats = worker_pool.get_stats()
    return WorkerPoolStats(**stats)

@router.post("/workers/config", response_model=WorkerPoolStats)
def update_worker_pool_config(config: WorkerConfigUpdate):
    """Dynamically scales the parallel worker pool size (1 to 16)."""
    worker_pool.resize_pool(config.worker_count)
    stats = worker_pool.get_stats()
    return WorkerPoolStats(**stats)
