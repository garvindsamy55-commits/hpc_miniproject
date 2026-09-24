export type OperatingMode = 'local' | 'azure' | 'aws';

export type JobStatusType = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type WorkerStatusType = 'IDLE' | 'BUSY' | 'OFFLINE';

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  app_name: string;
  subtitle: string;
  version: string;
  operating_mode: OperatingMode;
  database_connected: boolean;
  worker_count: number;
  active_workers: number;
  timestamp_utc: string;
}

export interface FileRecord {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  sha256_hash?: string;
  storage_type: 'local' | 'blob' | 's3';
  upload_time: string;
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DELETED';
}

export interface FileListResponse {
  total_files: number;
  total_size_bytes: number;
  files: FileRecord[];
}

export interface JobRecord {
  job_id: string;
  file_id?: string;
  filename: string;
  file_size: number;
  status: JobStatusType;
  worker_id?: string;
  start_time?: string;
  end_time?: string;
  processing_time_ms?: number;
  processing_mode: string;
  result_location?: string;
  result_summary?: any;
  result_details?: any;
  error_message?: string;
  created_at: string;
}

export interface JobListResponse {
  total_jobs: number;
  queued_count: number;
  processing_count: number;
  completed_count: number;
  failed_count: number;
  jobs: JobRecord[];
}

export interface WorkerInfo {
  worker_id: string;
  name: string;
  status: WorkerStatusType;
  current_job_id?: string;
  current_file?: string;
  job_start_time?: string;
  completed_count: number;
  error_count: number;
  last_active_time?: string;
}

export interface WorkerPoolStats {
  total_workers: number;
  active_workers: number;
  idle_workers: number;
  offline_workers: number;
  queue_size: number;
  system_cpu_percent: number;
  system_memory_percent: number;
  workers: WorkerInfo[];
}

export interface WorkerBenchmarkPoint {
  worker_count: number;
  execution_time_ms: number;
  speedup: number;
  efficiency: number;
  efficiency_percent: number;
  throughput_files_sec: number;
  throughput_mb_sec: number;
  cpu_utilization_percent: number;
}

export interface BenchmarkRunResult {
  benchmark_id: string;
  workload_type: string;
  file_count: number;
  total_size_bytes: number;
  total_size_formatted: string;
  sequential_time_ms: number;
  points: WorkerBenchmarkPoint[];
  best_worker_count: number;
  max_speedup: number;
  max_throughput_files_sec: number;
  timestamp: string;
}

export interface SystemMetrics {
  total_files: number;
  completed_files: number;
  pending_jobs: number;
  failed_jobs: number;
  active_workers: number;
  total_workers: number;
  avg_processing_time_ms: number;
  overall_throughput_files_sec: number;
  average_speedup: number;
  average_efficiency: number;
  system_cpu_percent: number;
  system_memory_percent: number;
  operating_mode: OperatingMode;
}

export interface AzureStatus {
  is_connected: boolean;
  operating_mode: OperatingMode;
  region: string;
  profile?: string;
  input_bucket: string;
  input_bucket_accessible: boolean;
  output_bucket: string;
  output_bucket_accessible: boolean;
  message: string;
  error_details?: string;
  credentials_source?: string;
}

export type AWSStatus = AzureStatus;

export interface BlobObjectInfo {
  key: string;
  size: number;
  last_modified: string;
  storage_class: string;
  bucket_type: 'input' | 'output';
  etag?: string;
}

export type S3ObjectInfo = BlobObjectInfo;

export interface BlobListResponse {
  input_bucket: string;
  input_bucket_accessible: boolean;
  input_files_count: number;
  input_files: BlobObjectInfo[];
  output_bucket: string;
  output_bucket_accessible: boolean;
  output_files_count: number;
  output_files: BlobObjectInfo[];
}

export type S3ListResponse = BlobListResponse;

export interface StorageOverview {
  operating_mode: OperatingMode;
  local_storage: {
    uploads_dir: string;
    uploads_count: number;
    uploads_bytes: number;
    uploads_formatted: string;
    results_dir: string;
    results_count: number;
    results_bytes: number;
    results_formatted: string;
  };
  azure_blob_storage?: {
    is_connected: boolean;
    region: string;
    input_bucket: string;
    input_bucket_accessible: boolean;
    output_bucket: string;
    output_bucket_accessible: boolean;
    message: string;
  };
  aws_s3_storage: {
    is_connected: boolean;
    region: string;
    input_bucket: string;
    input_bucket_accessible: boolean;
    output_bucket: string;
    output_bucket_accessible: boolean;
    message: string;
  };
}

export interface SystemLog {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  category: 'JOB' | 'WORKER' | 'AZURE' | 'AWS' | 'STORAGE' | 'BENCHMARK' | 'SYSTEM';
  message: string;
  details_json?: string;
  details?: any;
}
