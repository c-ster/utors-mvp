import { cn, riskBgSolid } from '@/lib/utils';

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function Gauge({ value, max = 100, label, status, size = 'md', showValue = true }: GaugeProps) {
  const pct = Math.min(100, (value / max) * 100);
  const sizes = {
    sm: { container: 'w-20 h-20', text: 'text-lg', label: 'text-[10px]' },
    md: { container: 'w-28 h-28', text: 'text-2xl', label: 'text-xs' },
    lg: { container: 'w-36 h-36', text: 'text-3xl', label: 'text-sm' },
  };
  const s = sizes[size];

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (pct / 100) * circumference;

  const strokeColor =
    status === 'Green' ? '#10b981' :
    status === 'Amber' ? '#f59e0b' :
    status === 'Red' ? '#ef4444' : '#64748b';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('relative', s.container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold font-mono', s.text, {
              'text-emerald-400': status === 'Green',
              'text-amber-400': status === 'Amber',
              'text-red-400': status === 'Red',
            })}>
              {Math.round(value)}
            </span>
          </div>
        )}
      </div>
      <span className={cn('text-slate-400 font-medium uppercase tracking-wider', s.label)}>{label}</span>
    </div>
  );
}

export function LinearGauge({ value, label, status }: { value: number; label: string; status: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={cn('text-sm font-mono font-bold', {
          'text-emerald-400': status === 'Green',
          'text-amber-400': status === 'Amber',
          'text-red-400': status === 'Red',
        })}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', riskBgSolid(status))}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
