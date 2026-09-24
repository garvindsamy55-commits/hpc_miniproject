# CloudBurst: Parallel File Processing System using Microsoft Azure
> **High Performance and Cloud Computing (HPCC) Mini-Project**  
> *A cloud-native and local parallel file processing platform with dynamic worker pool scaling, Azure Blob Storage integration, serverless Azure Functions compute, and real-time performance analytics.*

---

## 1. Project Overview & Abstract

**CloudBurst** is a high-performance distributed file-processing system designed to demonstrate core concepts in **Parallel Processing**, **High Performance Computing (HPC)**, and **Cloud Computing**. Modern cloud architectures require efficient, scalable file processing workflows for tasks such as log aggregation, image optimization, financial dataset parsing, and cryptographic verification.

CloudBurst provides a dual-engine architecture:
1. **Local Demo Mode (Zero-Config)**: Executes multi-worker file computation using Python `concurrent.futures` / `multiprocessing` and local storage without requiring Azure subscriptions or credentials.
2. **Azure Cloud Mode (Production)**: Seamlessly connects to **Microsoft Azure Blob Storage** (Input/Output containers) and **Azure Functions** (serverless event-driven processing) using the official `azure-storage-blob` SDK, following strict Azure RBAC least-privilege security principles.

### Key Highlights
- **Real File Processing Engine**: Computes SHA-256 cryptographic digests, word/line/char stats, CSV tabular statistics (min, max, mean), JSON structure depth, and image dimensions/metadata across TXT, LOG, CSV, JSON, PNG, JPG, and PDF formats.
- **Genuine Parallel Worker Pool**: Dynamic concurrency scaling from 1 to 16 worker threads with real-time state tracking (`IDLE`, `BUSY`), queue management, and CPU/RAM host telemetry.
- **Live HPC Performance Benchmark**: Interactive runner comparing Sequential vs. Parallel execution (2, 4, 8 workers) with dynamic calculation of **Speedup ($S$)**, **Parallel Efficiency ($E$)**, and **Throughput**.
- **Enterprise Security**: Browser *never* calls Azure directly; architecture strictly enforces `React Frontend → FastAPI API Gateway → Azure SDK → Azure Cloud Services`. No hard-coded secrets.

---

## 2. Architecture & Dataflow

```
+-------------------------------------------------------------------------+
|                    CloudBurst Web Dashboard (React)                     |
|            (Vite • TypeScript • Tailwind CSS • Lucide Icons)             |
+------------------------------------+------------------------------------+
                                     | HTTP / REST (JSON)
                                     v
+-------------------------------------------------------------------------+
|                        FastAPI Backend Gateway                          |
|             (Python 3.14 • Uvicorn • Pydantic • SQLite WAL)             |
+------------------------------------+------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v [LOCAL DEMO MODE]                                 v [AZURE CLOUD MODE]
+--------------------------------------+     +-------------------------------------+
|      Local Parallel Engine           |     |        Azure Cloud Services         |
|  - Storage: storage/uploads/         |     |  - Azure Blob Input Container       |
|  - Worker Pool: ThreadPoolExecutor   |     |  - Blob Trigger (Event-Driven)      |
|  - Queue: Priority FIFO Task Queue   |     |  - Azure Functions (azure_fn.py)    |
|  - Processors: SHA-256 / Data Engine |     |  - Azure Blob Output Container      |
|  - Output: storage/results/          |     |  - Results: results/{key}_result.json|
+--------------------------------------+     +-------------------------------------+
           |                                                   |
           +-------------------------+-------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  SQLite Metadata & Performance Store                    |
|             (Files, Jobs, Workers, Benchmarks, Audit Logs)              |
+-------------------------------------------------------------------------+
```

---

## 3. Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React, Axios, React Router | Modern cloud console dashboard with real-time polling |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic Settings, python-multipart, psutil | High-throughput async REST API and host monitoring |
| **HPC / Parallel** | `concurrent.futures`, `multiprocessing`, `threading`, `queue` | Multi-core task distribution and queue scheduling |
| **File Processors** | `hashlib`, `csv`, `json`, `Pillow` (PIL), `pypdf` | Cryptographic verification and structural data parsing |
| **Cloud Tier** | Azure Blob Storage, Azure Functions, `azure-storage-blob`, `azure-identity` | Cloud object storage and serverless event processing |
| **Database** | SQLite 3 with WAL Mode (`journal_mode=WAL`) | ACID metadata ledger and audit event logging |

---

## 4. Mathematical HPC Formulas

CloudBurst dynamically computes the following High Performance Computing metrics during batch runs and benchmarks:

### 1. Speedup ($S$)
$$\text{Speedup } (S) = \frac{T_{\text{sequential}}}{T_{\text{parallel}}}$$
*Where $T_{\text{sequential}}$ is the execution time with 1 worker, and $T_{\text{parallel}}$ is execution time with $p$ workers.*

### 2. Parallel Efficiency ($E$)
$$\text{Efficiency } (E) = \frac{S}{p} = \frac{T_{\text{sequential}}}{p \cdot T_{\text{parallel}}}$$
*Measures how effectively additional compute cores are utilized ($0 \le E \le 1.0$ or $0\% \text{ to } 100\%$).*

### 3. System Throughput
$$\text{Throughput} = \frac{N_{\text{files}}}{T_{\text{execution}} \text{ (seconds)}} \quad [\text{files/sec}]$$
$$\text{Data Throughput} = \frac{\text{Total Megabytes}}{T_{\text{execution}} \text{ (seconds)}} \quad [\text{MB/sec}]$$

### 4. Amdahl's Law (Theoretical Upper Bound)
$$\text{Speedup}_{\text{max}} = \frac{1}{(1 - P) + \frac{P}{N}}$$
*Where $P$ is the parallelizable fraction of the workload, and $(1 - P)$ is the strictly serial portion (e.g. disk I/O, network latency, database commits).*

---

## 5. Project Directory Structure

```
cloudburst/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application & CORS setup
│   │   ├── config.py                # Pydantic settings & environment resolution
│   │   ├── database.py              # SQLite WAL connection & logging
│   │   ├── models/                  # Pydantic data schemas
│   │   │   ├── file_model.py
│   │   │   ├── job_model.py
│   │   │   ├── worker_model.py
│   │   │   ├── performance_model.py
│   │   │   └── azure_model.py
│   │   ├── routes/                  # API REST endpoints
│   │   │   ├── health.py
│   │   │   ├── files.py
│   │   │   ├── jobs.py
│   │   │   ├── workers.py
│   │   │   ├── performance.py
│   │   │   ├── storage.py
│   │   │   ├── monitoring.py
│   │   │   └── azure.py
│   │   ├── services/                # Core business logic
│   │   │   ├── file_service.py
│   │   │   ├── processor.py         # Real file compute algorithms
│   │   │   ├── job_service.py
│   │   │   └── benchmark_service.py # Dynamic HPC benchmark engine
│   │   ├── workers/
│   │   │   └── worker_pool.py       # ThreadPool scheduler & worker manager
│   │   └── azure/
│   │       ├── blob_client.py       # Azure Blob storage manager
│   │       └── azure_function.py    # Azure Function blob-trigger handler
│   ├── storage/                     # Local storage root
│   │   ├── uploads/
│   │   └── results/
│   ├── tests/                       # Automated pytest test suite
│   │   ├── test_health.py
│   │   ├── test_files.py
│   │   ├── test_processing.py
│   │   ├── test_workers.py
│   │   ├── test_performance.py
│   │   └── test_azure.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # 10 Application pages
│   │   ├── services/
│   │   │   ├── api.ts               # REST API client
│   │   │   └── mockData.ts          # Simulated Azure engine data
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── AZURE_DEPLOYMENT.md
├── PERFORMANCE.md
└── DEMO_GUIDE.md
```

---

## 6. Installation & Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js v18+** & **npm v9+**

### Step 1: Clone or Navigate to Directory
```bash
cd cloudburst
```

### Step 2: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
```

Start the FastAPI backend server:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### Step 3: Frontend Setup
Open a second terminal window:
```bash
cd cloudburst/frontend
npm install
npm run dev
```
- Open your browser to `http://localhost:5173`

---

## 7. Running Backend Unit Tests

Run the automated test suite:
```bash
cd cloudburst
python -m pytest backend/tests -v
```

---

## 8. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Returns backend health, mode, version, and active workers |
| `/api/files` | `GET` | Lists all indexed input files with sizes and hashes |
| `/api/files/upload` | `POST` | Uploads a single file (multipart/form-data) |
| `/api/files/{id}` | `GET` | Gets file metadata |
| `/api/files/{id}` | `DELETE` | Deletes file record and local storage |
| `/api/files/samples` | `POST` | Generates synthetic sample logs, CSVs, and JSON files |
| `/api/jobs` | `GET` | Lists all jobs with status filter (`QUEUED`, `PROCESSING`, etc.) |
| `/api/jobs/{id}` | `GET` | Retrieves full job details and parsed JSON computation results |
| `/api/jobs/process` | `POST` | Dispatches files to the parallel worker queue |
| `/api/jobs/clear` | `DELETE` | Clears finished/failed jobs from history |
| `/api/workers` | `GET` | Returns live worker slots, CPU/RAM load, and queue size |
| `/api/workers/config` | `POST` | Dynamically resizes worker pool count (1 to 16) |
| `/api/performance` | `GET` | Returns benchmark history and HPC formulas |
| `/api/performance/benchmark` | `POST` | Executes real live sequential vs. parallel benchmark |
| `/api/metrics` | `GET` | Aggregated metrics for dashboard summary cards |
| `/api/storage` | `GET` | Overview of local storage directories and Azure Blob containers |
| `/api/storage/results/{id}` | `GET` | Downloads generated JSON analysis artifact |
| `/api/monitoring/logs` | `GET` | Retrieves live system event audit log stream |
| `/api/azure/status` | `GET` | Validates Azure credentials and Blob container accessibility |
| `/api/azure/storage/files` | `GET` | Lists blobs in input and output containers |
| `/api/azure/storage/upload` | `POST` | Uploads a file directly to the Azure Blob input container |
| `/api/azure/config` | `POST` | Updates active Azure settings (region, account, containers) |

---

## 9. College Viva Q&A Reference

### Q1: What is Cloud Computing?
**Answer**: Cloud computing is the on-demand delivery of IT resources (compute, storage, databases, networking) via the internet with pay-as-you-go pricing. CloudBurst utilizes IaaS (Azure Blob storage) and serverless FaaS (Azure Functions).

### Q2: Does Azure Blob Storage perform computation?
**Answer**: No. Azure Blob Storage is an object storage service designed for high durability and availability. It stores data blobs, while compute is executed by Azure Functions or parallel compute worker pools.

### Q3: What is the difference between Sequential and Parallel processing?
**Answer**: Sequential processing processes files one after another ($T = \sum T_i$). Parallel processing executes independent file tasks concurrently across multiple worker threads on multiple CPU cores, achieving Speedup $S = T_{\text{seq}} / T_{\text{par}}$.

### Q4: What is Amdahl's Law?
**Answer**: Amdahl's Law states that maximum speedup is strictly limited by the serial portion $(1 - P)$ of a program: $S_{\text{max}} = 1 / ((1 - P) + (P / N))$.

### Q5: Why does CloudBurst enforce backend Azure calls?
**Answer**: Direct browser-to-Azure communication would require exposing Azure client secrets or opening anonymous public write access to Blob containers. CloudBurst implements enterprise API Gateway mediation (`React → FastAPI → Azure SDK → Azure Cloud`).

---

## 10. Authors & Credits
- **Project**: CloudBurst — Parallel File Processing System using Microsoft Azure
- **Course**: High Performance and Cloud Computing (HPCC)
- **Year**: 2026
