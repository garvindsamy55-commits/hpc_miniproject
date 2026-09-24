import React from 'react';
import {
  Files,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Cpu,
  Zap,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Layers,
  UploadCloud,
  Play
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { JobTable } from '../components/JobTable';
import { EmptyState } from '../components/EmptyState';
import { SystemMetrics, JobRecord, WorkerPoolStats, OperatingMode } from '../types';
import { Link } from 'react-router-dom';

interface DashboardProps {
  metrics: SystemMetrics | null;
  workerStats: WorkerPoolStats | null;
  recentJobs: JobRecord[];
  mode: OperatingMode;
  onViewJob: (job: JobRecord) => void;
  onLoadSamples: () => void;
  onProcessAll: () => void;
  isProcessing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  workerStats,
  recentJobs,
  mode,
  onViewJob,
  onLoadSamples,
  onProcessAll,
  isProcessing,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            CloudBurst Control Console
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              v1.0.0
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Parallel File Processing System using Azure Blob Storage, Azure Functions, and Multi-Worker Compute Pools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLoadSamples}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Files className="w-3.5 h-3.5 text-cyan-400" />
            Load Sample Datasets
          </button>

          <button
            onClick={onProcessAll}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isProcessing ? 'Dispatching...' : 'Dispatch All Parallel'}
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Files"
          value={metrics?.total_files ?? 0}
          subtitle="Indexed in local/cloud storage"
          icon={Files}
          colorScheme="cyan"
          badge={`${metrics?.completed_files ?? 0} Processed`}
        />

        <StatCard
          title="Active Workers"
          value={`${metrics?.active_workers ?? 0} / ${metrics?.total_workers ?? 4}`}
          subtitle={`Concurrency Pool Slots: ${metrics?.total_workers ?? 4}`}
          icon={Cpu}
          colorScheme="indigo"
          badge={workerStats?.system_cpu_percent ? `${workerStats.system_cpu_percent}% CPU` : undefined}
        />

        <StatCard
          title="Average Speedup"
          value={`${metrics?.average_speedup ?? 1.0}x`}
          subtitle="Sequential vs Parallel acceleration"
          icon={TrendingUp}
          colorScheme="amber"
          trend={`${metrics?.average_speedup ? ((metrics.average_speedup - 1) * 100).toFixed(0) : 0}% Gain`}
        />

        <StatCard
          title="Parallel Efficiency"
          value={`${((metrics?.average_efficiency ?? 0.75) * 100).toFixed(0)}%`}
          subtitle="Speedup / Number of Workers (E)"
          icon={Zap}
          colorScheme="emerald"
        />

        <StatCard
          title="Avg Processing Time"
          value={`${metrics?.avg_processing_time_ms ?? 0} ms`}
          subtitle="Per file compute latency"
          icon={Clock}
          colorScheme="violet"
        />

        <StatCard
          title="System Throughput"
          value={`${metrics?.overall_throughput_files_sec ?? 0}`}
          subtitle="Files processed per second"
          icon={Activity}
          colorScheme="cyan"
          badge="files / sec"
        />

        <StatCard
          title="Pending Queue"
          value={metrics?.pending_jobs ?? 0}
          subtitle="Jobs queued or in progress"
          icon={Layers}
          colorScheme="amber"
        />

        <StatCard
          title="Failed Jobs"
          value={metrics?.failed_jobs ?? 0}
          subtitle="Errors trapped & reported"
          icon={AlertTriangle}
          colorScheme="rose"
        />
      </div>

      {/* Active Worker Ribbon */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Parallel Compute Worker Threads
            </h3>
          </div>
          <Link
            to="/workers"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 font-medium"
          >
            Manage Cluster <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {workerStats?.workers.map((w) => {
            const isBusy = w.status === 'BUSY';
            return (
              <div
                key={w.worker_id}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isBusy
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <span className="font-mono text-xs font-bold text-white block">
                  {w.worker_id}
                </span>
                <span
                  className={`text-[10px] font-bold block mt-1 ${
                    isBusy ? 'text-indigo-400 animate-pulse' : 'text-slate-500'
                  }`}
                >
                  {w.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Processing Jobs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Processing Jobs
            </h3>
            <p className="text-xs text-slate-400">
              Live job queue and concurrent file analysis results
            </p>
          </div>

          <Link
            to="/jobs"
            className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 font-medium"
          >
            View All Jobs <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentJobs.length > 0 ? (
          <JobTable jobs={recentJobs.slice(0, 8)} onViewJob={onViewJob} />
        ) : (
          <EmptyState
            title="No Jobs Dispatched Yet"
            description="Upload files or load demonstration datasets to trigger parallel worker execution."
            icon={Layers}
            actionText="Load Demo Datasets"
            onAction={onLoadSamples}
          />
        )}
      </div>
    </div>
  );
};
