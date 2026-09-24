// ============================================================================
// CloudBurst – Azure Mock Data Engine
// All data is synthetically generated to simulate a real Azure environment.
// ============================================================================

import {
  HealthStatus,
  FileRecord,
  FileListResponse,
  JobRecord,
  JobListResponse,
  WorkerInfo,
  WorkerPoolStats,
  BenchmarkRunResult,
  WorkerBenchmarkPoint,
  SystemMetrics,
  AzureStatus,
  BlobObjectInfo,
  BlobListResponse,
  StorageOverview,
  SystemLog,
} from '../types';

// ── Utility helpers ─────────────────────────────────────────────────────────
let _jobSeq = 1;
let _logSeq = 1;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, dp = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dp));
}
function isoNow(offsetSec = 0) {
  return new Date(Date.now() - offsetSec * 1000).toISOString();
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

// ── Static seeds (mutated at runtime) ───────────────────────────────────────
const WORKER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
const FILE_NAMES = [
  'genomics_batch_001.csv', 'financial_report_Q3.txt', 'logs_server_access.log',
  'image_dataset_raw.bin', 'sales_transactions.json', 'ml_training_features.csv',
  'weather_sensor_data.csv', 'audit_log_system.log', 'biomedical_records.json',
  'network_packets_cap.txt', 'config_deployment.yaml', 'research_corpus.txt',
];
const BLOB_INPUT_KEYS = [
  'uploads/genomics_batch_001.csv', 'uploads/financial_report_Q3.txt',
  'uploads/logs_server_access.log', 'uploads/sales_transactions.json',
  'uploads/ml_training_features.csv', 'uploads/weather_sensor_data.csv',
];
const BLOB_OUTPUT_KEYS = [
  'results/job_a1b2/result_genomics_batch_001.json', 'results/job_c3d4/result_financial_report_Q3.json',
  'results/job_e5f6/result_logs_server_access.json', 'results/job_g7h8/result_sales_transactions.json',
];

// Mutable state
let _totalFiles = 12;
let _completedFiles = 9;
let _pendingJobs = 2;
let _failedJobs = 1;
let _activeWorkers = 3;
let _cpuPercent = randFloat(35, 65, 1);
let _memPercent = randFloat(42, 68, 1);
let _avgSpeedup = 3.7;
let _throughput = 4.2;
let _avgTime = 312;

// ── Static data pools ────────────────────────────────────────────────────────
const STATIC_FILES: FileRecord[] = FILE_NAMES.map((name, i) => ({
  id: `f-${i + 1}-${uuid().slice(0, 8)}`,
  filename: name,
  original_name: name,
  file_size: randInt(8192, 2097152),
  file_type: name.split('.').pop() || 'bin',
  file_path: `blob://cloudburst-input-container/uploads/${name}`,
  sha256_hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  storage_type: 'blob',
  upload_time: isoNow(randInt(60, 7200)),
  status: i < 9 ? 'PROCESSED' : i === 9 ? 'PROCESSING' : i === 10 ? 'UPLOADED' : 'FAILED',
}));

const STATIC_JOBS: JobRecord[] = STATIC_FILES.slice(0, 11).map((f, i) => {
  const workerIdx = i % WORKER_NAMES.length;
  const procMs = randInt(120, 800);
  const endTime = isoNow(randInt(5, 3600));
  const startTime = new Date(new Date(endTime).getTime() - procMs).toISOString();
  return {
    job_id: `job-${(_jobSeq++).toString().padStart(4, '0')}-${uuid().slice(0, 6)}`,
    file_id: f.id,
    filename: f.filename,
    file_size: f.file_size,
    status: i < 9 ? 'COMPLETED' : i === 9 ? 'PROCESSING' : 'FAILED',
    worker_id: `W-${WORKER_NAMES[workerIdx]}`,
    start_time: startTime,
    end_time: i < 9 ? endTime : undefined,
    processing_time_ms: i < 9 ? procMs : undefined,
    processing_mode: 'azure-parallel',
    result_location: i < 9 ? `blob://cloudburst-output-container/results/job-${i + 1}/result_${f.filename.replace(/\.[^.]+$/, '.json')}` : undefined,
    result_summary: i < 9 ? {
      file_type: f.file_type,
      sha256: f.sha256_hash,
      char_count: randInt(5000, 500000),
      word_count: randInt(500, 50000),
      line_count: randInt(100, 10000),
      processing_time_ms: procMs,
      blob_result_key: `results/job-${i + 1}/result.json`,
    } : undefined,
    error_message: i === 10 ? 'Worker timeout: Azure Function exceeded execution time limit.' : undefined,
    created_at: isoNow(randInt(60, 7200)),
  };
});

const STATIC_WORKERS: WorkerInfo[] = WORKER_NAMES.map((name, i) => ({
  worker_id: `W-${name}`,
  name: `Worker-${name}`,
  status: i < 3 ? 'BUSY' : i < 7 ? 'IDLE' : 'OFFLINE',
  current_job_id: i < 3 ? STATIC_JOBS[i]?.job_id : undefined,
  current_file: i < 3 ? STATIC_FILES[i]?.filename : undefined,
  job_start_time: i < 3 ? isoNow(randInt(5, 120)) : undefined,
  completed_count: randInt(5, 40),
  error_count: randInt(0, 2),
  last_active_time: isoNow(randInt(5, 600)),
}));

const STATIC_LOGS: SystemLog[] = [
  { id: _logSeq++, timestamp: isoNow(5), level: 'SUCCESS', category: 'JOB', message: 'Job job-0009 completed in 284ms on W-Gamma. Result uploaded to Azure Blob.' },
  { id: _logSeq++, timestamp: isoNow(12), level: 'INFO', category: 'WORKER', message: 'W-Alpha assigned job-0010 (ml_training_features.csv).' },
  { id: _logSeq++, timestamp: isoNow(18), level: 'INFO', category: 'AZURE', message: 'Azure Blob block upload initiated: uploads/ml_training_features.csv → cloudburst-input-container.' },
  { id: _logSeq++, timestamp: isoNow(30), level: 'SUCCESS', category: 'AZURE', message: 'Azure Function cloudburst-processor invoked. InvocationId: f3a9b2c1.' },
  { id: _logSeq++, timestamp: isoNow(55), level: 'INFO', category: 'BENCHMARK', message: 'Speedup benchmark completed: 4-worker config achieves 3.8x speedup (95.1% efficiency).' },
  { id: _logSeq++, timestamp: isoNow(88), level: 'WARN', category: 'WORKER', message: 'W-Theta reported high memory usage (87%). Throttling new job assignments.' },
  { id: _logSeq++, timestamp: isoNow(120), level: 'ERROR', category: 'JOB', message: 'Job job-0011 failed on W-Epsilon: Function execution timeout exceeded limit.' },
  { id: _logSeq++, timestamp: isoNow(185), level: 'SUCCESS', category: 'STORAGE', message: 'Azure output container sync complete: 9 result files verified (ETags matched).' },
  { id: _logSeq++, timestamp: isoNow(240), level: 'INFO', category: 'SYSTEM', message: 'Worker pool scaled to 8 threads. CPU: 47.3%, Memory: 52.1%.' },
  { id: _logSeq++, timestamp: isoNow(310), level: 'SUCCESS', category: 'AZURE', message: 'Managed Identity credentials refreshed. Region: eastus.' },
  { id: _logSeq++, timestamp: isoNow(400), level: 'INFO', category: 'JOB', message: 'Parallel batch dispatched: 9 files across 8 workers using ThreadPoolExecutor.' },
  { id: _logSeq++, timestamp: isoNow(520), level: 'INFO', category: 'STORAGE', message: 'Azure Monitor telemetry pushed: avg_latency=312ms, throughput=4.2 files/sec.' },
  { id: _logSeq++, timestamp: isoNow(700), level: 'SUCCESS', category: 'BENCHMARK', message: 'Sequential baseline: 2841ms. Parallel (8w): 432ms. Speedup: 6.58x.' },
  { id: _logSeq++, timestamp: isoNow(900), level: 'INFO', category: 'AZURE', message: 'Azure Service Bus queue cloudburst-jobs polled. 3 messages retrieved.' },
  { id: _logSeq++, timestamp: isoNow(1200), level: 'INFO', category: 'SYSTEM', message: 'CloudBurst v1.0.0 initialized in Azure mode. Region: eastus.' },
];

const BLOB_INPUT_FILES: BlobObjectInfo[] = BLOB_INPUT_KEYS.map((key) => ({
  key,
  size: randInt(8192, 2097152),
  last_modified: isoNow(randInt(60, 86400)),
  storage_class: 'Hot',
  bucket_type: 'input',
  etag: `"${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}"`,
}));

const BLOB_OUTPUT_FILES: BlobObjectInfo[] = BLOB_OUTPUT_KEYS.map((key) => ({
  key,
  size: randInt(1024, 65536),
  last_modified: isoNow(randInt(5, 43200)),
  storage_class: 'Cool',
  bucket_type: 'output',
  etag: `"${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}"`,
}));

// ── Benchmark data generator ──────────────────────────────────────────────────
function generateBenchmarkPoints(fileCount: number, fileSizeKb: number, workerCounts: number[], workloadType: string): WorkerBenchmarkPoint[] {
  const baseMs = fileCount * fileSizeKb * (workloadType === 'heavy' ? 1.8 : workloadType === 'light' ? 0.6 : 1.0) * randFloat(0.9, 1.1, 2);
  return workerCounts.map((wc) => {
    const parallelFraction = workloadType === 'light' ? 0.80 : workloadType === 'heavy' ? 0.95 : 0.90;
    const theoreticalSpeedup = 1 / ((1 - parallelFraction) + parallelFraction / wc);
    const realSpeedup = theoreticalSpeedup * randFloat(0.85, 0.98, 3);
    const execMs = Math.round(baseMs / realSpeedup);
    const efficiency = realSpeedup / wc;
    return {
      worker_count: wc,
      execution_time_ms: execMs,
      speedup: parseFloat(realSpeedup.toFixed(2)),
      efficiency: parseFloat(efficiency.toFixed(3)),
      efficiency_percent: parseFloat((efficiency * 100).toFixed(1)),
      throughput_files_sec: parseFloat((fileCount / (execMs / 1000)).toFixed(2)),
      throughput_mb_sec: parseFloat(((fileCount * fileSizeKb) / 1024 / (execMs / 1000)).toFixed(2)),
      cpu_utilization_percent: parseFloat(Math.min(95, wc * randFloat(8, 13, 1)).toFixed(1)),
    };
  });
}

// ── Exported mock state ───────────────────────────────────────────────────────
let _jobs = [...STATIC_JOBS];
let _files = [...STATIC_FILES];
let _workers = [...STATIC_WORKERS];
let _logs = [...STATIC_LOGS];

function tickLiveState() {
  _cpuPercent = Math.max(15, Math.min(95, _cpuPercent + randFloat(-4, 4, 1)));
  _memPercent = Math.max(30, Math.min(85, _memPercent + randFloat(-2, 2, 1)));
  _workers = _workers.map((w) => ({
    ...w,
    status: w.status === 'OFFLINE' ? 'OFFLINE' : Math.random() < 0.15
      ? (w.status === 'BUSY' ? 'IDLE' : 'BUSY')
      : w.status,
  }));
  _activeWorkers = _workers.filter((w) => w.status === 'BUSY').length;
}

// ── Mock API responses ────────────────────────────────────────────────────────
export const mockApi = {
  getHealth: (): HealthStatus => ({
    status: 'healthy',
    app_name: 'CloudBurst',
    subtitle: 'Parallel File Processing System using Azure',
    version: '1.0.0',
    operating_mode: 'azure',
    database_connected: true,
    worker_count: 8,
    active_workers: _activeWorkers,
    timestamp_utc: isoNow(),
  }),

  getMetrics: (): SystemMetrics => {
    tickLiveState();
    return {
      total_files: _totalFiles,
      completed_files: _completedFiles,
      pending_jobs: _pendingJobs,
      failed_jobs: _failedJobs,
      active_workers: _activeWorkers,
      total_workers: 8,
      avg_processing_time_ms: Math.round(_avgTime + randFloat(-20, 20)),
      overall_throughput_files_sec: parseFloat((_throughput + randFloat(-0.3, 0.3)).toFixed(2)),
      average_speedup: parseFloat((_avgSpeedup + randFloat(-0.1, 0.1)).toFixed(2)),
      average_efficiency: parseFloat(((_avgSpeedup / 8) * randFloat(0.95, 1.05)).toFixed(3)),
      system_cpu_percent: _cpuPercent,
      system_memory_percent: _memPercent,
      operating_mode: 'azure',
    };
  },

  getFiles: (): FileListResponse => ({
    total_files: _files.length,
    total_size_bytes: _files.reduce((s, f) => s + f.file_size, 0),
    files: _files,
  }),

  uploadFile: (file: File): any => {
    const newFile: FileRecord = {
      id: `f-${_files.length + 1}-${uuid().slice(0, 8)}`,
      filename: file.name,
      original_name: file.name,
      file_size: file.size,
      file_type: file.name.split('.').pop() || 'bin',
      file_path: `blob://cloudburst-input-container/uploads/${file.name}`,
      storage_type: 'blob',
      upload_time: isoNow(),
      status: 'UPLOADED',
    };
    _files = [newFile, ..._files];
    _totalFiles++;
    _logs = [{ id: _logSeq++, timestamp: isoNow(), level: 'INFO', category: 'AZURE', message: `Blob upload complete: ${file.name} → cloudburst-input-container (${fmtBytes(file.size)}).` }, ..._logs];
    return { success: true, file: newFile };
  },

  deleteFile: (fileId: string): void => {
    _files = _files.filter((f) => f.id !== fileId);
    _totalFiles = Math.max(0, _totalFiles - 1);
  },

  generateSamples: (): { success: boolean; count: number; files: any[] } => {
    return { success: true, count: 6, files: _files.slice(0, 6) };
  },

  getJobs: (): JobListResponse => ({
    total_jobs: _jobs.length,
    queued_count: _jobs.filter((j) => j.status === 'QUEUED').length,
    processing_count: _jobs.filter((j) => j.status === 'PROCESSING').length,
    completed_count: _jobs.filter((j) => j.status === 'COMPLETED').length,
    failed_count: _jobs.filter((j) => j.status === 'FAILED').length,
    jobs: _jobs,
  }),

  getJobById: (jobId: string): JobRecord | undefined => _jobs.find((j) => j.job_id === jobId),

  dispatchJobs: (payload: { file_ids?: string[]; all_unprocessed?: boolean; worker_count?: number }): any => {
    const count = payload.all_unprocessed ? _files.filter((f) => f.status === 'UPLOADED').length : (payload.file_ids?.length ?? 3);
    _logs = [{ id: _logSeq++, timestamp: isoNow(), level: 'INFO', category: 'JOB', message: `Batch dispatched: ${count} jobs assigned across ${payload.worker_count || 8} parallel workers.` }, ..._logs];
    return { success: true, dispatched: count, message: `${count} jobs queued for parallel processing.` };
  },

  clearJobs: (): void => { _jobs = []; },

  getWorkers: (): WorkerPoolStats => {
    tickLiveState();
    return {
      total_workers: _workers.length,
      active_workers: _workers.filter((w) => w.status === 'BUSY').length,
      idle_workers: _workers.filter((w) => w.status === 'IDLE').length,
      offline_workers: _workers.filter((w) => w.status === 'OFFLINE').length,
      queue_size: _jobs.filter((j) => j.status === 'QUEUED').length,
      system_cpu_percent: _cpuPercent,
      system_memory_percent: _memPercent,
      workers: _workers,
    };
  },

  updateWorkerCount: (workerCount: number): WorkerPoolStats => {
    const clamped = Math.max(1, Math.min(16, workerCount));
    _workers = WORKER_NAMES.slice(0, clamped).map((name, i) => ({
      worker_id: `W-${name}`,
      name: `Worker-${name}`,
      status: i < 2 ? 'BUSY' : 'IDLE',
      completed_count: randInt(5, 30),
      error_count: 0,
      last_active_time: isoNow(),
    }));
    _logs = [{ id: _logSeq++, timestamp: isoNow(), level: 'INFO', category: 'SYSTEM', message: `Worker pool resized to ${clamped} threads.` }, ..._logs];
    return mockApi.getWorkers();
  },

  getPerformance: (): { history: any[]; latest: any } => ({
    history: [
      { id: 'bm-001', file_count: 8, total_size_bytes: 524288, worker_count: 4, sequential_time_ms: 2840, speedup: 3.72, throughput_files_sec: 4.2, created_at: isoNow(3600), details: generateBenchmarkPoints(8, 64, [1,2,4,8], 'mixed') },
      { id: 'bm-002', file_count: 12, total_size_bytes: 786432, worker_count: 8, sequential_time_ms: 4110, speedup: 5.81, throughput_files_sec: 6.8, created_at: isoNow(7200), details: generateBenchmarkPoints(12, 64, [1,2,4,8], 'heavy') },
    ],
    latest: { id: 'bm-001', file_count: 8, total_size_bytes: 524288, worker_count: 4, sequential_time_ms: 2840, speedup: 3.72, throughput_files_sec: 4.2, created_at: isoNow(3600), details: generateBenchmarkPoints(8, 64, [1,2,4,8], 'mixed') },
  }),

  runBenchmark: (payload: { file_count: number; file_size_kb: number; worker_counts: number[]; workload_type: string }): BenchmarkRunResult => {
    const totalBytes = payload.file_count * payload.file_size_kb * 1024;
    const points = generateBenchmarkPoints(payload.file_count, payload.file_size_kb, payload.worker_counts, payload.workload_type);
    const best = points.reduce((a, b) => (a.speedup > b.speedup ? a : b));
    const seqMs = Math.round(payload.file_count * payload.file_size_kb * (payload.workload_type === 'heavy' ? 55 : 35));
    _logs = [{ id: _logSeq++, timestamp: isoNow(), level: 'SUCCESS', category: 'BENCHMARK', message: `Benchmark complete: ${best.worker_count}w optimal, ${best.speedup}x speedup, ${best.throughput_files_sec} files/sec.` }, ..._logs];
    return {
      benchmark_id: `bm-${uuid().slice(0, 8)}`,
      workload_type: payload.workload_type,
      file_count: payload.file_count,
      total_size_bytes: totalBytes,
      total_size_formatted: fmtBytes(totalBytes),
      sequential_time_ms: seqMs,
      points,
      best_worker_count: best.worker_count,
      max_speedup: best.speedup,
      max_throughput_files_sec: best.throughput_files_sec,
      timestamp: isoNow(),
    };
  },

  getStorage: (): StorageOverview => ({
    operating_mode: 'azure',
    local_storage: {
      uploads_dir: '/tmp/cloudburst/uploads',
      uploads_count: _files.length,
      uploads_bytes: _files.reduce((s, f) => s + f.file_size, 0),
      uploads_formatted: fmtBytes(_files.reduce((s, f) => s + f.file_size, 0)),
      results_dir: '/tmp/cloudburst/results',
      results_count: _jobs.filter((j) => j.status === 'COMPLETED').length,
      results_bytes: _jobs.filter((j) => j.status === 'COMPLETED').length * randInt(2048, 16384),
      results_formatted: fmtBytes(_jobs.filter((j) => j.status === 'COMPLETED').length * 8192),
    },
    azure_blob_storage: {
      is_connected: true,
      region: 'eastus',
      input_bucket: 'cloudburst-input-container',
      input_bucket_accessible: true,
      output_bucket: 'cloudburst-output-container',
      output_bucket_accessible: true,
      message: 'Connected to Azure Blob Storage – eastus',
    },
    aws_s3_storage: {
      is_connected: true,
      region: 'eastus',
      input_bucket: 'cloudburst-input-container',
      input_bucket_accessible: true,
      output_bucket: 'cloudburst-output-container',
      output_bucket_accessible: true,
      message: 'Connected to Azure Blob Storage – eastus',
    },
  }),

  getAzureStatus: (): AzureStatus => ({
    is_connected: true,
    operating_mode: 'azure',
    region: 'eastus',
    profile: 'cloudburst-sp',
    input_bucket: 'cloudburst-input-container',
    input_bucket_accessible: true,
    output_bucket: 'cloudburst-output-container',
    output_bucket_accessible: true,
    message: 'Azure credentials verified. Blob containers accessible.',
    credentials_source: 'managed-identity',
  }),

  getBlobFiles: (): BlobListResponse => ({
    input_bucket: 'cloudburst-input-container',
    input_bucket_accessible: true,
    input_files_count: BLOB_INPUT_FILES.length,
    input_files: BLOB_INPUT_FILES,
    output_bucket: 'cloudburst-output-container',
    output_bucket_accessible: true,
    output_files_count: BLOB_OUTPUT_FILES.length,
    output_files: BLOB_OUTPUT_FILES,
  }),

  getAwsStatus: (): AzureStatus => mockApi.getAzureStatus(),
  getS3Files: (): BlobListResponse => mockApi.getBlobFiles(),

  getLogs: (params?: { limit?: number }): { total_returned: number; logs: SystemLog[] } => {
    const limit = params?.limit ?? 100;
    return { total_returned: _logs.length, logs: _logs.slice(0, limit) };
  },

  clearLogs: (): void => { _logs = []; },

  updateAzureConfig: (_: any): any => ({ success: true, operating_mode: 'azure', message: 'Azure configuration updated (simulation).' }),
  updateAwsConfig: (config: any): any => mockApi.updateAzureConfig(config),
};
