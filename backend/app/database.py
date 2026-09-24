import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger("cloudburst.database")

def get_db_connection() -> sqlite3.Connection:
    """Returns a thread-safe SQLite connection with busy timeout."""
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=20.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 20000;")
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=20.0)
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
    except Exception as e:
        logger.warning(f"Could not enable WAL mode: {e}")
    cursor = conn.cursor()
    
    # 1. Files table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        sha256_hash TEXT,
        storage_type TEXT NOT NULL DEFAULT 'local', -- 'local' or 's3'
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'UPLOADED' -- 'UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DELETED'
    );
    """)
    
    # 2. Jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        job_id TEXT PRIMARY KEY,
        file_id TEXT,
        filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
        worker_id TEXT,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        processing_time_ms REAL,
        processing_mode TEXT NOT NULL DEFAULT 'local', -- 'local' or 'lambda'
        result_location TEXT,
        result_summary TEXT, -- JSON string of results
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE SET NULL
    );
    """)
    
    # 3. Workers table (tracks persistent worker states)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workers (
        worker_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'IDLE', -- 'IDLE', 'BUSY', 'OFFLINE'
        current_job_id TEXT,
        current_file TEXT,
        job_start_time TIMESTAMP,
        completed_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 4. Benchmarks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS benchmarks (
        id TEXT PRIMARY KEY,
        benchmark_name TEXT NOT NULL,
        file_count INTEGER NOT NULL,
        total_size_bytes INTEGER NOT NULL,
        sequential_time_ms REAL NOT NULL,
        parallel_time_ms REAL NOT NULL,
        worker_count INTEGER NOT NULL,
        speedup REAL NOT NULL,
        efficiency REAL NOT NULL,
        throughput_files_sec REAL NOT NULL,
        throughput_mb_sec REAL NOT NULL,
        details_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 5. Audit / System Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        level TEXT NOT NULL, -- 'INFO', 'WARN', 'ERROR', 'SUCCESS'
        category TEXT NOT NULL, -- 'JOB', 'WORKER', 'AWS', 'STORAGE', 'BENCHMARK', 'SYSTEM'
        message TEXT NOT NULL,
        details_json TEXT
    );
    """)
    
    conn.commit()
    conn.close()
    logger.info("Database schema verified and ready.")

# Helper utilities for DB operations
def log_event(level: str, category: str, message: str, details: Optional[Dict[str, Any]] = None):
    """Inserts a structured log into system_logs table."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO system_logs (level, category, message, details_json) VALUES (?, ?, ?, ?)",
            (level, category, message, json.dumps(details) if details else None)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to write event log: {e}")

# Initialize schema immediately on module load
init_db()
