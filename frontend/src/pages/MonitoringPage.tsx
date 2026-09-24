import React, { useState } from 'react';
import { Activity, Trash2, RefreshCw, Filter, ShieldCheck, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { SystemLog } from '../types';

interface MonitoringPageProps {
  logs: SystemLog[];
  onRefresh: () => void;
  onClearLogs: () => void;
}

export const MonitoringPage: React.FC<MonitoringPageProps> = ({
  logs,
  onRefresh,
  onClearLogs,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">SUCCESS</span>;
      case 'ERROR':
        return <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40 text-[10px] font-bold">ERROR</span>;
      case 'WARN':
        return <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[10px] font-bold">WARN</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 text-[10px] font-bold">INFO</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Live Audit &amp; Event Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time execution log stream recording worker allocations, job dispatches, and cloud operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onClearLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>

          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Stream
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter Logs:
          </span>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO Only</option>
            <option value="WARN">WARN Only</option>
            <option value="ERROR">ERROR Only</option>
            <option value="SUCCESS">SUCCESS Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="JOB">JOB</option>
            <option value="WORKER">WORKER</option>
            <option value="AZURE">AZURE</option>
            <option value="STORAGE">STORAGE</option>
            <option value="BENCHMARK">BENCHMARK</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Showing {filteredLogs.length} of {logs.length} Log Entries
        </span>
      </div>

      {/* Logs Terminal Stream */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-2xl font-mono text-xs">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Event Log Stream
          </span>
          <span className="text-[10px] text-slate-500">Live SQLite Audit Ledger</span>
        </div>

        <div className="max-h-[550px] overflow-y-auto divide-y divide-slate-900 p-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {log.timestamp}
                  </span>
                  {getLevelBadge(log.level)}
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                    {log.category}
                  </span>
                  <span className="text-slate-200 break-all">{log.message}</span>
                </div>

                {log.details && (
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded truncate max-w-xs">
                    {JSON.stringify(log.details)}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 italic">
              No matching log records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
