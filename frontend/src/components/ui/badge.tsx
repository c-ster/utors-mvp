import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'green' | 'amber' | 'red' | 'blue' | 'outline';
}

const variants: Record<string, string> = {
  default: 'bg-slate-700/50 text-slate-300',
  green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  outline: 'border border-slate-600 text-slate-400',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium font-mono',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = status === 'Green' ? 'green' : status === 'Amber' ? 'amber' : status === 'Red' ? 'red' : 'default';
  return <Badge variant={variant}>{status}</Badge>;
}
