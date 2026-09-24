// ============================================================================
// CloudBurst – API Service (Azure Demo Mode)
// All calls are routed to the local mock engine. No backend required.
// ============================================================================

import { mockApi } from './mockData';
import {
  HealthStatus,
  FileListResponse,
  JobListResponse,
  JobRecord,
  WorkerPoolStats,
  BenchmarkRunResult,
  SystemMetrics,
  AzureStatus,
  AWSStatus,
  BlobListResponse,
  S3ListResponse,
  StorageOverview,
  SystemLog
} from '../types';

// Simulate realistic network latency
function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 200));
}

export const api = {
  // Health & System
  getHealth: async (): Promise<HealthStatus> => {
    await delay(150);
    return mockApi.getHealth();
  },

  // Files
  getFiles: async (): Promise<FileListResponse> => {
    await delay();
    return mockApi.getFiles();
  },

  uploadFile: async (file: File): Promise<any> => {
    await delay(800);
    return mockApi.uploadFile(file);
  },

  uploadMultipleFiles: async (files: File[]): Promise<any[]> => {
    await delay(1200);
    return files.map((f) => mockApi.uploadFile(f));
  },

  deleteFile: async (fileId: string): Promise<any> => {
    await delay(400);
    mockApi.deleteFile(fileId);
    return { success: true };
  },

  generateSamples: async (): Promise<{ success: boolean; count: number; files: any[] }> => {
    await delay(700);
    return mockApi.generateSamples();
  },

  // Jobs
  getJobs: async (_status?: string): Promise<JobListResponse> => {
    await delay();
    return mockApi.getJobs();
  },

  getJobById: async (jobId: string): Promise<JobRecord> => {
    await delay(150);
    const job = mockApi.getJobById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    return job;
  },

  dispatchJobs: async (payload: { file_ids?: string[]; all_unprocessed?: boolean; worker_count?: number }): Promise<any> => {
    await delay(600);
    return mockApi.dispatchJobs(payload);
  },

  clearJobs: async (): Promise<any> => {
    await delay(300);
    mockApi.clearJobs();
    return { success: true };
  },

  // Workers
  getWorkers: async (): Promise<WorkerPoolStats> => {
    await delay();
    return mockApi.getWorkers();
  },

  updateWorkerCount: async (workerCount: number): Promise<WorkerPoolStats> => {
    await delay(500);
    return mockApi.updateWorkerCount(workerCount);
  },

  // Performance & Benchmarks
  getPerformance: async (): Promise<any> => {
    await delay();
    return mockApi.getPerformance();
  },

  runBenchmark: async (payload: { file_count: number; file_size_kb: number; worker_counts: number[]; workload_type: string }): Promise<BenchmarkRunResult> => {
    await delay(2500 + payload.file_count * 100);
    return mockApi.runBenchmark(payload);
  },

  getMetrics: async (): Promise<SystemMetrics> => {
    await delay(200);
    return mockApi.getMetrics();
  },

  // Storage
  getStorage: async (): Promise<StorageOverview> => {
    await delay();
    return mockApi.getStorage();
  },

  getResultDownloadUrl: (_jobId: string) => '#',
  getFileDownloadUrl: (_fileId: string) => '#',

  // Monitoring & Logs
  getLogs: async (params?: { level?: string; category?: string; limit?: number }): Promise<{ total_returned: number; logs: SystemLog[] }> => {
    await delay();
    return mockApi.getLogs(params);
  },

  clearLogs: async (): Promise<any> => {
    await delay(200);
    mockApi.clearLogs();
    return { success: true };
  },

  // Azure Integration
  getAzureStatus: async (): Promise<AzureStatus> => {
    await delay(400);
    return mockApi.getAzureStatus();
  },

  getBlobFiles: async (): Promise<BlobListResponse> => {
    await delay(500);
    return mockApi.getBlobFiles();
  },

  uploadBlobFile: async (file: File): Promise<any> => {
    await delay(1000);
    return { success: true, key: `uploads/${file.name}`, bucket: 'cloudburst-input-container', size: file.size, message: 'Uploaded to Azure Blob Storage (simulated).' };
  },

  deleteBlobFile: async (_bucketType: 'input' | 'output', _key: string): Promise<any> => {
    await delay(400);
    return { success: true, message: 'Deleted from Azure Blob Storage (simulated).' };
  },

  updateAzureConfig: async (config: any): Promise<any> => {
    await delay(300);
    return mockApi.updateAzureConfig(config);
  },

  // Backward-compatibility AWS aliases
  getAwsStatus: async (): Promise<AWSStatus> => {
    return api.getAzureStatus();
  },

  getS3Files: async (): Promise<S3ListResponse> => {
    return api.getBlobFiles();
  },

  uploadS3File: async (file: File): Promise<any> => {
    return api.uploadBlobFile(file);
  },

  deleteS3File: async (bucketType: 'input' | 'output', key: string): Promise<any> => {
    return api.deleteBlobFile(bucketType, key);
  },

  updateAwsConfig: async (config: any): Promise<any> => {
    return api.updateAzureConfig(config);
  },
};
