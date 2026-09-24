import React from 'react';
import { Cpu, RefreshCw, Zap, Cloud, CheckCircle2, Server, Activity, BarChart2 } from 'lucide-react';
import { WorkerTable } from '../components/WorkerTable';
import { WorkerPoolStats } from '../types';

interface ParallelWorkersPageProps {
  stats: WorkerPoolStats | null;
  onScaleWorkers: (count: number) => void;
  onRefresh: () => void;
  isScaling?: boolean;
}

const AZURE_COMPUTE = [
  { label: 'Azure VM Instance', value: 'Standard_D8s_v5', sub: '8 vCPUs · 32 GB RAM', color: 'text-sky-400', icon: Server },
  { label: 'Azure Fn Memory', value: '1536 MB', sub: 'Per invocation', color: 'text-violet-400', icon: Zap },
  { label: 'Function Timeout', value: '60s', sub: 'Consumption plan default', color: 'text-cyan-400', icon: Activity },
  { label: 'Auto-Scaling', value: 'Enabled', sub: 'Target CPU: 70%', color: 'text-emerald-400', icon: BarChart2 },
];

export const ParallelWorkersPage: React.FC<ParallelWorkersPageProps> = ({
  stats,
  onScaleWorkers,
  onRefresh,
  isScaling,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Parallel Worker Compute Cluster
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Azure Standard_D8s_v5 · 8 vCPU ThreadPoolExecutor · Azure Functions serverless processors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Azure VM Online · eastus
          </div>
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Poll Workers
          </button>
        </div>
      </div>

      {/* Azure Compute Info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {AZURE_COMPUTE.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className={`text-lg font-black font-mono ${c.color}`}>{c.value}</div>
              <div className="text-xs text-slate-500">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Azure Architecture Banner */}
      <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-xs text-indigo-300 flex items-start gap-2.5">
        <Cloud className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          <strong>Azure Parallel Architecture:</strong> Service Bus queue{' '}
          <code className="font-mono bg-indigo-900/30 px-1 rounded">cloudburst-jobs</code> distributes processing tasks
          to Azure worker threads. Each worker triggers an Azure Function{' '}
          <code className="font-mono bg-indigo-900/30 px-1 rounded">cloudburst-processor</code> for compute-intensive
          file analysis, then writes results to Azure Blob Storage. Throughput scales linearly up to 8 workers.
        </span>
      </div>

      {/* Cluster Table */}
      {stats && (
        <WorkerTable
          stats={stats}
          onScaleWorkers={onScaleWorkers}
          isScaling={isScaling}
        />
      )}
    </div>
  );
};
