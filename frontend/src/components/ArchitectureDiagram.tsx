import React, { useState } from 'react';
import { Layers, ArrowRight, ShieldCheck, Cloud, Cpu, Database, Server, Zap, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { OperatingMode } from '../types';

interface ArchitectureDiagramProps {
  currentMode: OperatingMode;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ currentMode }) => {
  const [selectedMode, setSelectedMode] = useState<OperatingMode>(currentMode);

  return (
    <div className="space-y-6">
      {/* Mode Selector Toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Architecture Topology Visualizer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between Local Multiprocessing Engine and Azure Cloud Serverless pipeline architectures.
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSelectedMode('local')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedMode === 'local'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Local Demo Architecture
          </button>
          <button
            onClick={() => setSelectedMode('azure')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedMode === 'azure' || selectedMode === 'aws'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Azure Cloud Architecture
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="p-8 rounded-2xl border border-slate-800 bg-slate-950/60 relative overflow-hidden shadow-2xl space-y-8">
        {selectedMode === 'local' ? (
          /* Local Demo Mode Topology */
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Local Parallel Processing Pipeline (Zero Cloud Credentials Mode)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                multiprocessing • concurrent.futures • ThreadPoolExecutor
              </span>
            </div>

            {/* Pipeline Flow Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">1. React Frontend</h4>
                <p className="text-[11px] text-slate-400">Vite • TypeScript • Tailwind Dashboard</p>
              </div>

              <div className="hidden md:flex justify-center text-slate-600">
                <ArrowRight className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white">2. FastAPI Backend</h4>
                <p className="text-[11px] text-slate-400">REST API • Input Sanitization • Uvicorn</p>
              </div>

              <div className="hidden md:flex justify-center text-slate-600">
                <ArrowRight className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-indigo-200">3. Parallel Worker Pool</h4>
                <p className="text-[11px] text-indigo-300/80">Dynamic 1-16 Worker Slots • Task Queue</p>
              </div>
            </div>

            {/* Storage & Database Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Database className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">SQLite Metadata Database</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Maintains state for files, worker slots, job queues, execution logs, and benchmark history.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Cryptographic &amp; Compute Processors</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    SHA-256 hash digests, CSV tabular aggregations, text token frequencies, and image metadata extractors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Azure Cloud Mode Topology */
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-4 h-4" /> Microsoft Azure Architecture (Blob Storage + Azure Functions + SDK)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Managed Identity • Serverless Blob Triggers • Zero Client Secrets
              </span>
            </div>

            {/* Architecture Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <Layers className="w-5 h-5 text-cyan-400 mx-auto" />
                <h5 className="text-[11px] font-bold text-white">React App</h5>
              </div>

              <div className="text-slate-600 hidden md:block">
                <ArrowRight className="w-4 h-4 text-cyan-400 mx-auto" />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <Server className="w-5 h-5 text-indigo-400 mx-auto" />
                <h5 className="text-[11px] font-bold text-white">FastAPI</h5>
                <span className="text-[9px] text-slate-500">Azure SDK</span>
              </div>

              <div className="text-slate-600 hidden md:block">
                <ArrowRight className="w-4 h-4 text-indigo-400 mx-auto" />
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 space-y-1">
                <Cloud className="w-5 h-5 text-sky-400 mx-auto" />
                <h5 className="text-[11px] font-bold text-sky-200">Input Container</h5>
                <span className="text-[9px] text-sky-300/80">Raw Uploads</span>
              </div>

              <div className="text-slate-600 hidden md:block">
                <ArrowRight className="w-4 h-4 text-sky-400 mx-auto" />
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-1">
                <Zap className="w-5 h-5 text-blue-400 mx-auto" />
                <h5 className="text-[11px] font-bold text-blue-200">Azure Function</h5>
                <span className="text-[9px] text-blue-300/80">Blob Trigger</span>
              </div>
            </div>

            {/* Cloud Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" /> Azure Blob Object Storage
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Provides high-durability, virtually unlimited cloud object storage for raw input files and generated output JSON artifacts. Storage is partitioned into input and output containers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Azure Functions Serverless Processing
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Automatically triggers on Azure Blob creation events, streams the file payload to memory, applies the computation engine, and uploads the analyzed artifact to the Output Container.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Architectural Standards Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Cloud Architecture &amp; Security Principles
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <strong className="text-emerald-400 font-semibold block">1. Zero Client Secrets</strong>
            <p>The browser never communicates directly with Azure. All cloud requests flow through the FastAPI backend via azure-storage-blob with standard Managed Identity / credential chains.</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <strong className="text-cyan-400 font-semibold block">2. Decoupled Storage &amp; Compute</strong>
            <p>Storage (Azure Blob containers / local disk) is strictly decoupled from compute workers, enabling independent scaling and serverless event invocation.</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <strong className="text-indigo-400 font-semibold block">3. Resilient Dual-Mode</strong>
            <p>Full parallel multiprocessing works offline in Local Demo Mode with zero cloud dependencies, while supporting Microsoft Azure Blob/Functions in production.</p>
          </div>
        </div>
      </div>

      {/* Future Phase Notice */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-400" />
          <span>Advanced features (Azure Service Bus Queue, Azure Container Apps, VM Scale Sets) are planned for future phases.</span>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          Phase 3 Roadmap
        </span>
      </div>
    </div>
  );
};
