import React, { useState } from 'react';
import { HardDrive, Cloud, Download, Trash2, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StorageOverview, BlobListResponse, OperatingMode } from '../types';
import { api } from '../services/api';

interface StorageTableProps {
  storage: StorageOverview | null;
  s3Data: BlobListResponse | null;
  mode: OperatingMode;
  onRefresh: () => void;
  onDeleteS3File?: (bucketType: 'input' | 'output', key: string) => void;
}

export const StorageTable: React.FC<StorageTableProps> = ({
  storage,
  s3Data,
  mode,
  onRefresh,
  onDeleteS3File,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'azure'>('azure');

  const cloudStorage = storage?.azure_blob_storage || storage?.aws_s3_storage;

  return (
    <div className="space-y-6">
      {/* Storage Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'local'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Local File System Storage
          </button>

          <button
            onClick={() => setActiveTab('azure')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              activeTab === 'azure'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Azure Blob Storage Containers
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Active Operating Mode: <strong className="text-slate-300 uppercase">{mode}</strong>
        </span>
      </div>

      {/* Tab 1: Local Storage */}
      {activeTab === 'local' && storage && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Local Uploads Directory</span>
              <div className="text-lg font-bold font-mono text-white">
                {storage.local_storage.uploads_formatted} ({storage.local_storage.uploads_count} files)
              </div>
              <code className="text-[11px] text-slate-500 block truncate font-mono">
                {storage.local_storage.uploads_dir}
              </code>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Computed Results Directory</span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {storage.local_storage.results_formatted} ({storage.local_storage.results_count} JSON artifacts)
              </div>
              <code className="text-[11px] text-slate-500 block truncate font-mono">
                {storage.local_storage.results_dir}
              </code>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-300 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              All input files and generated JSON analysis artifacts are stored locally in the <code>storage/</code> directory with path sanitization and SHA-256 indexing.
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Azure Blob Storage */}
      {activeTab === 'azure' && (
        <div className="space-y-6">
          {/* Azure Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              s3Data?.input_bucket_accessible && s3Data?.output_bucket_accessible
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-sky-950/20 border-sky-800/40 text-sky-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {s3Data?.input_bucket_accessible ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-sky-400" />
              )}
              <span>
                <strong>Azure Blob Storage Status:</strong>{' '}
                {cloudStorage?.message || 'Checking Azure Blob connection status...'}
              </span>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Region: {cloudStorage?.region || 'eastus'}
            </span>
          </div>

          {/* Azure Containers Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Container */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Input Container</span>
                  <h4 className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                    {s3Data?.input_bucket || cloudStorage?.input_bucket || 'cloudburst-input-container'}
                  </h4>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {s3Data?.input_files_count ?? 0} Blobs
                </span>
              </div>

              {s3Data?.input_files && s3Data.input_files.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono">
                  {s3Data.input_files.map((obj, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between"
                    >
                      <div className="truncate max-w-xs text-slate-200">
                        {obj.key}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {(obj.size / 1024).toFixed(1)} KB
                        </span>
                        {onDeleteS3File && (
                          <button
                            onClick={() => onDeleteS3File('input', obj.key)}
                            className="text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No blobs in input container</p>
              )}
            </div>

            {/* Output Container */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Output Container</span>
                  <h4 className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                    {s3Data?.output_bucket || cloudStorage?.output_bucket || 'cloudburst-output-container'}
                  </h4>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {s3Data?.output_files_count ?? 0} Results
                </span>
              </div>

              {s3Data?.output_files && s3Data.output_files.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono">
                  {s3Data.output_files.map((obj, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between"
                    >
                      <div className="truncate max-w-xs text-emerald-300">
                        {obj.key}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {(obj.size / 1024).toFixed(1)} KB
                        </span>
                        {onDeleteS3File && (
                          <button
                            onClick={() => onDeleteS3File('output', obj.key)}
                            className="text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No processed artifacts in output container</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
