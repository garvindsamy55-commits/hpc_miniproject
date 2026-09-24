import React from 'react';
import { HardDrive, Cloud, UploadCloud, RefreshCw, ShieldCheck, Database, Globe, Lock, BarChart2, CheckCircle2 } from 'lucide-react';
import { StorageTable } from '../components/StorageTable';
import { StorageOverview, BlobListResponse, OperatingMode } from '../types';

interface CloudStoragePageProps {
  storage: StorageOverview | null;
  s3Data: BlobListResponse | null;
  mode: OperatingMode;
  onRefresh: () => void;
  onUploadS3File?: (file: File) => Promise<void>;
  onDeleteS3File?: (bucketType: 'input' | 'output', key: string) => Promise<void>;
  isUploadingS3?: boolean;
}

const AZURE_SERVICES = [
  { name: 'cloudburst-input-container', type: 'Blob Container', region: 'eastus', status: 'active', size: '18.4 MB', objects: 6, storageClass: 'Hot Tier', icon: Database, color: 'blue' },
  { name: 'cloudburst-output-container', type: 'Blob Container', region: 'eastus', status: 'active', size: '2.1 MB', objects: 4, storageClass: 'Cool Tier', icon: Database, color: 'emerald' },
  { name: 'Azure Front Door CDN', type: 'Global Endpoint', region: 'Global', status: 'enabled', size: '—', objects: 0, storageClass: 'N/A', icon: Globe, color: 'cyan' },
  { name: 'Azure Key Vault Key', type: 'Managed Key', region: 'eastus', status: 'active', size: '—', objects: 0, storageClass: 'AES-256', icon: Lock, color: 'violet' },
];

const colorMap: Record<string, { badge: string; dot: string; border: string; bg: string; icon: string }> = {
  blue:    { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', dot: 'bg-blue-400', border: 'border-blue-800/40', bg: 'bg-blue-950/20', icon: 'text-blue-400' },
  emerald: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400', border: 'border-emerald-800/40', bg: 'bg-emerald-950/20', icon: 'text-emerald-400' },
  cyan:    { badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', dot: 'bg-cyan-400', border: 'border-cyan-800/40', bg: 'bg-cyan-950/20', icon: 'text-cyan-400' },
  violet:  { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40', dot: 'bg-violet-400', border: 'border-violet-800/40', bg: 'bg-violet-950/20', icon: 'text-violet-400' },
};

export const CloudStoragePage: React.FC<CloudStoragePageProps> = ({
  storage,
  s3Data,
  mode,
  onRefresh,
  onDeleteS3File,
}) => {
  const totalInputSize = s3Data?.input_files.reduce((s, f) => s + f.size, 0) ?? 0;
  const totalOutputSize = s3Data?.output_files.reduce((s, f) => s + f.size, 0) ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-sky-400" />
            Azure Cloud Storage Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Azure Blob Storage input/output containers · Object metadata · Access tier analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Blob Storage Connected · eastus
          </div>
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync from Azure
          </button>
        </div>
      </div>

      {/* Blob Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Input Blobs', value: s3Data?.input_files_count ?? 6, sub: `${(totalInputSize / 1048576).toFixed(1)} MB`, color: 'text-sky-400', icon: UploadCloud },
          { label: 'Output Results', value: s3Data?.output_files_count ?? 4, sub: `${(totalOutputSize / 1024).toFixed(0)} KB`, color: 'text-emerald-400', icon: Cloud },
          { label: 'Total Blobs', value: (s3Data?.input_files_count ?? 6) + (s3Data?.output_files_count ?? 4), sub: 'Across 2 containers', color: 'text-cyan-400', icon: Database },
          { label: 'Access Tiers', value: 2, sub: 'Hot + Cool', color: 'text-violet-400', icon: BarChart2 },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Azure Resource Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          Azure Resource Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AZURE_SERVICES.map((svc) => {
            const Icon = svc.icon;
            const c = colorMap[svc.color] || colorMap['blue'];
            return (
              <div key={svc.name} className={`p-4 rounded-xl border ${c.border} ${c.bg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
                    {svc.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono truncate">{svc.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{svc.type}</div>
                </div>
                <div className="pt-1 border-t border-slate-800/50 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                  <span>Region: <span className="text-slate-300">{svc.region}</span></span>
                  {svc.objects > 0 && <span>Blobs: <span className="text-slate-300">{svc.objects}</span></span>}
                  {svc.size !== '—' && <span>Size: <span className="text-slate-300">{svc.size}</span></span>}
                  <span>Tier: <span className="text-slate-300">{svc.storageClass}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage Table & Blob Browser */}
      <StorageTable
        storage={storage}
        s3Data={s3Data}
        mode="azure"
        onRefresh={onRefresh}
        onDeleteS3File={onDeleteS3File}
      />

      {/* Azure RBAC & Encryption Info */}
      <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/40 text-xs text-sky-300 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <span>
          <strong>Security:</strong> All Azure Blobs are encrypted with Microsoft-managed 256-bit AES encryption. Azure RBAC &amp; Managed Identity{' '}
          <code className="font-mono bg-sky-900/30 px-1 py-0.5 rounded">Storage Blob Data Contributor</code> grants least-privilege
          read/write access to storage containers. Public anonymous access is disabled. Transfer requires HTTPS/TLS 1.3.
        </span>
      </div>
    </div>
  );
};
