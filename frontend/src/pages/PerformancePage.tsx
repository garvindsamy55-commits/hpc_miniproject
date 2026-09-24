import React from 'react';
import { Zap } from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';
import { BenchmarkRunResult } from '../types';

interface PerformancePageProps {
  onRunBenchmark: (config: { file_count: number; file_size_kb: number; worker_counts: number[]; workload_type: string }) => Promise<void>;
  isRunning: boolean;
  benchmarkResult: BenchmarkRunResult | null;
  history: any[];
}

export const PerformancePage: React.FC<PerformancePageProps> = ({
  onRunBenchmark,
  isRunning,
  benchmarkResult,
  history,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400 fill-current" />
          HPC Performance &amp; Scalability Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Measure parallel execution latency, verify Amdahl&apos;s Law, and calculate Speedup, Efficiency, and Throughput dynamically.
        </p>
      </div>

      {/* Benchmark Component */}
      <PerformanceChart
        onRunBenchmark={onRunBenchmark}
        isRunning={isRunning}
        benchmarkResult={benchmarkResult}
        history={history}
      />
    </div>
  );
};
