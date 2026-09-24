import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db, log_event
from app.routes import health, files, jobs, workers, performance, storage, monitoring, aws, azure

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cloudburst.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Initializing {settings.APP_NAME} ({settings.APP_SUBTITLE}) v{settings.VERSION}")
    init_db()
    log_event("INFO", "SYSTEM", f"CloudBurst backend started in '{settings.OPERATING_MODE.upper()}' mode")
    yield
    # Shutdown
    logger.info("CloudBurst backend shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    description="High Performance & Cloud Computing Parallel File Processing System using Azure Blob Storage, Azure Functions, and Local Parallel Worker Pools.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to avoid leaking internal tracebacks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    log_event("ERROR", "SYSTEM", f"Unhandled error: {str(exc)}", {"path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check backend logs for details."}
    )

# Include all route modules
app.include_router(health.router)
app.include_router(files.router)
app.include_router(jobs.router)
app.include_router(workers.router)
app.include_router(performance.router)
app.include_router(storage.router)
app.include_router(monitoring.router)
app.include_router(azure.router)
app.include_router(aws.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
