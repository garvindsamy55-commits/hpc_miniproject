import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Sparkles, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  onLoadSamples: () => Promise<void>;
  onProcessBatch?: () => void;
  isUploading: boolean;
  isLoadingSamples: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onLoadSamples,
  onProcessBatch,
  isUploading,
  isLoadingSamples,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    await onUpload(selectedFiles);
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3 shadow-inner">
          <UploadCloud className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-base font-semibold text-slate-200">
          Drag & Drop Files Here, or <span className="text-cyan-400 underline underline-offset-4">Browse</span>
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Supports TXT, CSV, JSON, LOG, PNG, JPG, PDF (Up to 50MB per file)
        </p>
      </div>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-300">
              Selected Files ({selectedFiles.length})
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <File className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate font-mono text-slate-200">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-slate-500 hover:text-rose-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>Uploading & Calculating Hashes...</>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Upload {selectedFiles.length} Files
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Action bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Need test data? Instantly generate sample logs, CSVs, and JSON files:</span>
        </div>
        <button
          onClick={onLoadSamples}
          disabled={isLoadingSamples}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold transition border border-amber-500/30 flex items-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoadingSamples ? 'Generating...' : 'Generate Demo Files'}
        </button>
      </div>
    </div>
  );
};
