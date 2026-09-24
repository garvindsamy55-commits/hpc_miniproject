import React, { useState } from 'react';
import { X, Download, Copy, Check, Hash, Cpu, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { JobRecord } from '../types';
import { api } from '../services/api';

interface JobResultModalProps {
  job: JobRecord | null;
  onClose: () => void;
}

export const JobResultModal: React.FC<JobResultModalProps> = ({ job, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const resultData = job.result_details || {};
  const computed = resultData.computed_metadata || {};
  const hasResult = !!job.result_location && !!job.result_details;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(resultData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">{job.filename}</h3>
              <p className="text-xs text-slate-400">Job ID: <span className="text-cyan-400 font-mono">{job.job_id}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Status</span>
              <div className="mt-1 text-sm font-semibold flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> {job.status}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Processing Time</span>
              <div className="mt-1 text-sm font-semibold font-mono text-cyan-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {job.processing_time_ms !== undefined ? `${job.processing_time_ms} ms` : 'N/A'}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Worker ID</span>
              <div className="mt-1 text-sm font-semibold font-mono text-indigo-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                {job.worker_id || 'Worker Pool'}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-medium">File Size</span>
              <div className="mt-1 text-sm font-semibold font-mono text-slate-200">
                {resultData.file_size_formatted || `${(job.file_size / 1024).toFixed(1)} KB`}
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Hash */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <Hash className="w-3.5 h-3.5" /> SHA-256 Cryptographic Checksum
              </span>
              <span className="text-[10px] text-slate-400">Algorithm: SHA-256</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-xs text-amber-300 break-all select-all border border-slate-800">
              {resultData.sha256_hash || job.result_summary || 'Calculation in progress...'}
            </div>
          </div>

          {/* Format-Specific Computed Results */}
          {hasResult && computed && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Extracted Data & Analytics ({computed.file_category || 'File Analysis'})
              </h4>

              {/* Text / Log Analysis */}
              {computed.line_count !== undefined && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-slate-900 rounded-lg">
                      <div className="text-[10px] text-slate-400">Lines</div>
                      <div className="text-base font-bold font-mono text-white">{computed.line_count}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg">
                      <div className="text-[10px] text-slate-400">Words</div>
                      <div className="text-base font-bold font-mono text-cyan-300">{computed.word_count}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg">
                      <div className="text-[10px] text-slate-400">Characters</div>
                      <div className="text-base font-bold font-mono text-indigo-300">{computed.character_count}</div>
                    </div>
                  </div>

                  {computed.top_keywords && computed.top_keywords.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-400 block mb-1.5">Top Frequent Terms:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {computed.top_keywords.map((kw: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 rounded text-xs font-mono"
                          >
                            {kw.word} <strong className="text-white">({kw.frequency})</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {computed.log_event_counts && (
                    <div className="pt-2 border-t border-slate-800 flex gap-4 text-xs font-mono">
                      <span className="text-rose-400">Errors: {computed.log_event_counts.error_count}</span>
                      <span className="text-amber-400">Warnings: {computed.log_event_counts.warn_count}</span>
                      <span className="text-emerald-400">Info: {computed.log_event_counts.info_count}</span>
                    </div>
                  )}
                </div>
              )}

              {/* CSV Analysis */}
              {computed.row_count !== undefined && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span>Rows: <strong className="text-white font-mono">{computed.row_count}</strong></span>
                    <span>Columns: <strong className="text-white font-mono">{computed.column_count}</strong></span>
                  </div>

                  {computed.columns_summary && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-900/80">
                          <tr>
                            <th className="p-2">Column</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Min</th>
                            <th className="p-2">Max</th>
                            <th className="p-2">Mean</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono">
                          {computed.columns_summary.map((col: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="p-2 font-semibold text-slate-200">{col.column_name}</td>
                              <td className="p-2 text-slate-400">{col.numeric ? 'Numeric' : 'Text'}</td>
                              <td className="p-2 text-amber-300">{col.min ?? '-'}</td>
                              <td className="p-2 text-cyan-300">{col.max ?? '-'}</td>
                              <td className="p-2 text-emerald-300">{col.mean ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Image Analysis */}
              {computed.width_px !== undefined && (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dimensions</span>
                    <strong className="text-white font-mono">{computed.width_px} x {computed.height_px} px</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Megapixels</span>
                    <strong className="text-cyan-300 font-mono">{computed.megapixels} MP</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Format</span>
                    <strong className="text-indigo-300 font-mono">{computed.format} ({computed.color_mode})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dominant Color</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-3.5 h-3.5 rounded border border-white/20"
                        style={{ backgroundColor: computed.dominant_color_hex || '#000' }}
                      />
                      <span className="font-mono text-slate-200">{computed.dominant_color_hex}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON Preview */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Raw Output Payload</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
                <a
                  href={api.getResultDownloadUrl(job.job_id)}
                  download={`result_${job.job_id}.json`}
                  className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3 h-3" /> Download Artifact
                </a>
              </div>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(resultData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
