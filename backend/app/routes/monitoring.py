import json
from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from app.database import get_db_connection

router = APIRouter(prefix="/api/monitoring", tags=["Monitoring & Logs"])

@router.get("/logs")
def get_system_logs(
    level: Optional[str] = Query(None, description="Filter by log level: INFO, WARN, ERROR, SUCCESS"),
    category: Optional[str] = Query(None, description="Filter by category: JOB, WORKER, AWS, STORAGE, BENCHMARK, SYSTEM"),
    limit: int = Query(100, ge=1, le=500)
):
    """Retrieves real system and worker execution event logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM system_logs WHERE 1=1"
    params = []
    
    if level:
        query += " AND level = ?"
        params.append(level)
    if category:
        query += " AND category = ?"
        params.append(category)
        
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    for r in rows:
        if r.get("details_json"):
            try:
                r["details"] = json.loads(r["details_json"])
            except Exception:
                r["details"] = None
                
    return {
        "total_returned": len(rows),
        "logs": rows
    }

@router.delete("/logs")
def clear_system_logs():
    """Clears system logs from database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM system_logs")
    count = cursor.rowcount
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Cleared {count} log entries"}
