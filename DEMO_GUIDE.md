# CloudBurst Demonstration & College Viva Presentation Script

This guide provides a structured 5-minute walkthrough script for demonstrating **CloudBurst: Parallel File Processing System using Microsoft Azure** during college lab examinations and project vivas.

---

## Pre-Demo Checklist & Startup

1. **Start Backend Server**:
   ```bash
   cd cloudburst/backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. **Start Frontend Dev Server**:
   ```bash
   cd cloudburst/frontend
   npm run dev
   ```
3. Open Chrome or Edge to **`http://localhost:5173`**.

---

## 5-Minute Demonstration Script

### Step 1: Introduction (30 Seconds)
- **Say**: *"Good morning/afternoon, professors. Today I am presenting **CloudBurst: Parallel File Processing System using Microsoft Azure**, built for the High Performance and Cloud Computing course."*
- **Show**: Point to the top branding: **CLOUDBURST — Parallel File Processing System using Azure**.
- **Explain**: *"CloudBurst bridges High Performance Computing parallel worker algorithms with modern Cloud Computing infrastructure (Azure Blob Storage and Azure Functions). It features a zero-credential Local Demo Mode for live demonstrations and an Azure Cloud Mode for production."*

### Step 2: File Ingestion & Sample Generation (45 Seconds)
- **Click**: Navigate to **File Upload** or click **"Load Sample Files"** in the top header.
- **Show**: Synthetic demonstration files appear instantly (Log, CSV, JSON, TXT).
- **Explain**: *"Files are validated, sanitized to prevent directory traversal attacks, and indexed with unique identifiers."*

### Step 3: Dispatching Parallel Processing (60 Seconds)
- **Click**: Click **"Process All Parallel"** (or **"Process All ⚡ Azure Fn"**).
- **Navigate**: Switch to **Processing Jobs** or **Parallel Workers**.
- **Show**: Observe the worker threads (`Worker-Alpha`, `Worker-Beta`, etc.) transitioning to `BUSY` status and processing files concurrently.
- **Click**: Click the eye icon on any completed job to open the **Job Analysis Modal**.
- **Show**: Highlight the computed SHA-256 hash, word counts, CSV column averages, and processing duration in milliseconds.

### Step 4: Live HPC Performance Benchmarking (90 Seconds)
- **Click**: Navigate to **Performance** tab.
- **Click**: Click **"Run HPC Benchmark"** (8 files, 256KB workload).
- **Show**: Live benchmark measures sequential execution (1 worker) vs. parallel execution (2, 4, 8 workers).
- **Explain**:
  - *"Here we dynamically calculate **Speedup $S = T_1 / T_p$**, which achieves over **3.5x to 6.0x acceleration**."*
  - *"We also calculate **Parallel Efficiency $E = S / p$** and **Throughput in files/second**."*
  - *"Notice how efficiency naturally moderates as worker count increases due to Amdahl's Law and serial disk I/O overhead."*

### Step 5: System Architecture & Azure Mode (60 Seconds)
- **Click**: Navigate to **Architecture** tab.
- **Show**: Toggle between **Local Demo Architecture** and **Azure Cloud Architecture**.
- **Explain**:
  - *"In Azure Cloud Mode, files are stored in Azure Blob Storage Input/Output containers."*
  - *"A Blob Trigger invokes our Azure Functions handler serverlessly."*
  - *"The browser never communicates directly with Azure; all requests pass through our FastAPI API Gateway following least-privilege Azure RBAC and Managed Identity security."*

### Step 6: Viva Questions & Wrap-Up (15 Seconds)
- **Click**: Open the **About Project** tab to reference the comprehensive Viva Q&A ledger.
