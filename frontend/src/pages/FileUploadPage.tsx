import React from 'react';
import { UploadCloud, Files, Play, Trash2, Download, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { FileRecord } from '../types';
import { api } from '../services/api';

interface FileUploadPageProps {
  files: FileRecord[];
  onUpload: (files: File[]) => Promise<void>;
  onLoadSamples: () => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onProcessSingle: (fileId: string) => Promise<void>;
  onProcessAll: () => Promise<void>;
  isUploading: boolean;
  isLoadingSamples: boolean;
  isProcessing: boolean;
}

export const FileUploadPage: React.FC<FileUploadPageProps> = ({
  files,
  onUpload,
  onLoadSamples,
  onDeleteFile,
  onProcessSingle,
  onProcessAll,
  isUploading,
  isLoadingSamples,
  isProcessing,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-cyan-400" />
            File Ingestion &amp; Storage Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload multiple files for batch parallel processing. Files are sanitized and indexed with cryptographic SHA-256 digests.
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={onProcessAll}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {isProcessing ? 'Dispatching...' : `Process All ${files.length} Files in Parallel`}
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <FileUpload
        onUpload={onUpload}
        onLoadSamples={onLoadSamples}
        isUploading={isUploading}
        isLoadingSamples={isLoadingSamples}
      />

      {/* Indexed Files Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Indexed Input Files ({files.length})
            </h3>
          </div>
        </div>

        {files.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-sans font-medium text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate max-w-xs">{file.original_name}</span>
                    </td>

                    <td className="py-3 px-4 uppercase text-slate-400 font-bold text-[11px]">
                      {file.file_type}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </td>

                    <td className="py-3 px-4 text-[11px] text-amber-300/80 max-w-xs truncate" title={file.sha256_hash}>
                      {file.sha256_hash ? `${file.sha256_hash.slice(0, 16)}...` : 'Pending'}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={file.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                      {file.upload_time}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onProcessSingle(file.id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-sans font-semibold transition flex items-center gap-1 disabled:opacity-50"
                          title="Process this file with parallel workers"
                        >
                          <Play className="w-3 h-3 fill-current" /> Process
                        </button>

                        <a
                          href={api.getFileDownloadUrl(file.id)}
                          download={file.original_name}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Download Source File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => onDeleteFile(file.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No Files Uploaded Yet"
            description="Drag and drop your files or generate demo test datasets above to get started."
            icon={Files}
            actionText="Generate Sample Datasets"
            onAction={onLoadSamples}
          />
        )}
      </div>
    </div>
  );
};
