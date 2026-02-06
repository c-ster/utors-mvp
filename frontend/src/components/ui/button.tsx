import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const variants: Record<string, string> = {
  default: 'bg-emerald-500 text-white hover:bg-emerald-600',
  outline: 'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100',
  ghost: 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes: Record<string, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9',
};

const buttonClasses = (variant: string, size: string, className?: string) =>
  cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild, children, ...props }, ref) => {
    // When asChild, render the child element with button styling applied
    if (asChild && children && typeof children === 'object' && 'type' in children) {
      const child = children as React.ReactElement<Record<string, unknown>>;
      const childProps = child.props as Record<string, unknown>;
      const Comp = (child as React.ReactElement<Record<string, unknown>>).type as React.ElementType;
      return (
        <Comp
          {...childProps}
          className={buttonClasses(variant, size, cn(className, childProps.className as string))}
        />
      );
    }

    return (
      <button
        className={buttonClasses(variant, size, className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
