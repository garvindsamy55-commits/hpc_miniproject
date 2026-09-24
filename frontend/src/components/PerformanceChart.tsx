import React, { useState } from 'react';
import { Zap, Play, TrendingUp, BarChart3, Clock, Cpu, Award, BookOpen } from 'lucide-react';
import { BenchmarkRunResult, WorkerBenchmarkPoint } from '../types';

interface PerformanceChartProps {
  onRunBenchmark: (config: { file_count: number; file_size_kb: number; worker_counts: number[]; workload_type: string }) => Promise<void>;
  isRunning: boolean;
  benchmarkResult: BenchmarkRunResult | null;
  history: any[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  onRunBenchmark,
  isRunning,
  benchmarkResult,
  history,
}) => {
  const [fileCount, setFileCount] = useState(8);
  const [fileSizeKb, setFileSizeKb] = useState(256);
  const [workloadType, setWorkloadType] = useState('mixed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunBenchmark({
      file_count: Number(fileCount),
      file_size_kb: Number(fileSizeKb),
      worker_counts: [1, 2, 4, 8],
      workload_type: workloadType,
    });
  };

  const points = benchmarkResult?.points || [];
  const maxTime = Math.max(...points.map((p) => p.execution_time_ms), 1);

  return (
    <div className="space-y-6">
      {/* Benchmark Control Bar */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-current" />
              Live High Performance Computing (HPC) Benchmark Suite
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Executes real multi-file workloads sequentially (1 worker) vs concurrently (2, 4, 8 workers) to measure dynamic Speedup, Efficiency, and Throughput.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isRunning}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {isRunning ? 'Benchmarking Workloads...' : 'Run HPC Benchmark'}
          </button>
        </div>

        {/* Form parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Workload File Count</label>
            <select
              value={fileCount}
              onChange={(e) => setFileCount(Number(e.target.value))}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value={4}>4 Synthetic Files (Light)</option>
              <option value={8}>8 Synthetic Files (Standard)</option>
              <option value={16}>16 Synthetic Files (Heavy)</option>
              <option value={24}>24 Synthetic Files (Intensive)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">File Payload Size</label>
            <select
              value={fileSizeKb}
              onChange={(e) => setFileSizeKb(Number(e.target.value))}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value={64}>64 KB per file</option>
              <option value={256}>256 KB per file</option>
              <option value={1024}>1.0 MB per file</option>
              <option value={2048}>2.0 MB per file</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Workload Compute Type</label>
            <select
              value={workloadType}
              onChange={(e) => setWorkloadType(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
            >
              <option value="mixed">Mixed (SHA-256 + Token Frequency + Analytics)</option>
              <option value="hash_compute">Cryptographic SHA-256 Digest Only</option>
              <option value="text">Linguistic Tokenization & Line Stats</option>
            </select>
          </div>
        </div>
      </div>

      {/* Benchmark Results Display */}
      {benchmarkResult ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Scorecards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Baseline (1 Worker)</span>
              <div className="text-xl font-black font-mono text-white mt-1">
                {benchmarkResult.sequential_time_ms} ms
              </div>
              <span className="text-[11px] text-slate-500">Pure Serial Execution</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Speedup</span>
              <div className="text-xl font-black font-mono text-cyan-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {benchmarkResult.max_speedup}x
              </div>
              <span className="text-[11px] text-cyan-500/80">With {benchmarkResult.best_worker_count} Workers</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Throughput</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                {benchmarkResult.max_throughput_files_sec} files/s
              </div>
              <span className="text-[11px] text-emerald-500/80">{points[points.length - 1]?.throughput_mb_sec || 0} MB/sec</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Workload Dataset</span>
              <div className="text-xl font-black font-mono text-indigo-300 mt-1">
                {benchmarkResult.file_count} Files
              </div>
              <span className="text-[11px] text-slate-400">{benchmarkResult.total_size_formatted} Total</span>
            </div>
          </div>

          {/* Interactive Visual Comparison Bar Chart */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Execution Time Comparison by Worker Count (Lower is Faster)
            </h4>

            <div className="space-y-4 pt-2 font-mono text-xs">
              {points.map((pt) => {
                const percent = (pt.execution_time_ms / maxTime) * 100;
                const isBaseline = pt.worker_count === 1;
                return (
                  <div key={pt.worker_count} className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-bold flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${isBaseline ? 'bg-slate-800 text-slate-300' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'}`}>
                          {pt.worker_count} {pt.worker_count === 1 ? 'Worker' : 'Workers'}
                        </span>
                        <span>{isBaseline ? '(Sequential Baseline)' : `(Parallel Speedup: ${pt.speedup}x)`}</span>
                      </span>
                      <span className="font-bold text-white">{pt.execution_time_ms} ms</span>
                    </div>

                    <div className="w-full h-6 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className={`h-full rounded transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold text-white ${
                          isBaseline
                            ? 'bg-slate-600'
                            : pt.speedup >= 3
                            ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                            : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                        }`}
                        style={{ width: `${Math.max(10, percent)}%` }}
                      >
                        {pt.execution_time_ms} ms
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Efficiency: <strong className="text-cyan-300">{pt.efficiency_percent}%</strong></span>
                      <span>Throughput: <strong className="text-emerald-300">{pt.throughput_files_sec} files/s</strong></span>
                      <span>CPU Load: <strong className="text-indigo-300">{pt.cpu_utilization_percent}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HPC Mathematical Verification Table */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              High Performance Computing Formula Verification
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950/60">
                    <th className="p-3">Worker Count (p)</th>
                    <th className="p-3">Execution Time (T_p)</th>
                    <th className="p-3">Speedup (S = T1 / Tp)</th>
                    <th className="p-3">Efficiency (E = S / p)</th>
                    <th className="p-3">Throughput (files/sec)</th>
                    <th className="p-3">Data Rate (MB/sec)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {points.map((pt) => (
                    <tr key={pt.worker_count} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{pt.worker_count}</td>
                      <td className="p-3 text-cyan-300">{pt.execution_time_ms} ms</td>
                      <td className="p-3 font-bold text-amber-300">{pt.speedup}x</td>
                      <td className="p-3 text-emerald-300">{pt.efficiency_percent}%</td>
                      <td className="p-3 text-slate-200">{pt.throughput_files_sec}</td>
                      <td className="p-3 text-slate-400">{pt.throughput_mb_sec} MB/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No Benchmark Run Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click &quot;Run HPC Benchmark&quot; above to execute live concurrent workload tests and measure parallel acceleration curves.
          </p>
        </div>
      )}

      {/* HPC Theoretical Principles Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          HPC Concepts Explained: Amdahl&apos;s Law &amp; Parallel Scaling
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-cyan-300 font-semibold block">Amdahl&apos;s Law</strong>
            <p>
              States that the speedup of a parallel program is strictly limited by its serial fraction $(1 - P)$:
            </p>
            <code className="block p-2 bg-slate-950 rounded text-amber-300 text-[11px] font-mono">
              Speedup(S) = 1 / ((1 - P) + (P / N))
            </code>
            <p className="text-[11px] text-slate-500">
              In CloudBurst, disk I/O and job dispatching represent the serial portion $(1-P)$, while file hashing and data transformation represent the parallelizable portion $P$.
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
            <strong className="text-indigo-300 font-semibold block">Parallel Efficiency</strong>
            <p>
              Measures how effectively additional worker threads are utilized:
            </p>
            <code className="block p-2 bg-slate-950 rounded text-emerald-300 text-[11px] font-mono">
              Efficiency(E) = Speedup / N_workers
            </code>
            <p className="text-[11px] text-slate-500">
              Ideal linear speedup yields $E = 1.0$ (100%). In real systems, context switching, memory contention, and disk I/O cause efficiency to naturally decline as $N$ increases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
