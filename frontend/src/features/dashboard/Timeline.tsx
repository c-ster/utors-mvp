import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { PersonnelTimelineEntry } from '@/types';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

interface TimelineProps {
  entries: PersonnelTimelineEntry[];
  incoming: number;
  outgoing: number;
}

export function Timeline({ entries, incoming, outgoing }: TimelineProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Personnel Timeline (90-Day)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
            <TrendingUp className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <div className="text-lg font-bold font-mono text-emerald-400">{incoming}</div>
            <div className="text-[10px] text-slate-500 uppercase">Incoming</div>
          </div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
            <TrendingDown className="w-4 h-4 mx-auto text-red-400 mb-1" />
            <div className="text-lg font-bold font-mono text-red-400">{outgoing}</div>
            <div className="text-[10px] text-slate-500 uppercase">Outgoing</div>
          </div>
          <div className="rounded-lg bg-slate-700/30 border border-slate-600/30 p-2">
            <ArrowRightLeft className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <div className={cn(
              'text-lg font-bold font-mono',
              incoming - outgoing >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {incoming - outgoing >= 0 ? '+' : ''}{incoming - outgoing}
            </div>
            <div className="text-[10px] text-slate-500 uppercase">Net</div>
          </div>
        </div>

        {/* Timeline bars */}
        <div className="space-y-3">
          {entries.map((entry) => {
            const maxVal = Math.max(...entries.map(e => Math.max(e.gains, e.losses)), 1);
            return (
              <div key={entry.date} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className={cn(
                    'text-xs font-mono font-bold',
                    entry.net >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {entry.net >= 0 ? '+' : ''}{entry.net}
                  </span>
                </div>
                {/* Gains bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-6 text-right">+{entry.gains}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(entry.gains / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Losses bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-6 text-right">-{entry.losses}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(entry.losses / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
