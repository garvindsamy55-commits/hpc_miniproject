import React, { useState } from 'react';
import { Layers, Trash2, RefreshCw, CheckCircle2, Clock, AlertTriangle, Loader2, Play } from 'lucide-react';
import { JobTable } from '../components/JobTable';
import { EmptyState } from '../components/EmptyState';
import { JobListResponse, JobRecord, JobStatusType } from '../types';

interface ProcessingJobsPageProps {
  jobsData: JobListResponse | null;
  onRefresh: () => void;
  onClearJobs: () => void;
  onViewJob: (job: JobRecord) => void;
  onProcessAll: () => void;
  isProcessing: boolean;
}

export const ProcessingJobsPage: React.FC<ProcessingJobsPageProps> = ({
  jobsData,
  onRefresh,
  onClearJobs,
  onViewJob,
  onProcessAll,
  isProcessing,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const jobs = jobsData?.jobs || [];
  const filteredJobs = statusFilter === 'ALL'
    ? jobs
    : jobs.filter((j) => j.status === statusFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            Parallel Processing Task Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time job lifecycle monitor tracking task states across the parallel compute worker pool.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onClearJobs}
            disabled={jobs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Finished
          </button>

          <button
            onClick={onProcessAll}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isProcessing ? 'Dispatching...' : 'Process Unprocessed'}
          </button>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'ALL'
              ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block">All Jobs</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {jobsData?.total_jobs ?? 0}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('QUEUED')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'QUEUED'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Queued
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {jobsData?.queued_count ?? 0}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('PROCESSING')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'PROCESSING'
              ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block text-indigo-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {jobsData?.processing_count ?? 0}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {jobsData?.completed_count ?? 0}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('FAILED')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'FAILED'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] uppercase font-bold block text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {jobsData?.failed_count ?? 0}
          </div>
        </button>
      </div>

      {/* Jobs Table */}
      {filteredJobs.length > 0 ? (
        <JobTable jobs={filteredJobs} onViewJob={onViewJob} />
      ) : (
        <EmptyState
          title={statusFilter === 'ALL' ? 'No Jobs in Queue' : `No ${statusFilter} Jobs`}
          description="Dispatch files to begin parallel worker execution."
          icon={Layers}
        />
      )}
    </div>
  );
};
