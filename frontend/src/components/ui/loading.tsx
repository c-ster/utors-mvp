export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-slate-400">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-500" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
      {message}
    </div>
  );
}
