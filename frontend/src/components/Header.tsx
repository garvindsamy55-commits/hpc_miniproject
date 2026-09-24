import React from 'react';
import { RefreshCw, Play, Sparkles, CheckCircle2, Cloud, Cpu, Wifi } from 'lucide-react';
import { OperatingMode } from '../types';

interface HeaderProps {
  mode: OperatingMode;
  onModeChange: (mode: OperatingMode) => void;
  onRefresh: () => void;
  onLoadSamples: () => void;
  onProcessAll: () => void;
  isProcessing: boolean;
  isLoadingSamples: boolean;
  activeWorkersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onLoadSamples,
  onProcessAll,
  isProcessing,
  isLoadingSamples,
  activeWorkersCount
}) => {
  return (
    <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {/* Left: Azure Status Pills */}
        <div className="flex items-center gap-3">
          {/* Azure Connected Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300">
            <Cloud className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold tracking-wide">AZURE CLOUD MODE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          </div>

          {/* Blob Connected */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Blob Connected
          </div>

          {/* Region */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono">
            <Wifi className="w-3 h-3 text-cyan-400" />
            eastus
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Workers: <strong className="text-indigo-300 font-mono">{activeWorkersCount}</strong></span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLoadSamples}
            disabled={isLoadingSamples}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            title="Upload synthetic sample files to Azure Blob Storage for quick demonstration"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isLoadingSamples ? 'Uploading to Azure...' : 'Load Sample Files'}</span>
          </button>

          <button
            onClick={onProcessAll}
            disabled={isProcessing}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-cyan-500/20 flex items-center gap-1.5 disabled:opacity-50"
            title="Dispatch parallel processing via Azure Function workers"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isProcessing ? 'Dispatching Azure Fn...' : 'Process All ⚡ Azure Fn'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 rounded-lg transition"
            title="Refresh Azure Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Azure Infrastructure Banner */}
      <div className="px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-between border bg-sky-950/30 text-sky-200 border-sky-800/40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            <strong>AZURE INFRASTRUCTURE ACTIVE:</strong> Blob containers (cloudburst-input-container, cloudburst-output-container) · Azure Function (cloudburst-processor) · Service Bus (cloudburst-jobs) · Managed Identity active
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase text-sky-400/70">
          Region: eastus
        </span>
      </div>
    </header>
  );
};
