import React from 'react';
import { CheckCircle2, Clock, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { JobStatusType, WorkerStatusType } from '../types';

interface StatusBadgeProps {
  status: JobStatusType | WorkerStatusType | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const configs: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    COMPLETED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
    },
    PROCESSED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
    },
    PROCESSING: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-300',
      border: 'border-cyan-500/30',
      icon: Loader2,
    },
    BUSY: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-300',
      border: 'border-indigo-500/30',
      icon: Loader2,
    },
    QUEUED: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: Clock,
    },
    UPLOADED: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-300',
      border: 'border-slate-600/30',
      icon: Clock,
    },
    IDLE: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-700/50',
      icon: Clock,
    },
    FAILED: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: AlertCircle,
    },
    CANCELLED: {
      bg: 'bg-slate-700/20',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: XCircle,
    },
  };

  const cfg = configs[normalized] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: Clock,
  };

  const Icon = cfg.icon;
  const isAnimated = normalized === 'PROCESSING' || normalized === 'BUSY';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      <Icon className={`w-3 h-3 ${isAnimated ? 'animate-spin' : ''}`} />
      <span>{normalized}</span>
    </span>
  );
};
