# CloudBurst Architecture Specification

This document details the architectural design, component interactions, security posture, and concurrency models of **CloudBurst: Parallel File Processing System using Microsoft Azure**.

---

## 1. Architectural Philosophy

CloudBurst is built on four core distributed systems principles:
1. **Decoupled Compute & Storage**: Storage (local disk / Azure Blob Storage) is strictly independent from execution workers. Compute workers can be scaled, paused, or restarted without data loss.
2. **Zero-Secret Client Architecture**: The browser frontend never stores, requests, or handles Azure credentials. The FastAPI backend acts as an authenticated API Gateway and reverse proxy.
3. **Dual Operating Engine**: Seamless transition between an offline **Local Demo Engine** (for classroom demonstrations without cloud costs) and production **Azure Cloud Mode** (leveraging Azure Blob Storage and Azure Functions).
4. **Resilient Concurrency & ACID Metadata**: Worker tasks synchronize status transitions in an SQLite ledger enabled with Write-Ahead Logging (WAL) to prevent lock contention.

---

## 2. Component Breakdown

```
+---------------------------------------------------------------------------------+
|                               PRESENTATION TIER                                 |
|                                                                                 |
|   [ React 18 + Vite ] <---> [ Tailwind Design System ] <---> [ Axios Client ]   |
|         - Dashboard                - Theme / Tokens              - Typed APIs   |
|         - File Upload              - Responsive Grid             - Polling Loop |
|         - Job Monitor              - Glowing Statuses            - Error Trap   |
+----------------------------------------+----------------------------------------+
                                         | REST / JSON (Port 5173 -> 8000)
                                         v
+---------------------------------------------------------------------------------+
|                           API GATEWAY & COMPUTE TIER                            |
|                                                                                 |
|   [ FastAPI Router ] ----> [ Worker Pool Scheduler ] ----> [ File Processors ]  |
|     - CORS Middleware        - ThreadPoolExecutor (1-16)    - SHA-256 Engine    |
|     - Path Traversal Guard   - FIFO Queue Manager           - CSV/JSON Analytics|
|     - Pydantic Validation    - Host Telemetry (psutil)      - Image / PDF Parser|
+--------------------+-----------------------------------+------------------------+
                     |                                   |
                     | Local I/O                         | Azure SDK
                     v                                   v
+------------------------------------+   +----------------------------------------+
|          LOCAL STORAGE             |   |           AZURE CLOUD TIER             |
|  - storage/uploads/ (Raw Files)    |   |  - Azure Blob Input Container          |
|  - storage/results/ (JSON Results) |   |  - Blob Trigger: Event-Driven          |
|  - storage/cloudburst.db (WAL DB)  |   |  - Azure Functions (Serverless Compute)|
|                                    |   |  - Azure Blob Output Container         |
+------------------------------------+   +----------------------------------------+
```

---

## 3. Worker Concurrency Model

CloudBurst implements a **ThreadPool Worker Pool** orchestrated by `WorkerPoolManager`:
- A fixed underlying pool with capacity for up to 16 threads runs in background.
- Dynamic concurrency scaling is governed by an active token queue (`_available_worker_ids`).
- When 4 workers and 8 files are queued:
  1. Workers 1–4 immediately acquire jobs and transition to `BUSY`.
  2. Workers 5–8 remain in queue until slots are active.
  3. As each worker finishes processing its file, it automatically records its output in the SQLite DB, releases its worker slot, and dequeues the next pending file task.
  4. Non-blocking state updates ensure zero deadlock or CPU spin-waiting.

---

## 4. Azure Cloud Integration Pattern

In Azure Cloud Mode:
1. **File Ingestion**: Uploaded files are pushed to `AZURE_BLOB_INPUT_CONTAINER` using Azure SDK's `upload_blob` with chunked block upload support.
2. **Serverless Trigger**: Azure Blob Storage triggers event execution for newly created blobs.
3. **Azure Function Execution**: `azure_function.py` receives the blob event stream, computes the cryptographic SHA-256 digest and data analytics, and writes the structured result to `AZURE_BLOB_OUTPUT_CONTAINER`.
4. **Console Aggregation**: The CloudBurst web dashboard queries `GET /api/azure/storage/files` to render live container contents and download results directly through secure signed streams.

---

## 5. Security & Threat Mitigation

- **Path Traversal Defense**: All input filenames are sanitized via `re.sub(r'[^a-zA-Z0-9_.-]', '_', Path(name).name)` preventing `../../` directory escapes.
- **File Size Limits**: Backend rejects payloads larger than `MAX_FILE_SIZE_MB` (50MB by default).
- **Extension Whitelisting**: Strict validation against allowed formats (`txt`, `csv`, `json`, `log`, `png`, `jpg`, `pdf`).
- **Traceback Shielding**: Global FastAPI exception handlers suppress Python internal stack traces and environment variables from client responses.
