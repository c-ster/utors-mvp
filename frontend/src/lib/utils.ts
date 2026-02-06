import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function riskColor(level: string): string {
  switch (level) {
    case 'Green': return 'text-emerald-500';
    case 'Amber': return 'text-amber-500';
    case 'Red': return 'text-red-500';
    default: return 'text-slate-400';
  }
}

export function riskBg(level: string): string {
  switch (level) {
    case 'Green': return 'bg-emerald-500/20 border-emerald-500/40';
    case 'Amber': return 'bg-amber-500/20 border-amber-500/40';
    case 'Red': return 'bg-red-500/20 border-red-500/40';
    default: return 'bg-slate-700/30 border-slate-600/40';
  }
}

export function riskBgSolid(level: string): string {
  switch (level) {
    case 'Green': return 'bg-emerald-500';
    case 'Amber': return 'bg-amber-500';
    case 'Red': return 'bg-red-500';
    default: return 'bg-slate-500';
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'Critical': return 'text-red-400';
    case 'High': return 'text-red-500';
    case 'Medium': return 'text-amber-500';
    case 'Low': return 'text-blue-400';
    default: return 'text-slate-400';
  }
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}
