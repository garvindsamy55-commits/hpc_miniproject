import React from 'react';
import { Network } from 'lucide-react';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { OperatingMode } from '../types';

interface ArchitecturePageProps {
  mode: OperatingMode;
}

export const ArchitecturePage: React.FC<ArchitecturePageProps> = ({ mode }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Network className="w-6 h-6 text-cyan-400" />
          CloudBurst System Architecture &amp; Dataflow
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          High Performance and Cloud Computing design architecture: Client UI → FastAPI API Gateway → Multiprocessing Workers / Azure Blob Storage + Azure Functions.
        </p>
      </div>

      {/* Interactive Topology Diagram */}
      <ArchitectureDiagram currentMode={mode} />
    </div>
  );
};
