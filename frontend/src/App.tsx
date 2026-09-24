import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { JobResultModal } from './components/JobResultModal';
import { Dashboard } from './pages/Dashboard';
import { FileUploadPage } from './pages/FileUploadPage';
import { ProcessingJobsPage } from './pages/ProcessingJobsPage';
import { CloudStoragePage } from './pages/CloudStoragePage';
import { ParallelWorkersPage } from './pages/ParallelWorkersPage';
import { PerformancePage } from './pages/PerformancePage';
import { MonitoringPage } from './pages/MonitoringPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutProjectPage } from './pages/AboutProjectPage';
import { api } from './services/api';
import {
  OperatingMode,
  HealthStatus,
  FileRecord,
  JobListResponse,
  JobRecord,
  WorkerPoolStats,
  SystemMetrics,
  StorageOverview,
  BlobListResponse,
  AzureStatus,
  SystemLog,
  BenchmarkRunResult
} from './types';

export function App() {
  const [mode, setMode] = useState<OperatingMode>('azure');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [workerStats, setWorkerStats] = useState<WorkerPoolStats | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [jobsData, setJobsData] = useState<JobListResponse | null>(null);
  const [storage, setStorage] = useState<StorageOverview | null>(null);
  const [blobData, setBlobData] = useState<BlobListResponse | null>(null);
  const [azureStatus, setAzureStatus] = useState<AzureStatus | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkRunResult | null>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);

  // Loading flags
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [isScaling, setIsScaling] = useState<boolean>(false);

  // Fetch core system data (all from mock Azure data engine)
  const fetchData = useCallback(async () => {
    try {
      const [h, m, w, f, j, s, l, blob] = await Promise.all([
        api.getHealth(),
        api.getMetrics(),
        api.getWorkers(),
        api.getFiles(),
        api.getJobs(),
        api.getStorage(),
        api.getLogs({ limit: 100 }),
        api.getBlobFiles(),
      ]);

      setBackendOnline(true);
      setHealth(h);
      setMode('azure');
      setMetrics(m);
      setWorkerStats(w);
      setFiles(f.files);
      setJobsData(j);
      setStorage(s);
      setLogs(l.logs);
      setBlobData(blob);
    } catch (err) {
      setBackendOnline(true);
    }
  }, []);

  // Initial load and periodic polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Load performance benchmarks
  const fetchPerformance = useCallback(async () => {
    try {
      const perf = await api.getPerformance();
      setBenchmarkHistory(perf.history || []);
      if (perf.latest && !benchmarkResult) {
        setBenchmarkResult({
          benchmark_id: perf.latest.id,
          workload_type: 'mixed',
          file_count: perf.latest.file_count,
          total_size_bytes: perf.latest.total_size_bytes,
          total_size_formatted: `${(perf.latest.total_size_bytes / 1024).toFixed(1)} KB`,
          sequential_time_ms: perf.latest.sequential_time_ms,
          points: perf.latest.details || [],
          best_worker_count: perf.latest.worker_count,
          max_speedup: perf.latest.speedup,
          max_throughput_files_sec: perf.latest.throughput_files_sec,
          timestamp: perf.latest.created_at
        });
      }
    } catch {
      // Ignore
    }
  }, [benchmarkResult]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Handlers
  const handleModeChange = async (_newMode: OperatingMode) => {
    setMode('azure');
    await fetchData();
  };

  const handleUpload = async (uploadFiles: File[]) => {
    setIsUploading(true);
    try {
      if (uploadFiles.length === 1) {
        await api.uploadFile(uploadFiles[0]);
      } else {
        await api.uploadMultipleFiles(uploadFiles);
      }
      await fetchData();
    } catch (err: any) {
      alert(`Upload failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    try {
      await api.generateSamples();
      await fetchData();
    } catch (err: any) {
      alert(`Sample generation failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.deleteFile(fileId);
      await fetchData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleProcessSingle = async (fileId: string) => {
    setIsProcessing(true);
    try {
      await api.dispatchJobs({ file_ids: [fileId] });
      await fetchData();
    } catch (err: any) {
      alert(`Job dispatch failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    setIsProcessing(true);
    try {
      await api.dispatchJobs({ all_unprocessed: true });
      await fetchData();
    } catch (err: any) {
      alert(`Batch dispatch failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScaleWorkers = async (count: number) => {
    setIsScaling(true);
    try {
      const updated = await api.updateWorkerCount(count);
      setWorkerStats(updated);
      await fetchData();
    } catch (err: any) {
      alert(`Worker scaling failed: ${err.message}`);
    } finally {
      setIsScaling(false);
    }
  };

  const handleRunBenchmark = async (config: { file_count: number; file_size_kb: number; worker_counts: number[]; workload_type: string }) => {
    setIsBenchmarking(true);
    try {
      const result = await api.runBenchmark(config);
      setBenchmarkResult(result);
      await fetchPerformance();
      await fetchData();
    } catch (err: any) {
      alert(`Benchmark run failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleClearJobs = async () => {
    try {
      await api.clearJobs();
      await fetchData();
    } catch (err: any) {
      alert(`Clear jobs failed: ${err.message}`);
    }
  };

  const handleClearLogs = async () => {
    try {
      await api.clearLogs();
      await fetchData();
    } catch (err: any) {
      alert(`Clear logs failed: ${err.message}`);
    }
  };

  const handleViewJob = async (job: JobRecord) => {
    try {
      const fullJob = await api.getJobById(job.job_id);
      setSelectedJob(fullJob);
    } catch {
      setSelectedJob(job);
    }
  };

  const handleRefreshAzureStatus = async () => {
    try {
      const st = await api.getAzureStatus();
      setAzureStatus(st);
      const blob = await api.getBlobFiles();
      setBlobData(blob);
    } catch {
      // Handled
    }
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-[#080c14] text-slate-100 antialiased font-sans">
        {/* Left Sidebar */}
        <Sidebar
          mode={mode}
          backendOnline={backendOnline}
          workerCount={workerStats?.total_workers ?? 4}
        />

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            mode={mode}
            onModeChange={handleModeChange}
            onRefresh={fetchData}
            onLoadSamples={handleLoadSamples}
            onProcessAll={handleProcessAll}
            isProcessing={isProcessing}
            isLoadingSamples={isLoadingSamples}
            activeWorkersCount={workerStats?.active_workers ?? 0}
          />

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    metrics={metrics}
                    workerStats={workerStats}
                    recentJobs={jobsData?.jobs || []}
                    mode={mode}
                    onViewJob={handleViewJob}
                    onLoadSamples={handleLoadSamples}
                    onProcessAll={handleProcessAll}
                    isProcessing={isProcessing}
                  />
                }
              />
              <Route
                path="/upload"
                element={
                  <FileUploadPage
                    files={files}
                    onUpload={handleUpload}
                    onLoadSamples={handleLoadSamples}
                    onDeleteFile={handleDeleteFile}
                    onProcessSingle={handleProcessSingle}
                    onProcessAll={handleProcessAll}
                    isUploading={isUploading}
                    isLoadingSamples={isLoadingSamples}
                    isProcessing={isProcessing}
                  />
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProcessingJobsPage
                    jobsData={jobsData}
                    onRefresh={fetchData}
                    onClearJobs={handleClearJobs}
                    onViewJob={handleViewJob}
                    onProcessAll={handleProcessAll}
                    isProcessing={isProcessing}
                  />
                }
              />
              <Route
                path="/storage"
                element={
                  <CloudStoragePage
                    storage={storage}
                    s3Data={blobData}
                    mode={mode}
                    onRefresh={fetchData}
                  />
                }
              />
              <Route
                path="/workers"
                element={
                  <ParallelWorkersPage
                    stats={workerStats}
                    onScaleWorkers={handleScaleWorkers}
                    onRefresh={fetchData}
                    isScaling={isScaling}
                  />
                }
              />
              <Route
                path="/performance"
                element={
                  <PerformancePage
                    onRunBenchmark={handleRunBenchmark}
                    isRunning={isBenchmarking}
                    benchmarkResult={benchmarkResult}
                    history={benchmarkHistory}
                  />
                }
              />
              <Route
                path="/monitoring"
                element={
                  <MonitoringPage
                    logs={logs}
                    onRefresh={fetchData}
                    onClearLogs={handleClearLogs}
                  />
                }
              />
              <Route
                path="/architecture"
                element={<ArchitecturePage mode={mode} />}
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    mode={mode}
                    onModeChange={handleModeChange}
                    workerCount={workerStats?.total_workers ?? 4}
                    onScaleWorkers={handleScaleWorkers}
                    awsStatus={azureStatus}
                    onRefreshAwsStatus={handleRefreshAzureStatus}
                  />
                }
              />
              <Route path="/about" element={<AboutProjectPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Detailed Job Result Modal */}
        <JobResultModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      </div>
    </Router>
  );
}

export default App;
