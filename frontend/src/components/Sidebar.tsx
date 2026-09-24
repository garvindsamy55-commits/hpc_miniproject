import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  HardDrive,
  Cpu,
  Zap,
  Activity,
  Network,
  Settings,
  HelpCircle,
  CloudLightning,
  ShieldCheck,
  Server
} from 'lucide-react';
import { OperatingMode } from '../types';

interface SidebarProps {
  mode: OperatingMode;
  backendOnline: boolean;
  workerCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mode, backendOnline, workerCount }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'File Upload', path: '/upload', icon: UploadCloud },
    { name: 'Processing Jobs', path: '/jobs', icon: Layers },
    { name: 'Cloud Storage', path: '/storage', icon: HardDrive },
    { name: 'Parallel Workers', path: '/workers', icon: Cpu, badge: `${workerCount}` },
    { name: 'Performance', path: '/performance', icon: Zap },
    { name: 'Monitoring', path: '/monitoring', icon: Activity },
    { name: 'Architecture', path: '/architecture', icon: Network },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About Project', path: '/about', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <CloudLightning className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                CLOUDBURST
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Parallel Azure Engine
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 line-clamp-1">
            Parallel File Processing System using Azure
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Azure Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="bg-sky-950/20 rounded-xl p-3 border border-sky-800/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-sky-300 font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Azure Cloud Active
          </div>
          {[
            { label: 'Blob Storage', status: 'Connected', ok: true },
            { label: 'Azure Functions', status: 'Running', ok: true },
            { label: 'Managed ID', status: 'Active', ok: true },
            { label: 'Service Bus', status: 'Polling', ok: true },
          ].map((svc) => (
            <div key={svc.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-3 h-3" /> {svc.label}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px]">{svc.status}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center">
          <span className="text-[10px] text-slate-400 tracking-wider">
            HPCC MINI PROJECT 2026
          </span>
        </div>
      </div>
    </aside>
  );
};
