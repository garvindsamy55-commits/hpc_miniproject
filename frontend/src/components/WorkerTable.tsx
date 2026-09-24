import React from 'react';
import { Cpu, Activity, CheckCircle2, AlertCircle, Clock, Zap, Gauge } from 'lucide-react';
import { WorkerInfo, WorkerPoolStats } from '../types';
import { StatusBadge } from './StatusBadge';

interface WorkerTableProps {
  stats: WorkerPoolStats;
  onScaleWorkers: (count: number) => void;
  isScaling?: boolean;
}

export const WorkerTable: React.FC<WorkerTableProps> = ({
  stats,
  onScaleWorkers,
  isScaling = false,
}) => {
  const workerCounts = [1, 2, 4, 6, 8, 12, 16];

  return (
    <div className="space-y-6">
      {/* Cluster Telemetry & Concurrency Scaler Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Concurrency Scaling Widget */}
        <div className="md:col-span-2 p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Parallel Compute Pool Concurrency
              </h3>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/50">
              Active: {stats.total_workers} Threads
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Scale the parallel worker pool dynamically. Jobs in the queue will be distributed evenly across all active worker threads.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {workerCounts.map((count) => (
              <button
                key={count}
                onClick={() => onScaleWorkers(count)}
                disabled={isScaling}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  stats.total_workers === count
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 border-cyan-400 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                } disabled:opacity-50`}
              >
                {count} {count === 1 ? 'Worker (Serial)' : 'Workers'}
              </button>
            ))}
          </div>
        </div>

        {/* System Resource Utilization */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-400" /> Host Telemetry
            </span>
            <span className="text-[11px] font-mono text-slate-400">Queue: {stats.queue_size}</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>CPU Load</span>
                <span>{stats.system_cpu_percent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    stats.system_cpu_percent > 80
                      ? 'bg-rose-500'
                      : stats.system_cpu_percent > 50
                      ? 'bg-amber-500'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, stats.system_cpu_percent)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>RAM Usage</span>
                <span>{stats.system_memory_percent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, stats.system_memory_percent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Worker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.workers.map((worker) => {
          const isBusy = worker.status === 'BUSY';
          return (
            <div
              key={worker.worker_id}
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                isBusy
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isBusy ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span className="font-mono font-bold text-sm text-white">
                    {worker.worker_id}
                  </span>
                </div>
                <StatusBadge status={worker.status} size="sm" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 font-mono">
                  <span className="text-[10px] text-slate-400 uppercase block mb-0.5">
                    Current Assignment
                  </span>
                  <div className="truncate text-slate-200">
                    {worker.current_file || <span className="text-slate-500 italic">Idle / Waiting for Tasks</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Done: {worker.completed_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Errors: {worker.error_count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
