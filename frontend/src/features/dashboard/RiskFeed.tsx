import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { RiskAlert } from '@/types';
import { cn, severityColor } from '@/lib/utils';
import { AlertTriangle, AlertOctagon, Info, ShieldAlert } from 'lucide-react';

const severityIcon: Record<string, React.ElementType> = {
  Critical: AlertOctagon,
  High: ShieldAlert,
  Medium: AlertTriangle,
  Low: Info,
};

export function RiskFeed({ alerts }: { alerts: RiskAlert[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Critical Risk Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-sm">
            No critical alerts
          </div>
        ) : (
          alerts.map((alert, i) => {
            const Icon = severityIcon[alert.severity] || Info;
            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-lg border border-slate-700/50 bg-slate-800/50 p-3',
                  'hover:bg-slate-800/80 cursor-pointer transition-colors',
                  alert.severity === 'Critical' && 'border-red-500/30 bg-red-500/5',
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-600 font-mono w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', severityColor(alert.severity))} />
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-xs font-semibold', severityColor(alert.severity))}>
                      [{alert.severity.toUpperCase()}]
                    </div>
                    <div className="text-sm text-slate-200 font-medium mt-0.5">{alert.title}</div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.description}</p>
                    <div className="text-[10px] text-slate-600 mt-1 font-mono">{alert.unit_name}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
