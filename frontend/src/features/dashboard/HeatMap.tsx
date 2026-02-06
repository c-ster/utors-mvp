import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SubunitRisk } from '@/types';
import { cn, riskBg, riskColor } from '@/lib/utils';
import { Building2, AlertCircle } from 'lucide-react';

interface HeatMapProps {
  subunits: SubunitRisk[];
  parentUic: string;
  onSelectUnit?: (uic: string) => void;
}

export function HeatMap({ subunits, onSelectUnit }: HeatMapProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-500" />
          Organizational Heat Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {subunits.map((unit) => (
            <button
              key={unit.uic}
              onClick={() => onSelectUnit?.(unit.uic)}
              className={cn(
                'rounded-lg border p-4 text-left transition-all hover:scale-[1.02] cursor-pointer',
                'hover:shadow-lg hover:shadow-black/20',
                riskBg(unit.risk_level),
                unit.recently_changed && 'animate-pulse',
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    unit.risk_level === 'Green' ? 'bg-emerald-500' :
                    unit.risk_level === 'Amber' ? 'bg-amber-500' : 'bg-red-500'
                  )} />
                  <span className="text-sm font-semibold text-slate-200 truncate">
                    {unit.unit_name}
                  </span>
                </div>
                {unit.critical_gaps > 0 && (
                  <AlertCircle className={cn('w-4 h-4 flex-shrink-0', riskColor(unit.risk_level))} />
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Risk</div>
                  <div className={cn('text-lg font-bold font-mono', riskColor(unit.risk_level))}>
                    {unit.risk_score.toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Fill %</div>
                  <div className="text-lg font-bold font-mono text-slate-200">
                    {unit.fill_percentage.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Gaps</div>
                  <div className={cn(
                    'text-lg font-bold font-mono',
                    unit.critical_gaps > 0 ? 'text-red-400' : 'text-emerald-400'
                  )}>
                    {unit.critical_gaps}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex gap-1">
                <Badge variant={unit.risk_level === 'Green' ? 'green' : unit.risk_level === 'Amber' ? 'amber' : 'red'}>
                  {unit.risk_level}
                </Badge>
                <Badge variant="outline">{unit.echelon}</Badge>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
