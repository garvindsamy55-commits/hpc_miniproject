from fastapi import APIRouter
import time
from app.config import settings
from app.database import get_db_connection
from app.workers.worker_pool import worker_pool

router = APIRouter(prefix="/api", tags=["Health & System"])

@router.get("/health")
def get_health_status():
    """Health check endpoint returning system status and operating mode."""
    db_healthy = False
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_healthy = True
    except Exception:
        db_healthy = False

    return {
        "status": "healthy" if db_healthy else "degraded",
        "app_name": settings.APP_NAME,
        "subtitle": settings.APP_SUBTITLE,
        "version": settings.VERSION,
        "operating_mode": settings.OPERATING_MODE,
        "database_connected": db_healthy,
        "worker_count": worker_pool.worker_count,
        "active_workers": sum(1 for w in worker_pool.workers.values() if w.status == "BUSY"),
        "timestamp_utc": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime())
    }
