import React from 'react';
import { Layers, Eye, Download, Clock, Cpu, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { JobRecord } from '../types';
import { StatusBadge } from './StatusBadge';
import { api } from '../services/api';

interface JobTableProps {
  jobs: JobRecord[];
  onViewJob: (job: JobRecord) => void;
}

export const JobTable: React.FC<JobTableProps> = ({ jobs, onViewJob }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="py-3 px-4">Job ID</th>
            <th className="py-3 px-4">Filename</th>
            <th className="py-3 px-4">Size</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Assigned Worker</th>
            <th className="py-3 px-4">Processing Time</th>
            <th className="py-3 px-4">Started At</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
          {jobs.map((job) => (
            <tr
              key={job.job_id}
              className="hover:bg-slate-800/40 transition-colors duration-150"
            >
              <td className="py-3 px-4 font-bold text-cyan-400">
                {job.job_id}
              </td>

              <td className="py-3 px-4 text-slate-200 font-sans font-medium flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-xs">{job.filename}</span>
              </td>

              <td className="py-3 px-4 text-slate-400">
                {(job.file_size / 1024).toFixed(1)} KB
              </td>

              <td className="py-3 px-4">
                <StatusBadge status={job.status} size="sm" />
              </td>

              <td className="py-3 px-4">
                {job.worker_id ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 text-[11px]">
                    <Cpu className="w-3 h-3 text-indigo-400" />
                    {job.worker_id}
                  </span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>

              <td className="py-3 px-4 text-slate-300">
                {job.processing_time_ms !== undefined && job.processing_time_ms !== null ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Clock className="w-3 h-3" />
                    {job.processing_time_ms} ms
                  </span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>

              <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                {job.start_time || job.created_at}
              </td>

              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewJob(job)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition"
                    title="View Computed Result & Metadata"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {job.status === 'COMPLETED' && (
                    <a
                      href={api.getResultDownloadUrl(job.job_id)}
                      download={`result_${job.job_id}.json`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition"
                      title="Download Result JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
