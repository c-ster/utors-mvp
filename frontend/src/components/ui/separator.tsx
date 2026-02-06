import { cn } from '@/lib/utils';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return (
    <div
      className={cn(
        'bg-slate-700/50',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
    />
  );
}
