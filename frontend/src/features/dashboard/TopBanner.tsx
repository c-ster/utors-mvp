import { Gauge } from '@/components/ui/gauge';
import { Card } from '@/components/ui/card';
import { Shield, Users, Brain, Activity, AlertTriangle, UserMinus } from 'lucide-react';
import type { DashboardMetrics } from '@/types';
import { cn } from '@/lib/utils';

function MetricBox({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4">
      <Icon className={cn('w-5 h-5', color || 'text-slate-400')} />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className={cn('text-lg font-bold font-mono', color || 'text-slate-200')}>{value}</div>
        {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export function TopBanner({ metrics }: { metrics: DashboardMetrics }) {
  const riskColor = metrics.aggregate_risk_level === 'Green' ? 'text-emerald-400'
    : metrics.aggregate_risk_level === 'Amber' ? 'text-amber-400' : 'text-red-400';

  return (
    <Card className="border-slate-700/50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-500" />
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">UTORS</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Unit Talent Optimization & Readiness System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Gauge
            value={100 - metrics.aggregate_risk_score}
            label="Aggregate Risk"
            status={metrics.aggregate_risk_level}
            size="sm"
          />
          <Gauge
            value={metrics.strength.percentage}
            label="Strength"
            status={metrics.strength.status}
            size="sm"
          />
          <Gauge
            value={metrics.talent_optimization_score}
            label="Talent Opt"
            status={metrics.talent_optimization_score > 70 ? 'Green' : metrics.talent_optimization_score > 50 ? 'Amber' : 'Red'}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-1 divide-x divide-slate-700/50">
          <MetricBox
            icon={Users}
            label="Strength"
            value={`${metrics.strength.assigned}/${metrics.strength.authorized}`}
            sub={`${metrics.strength.percentage.toFixed(1)}%`}
            color={metrics.strength.status === 'Green' ? 'text-emerald-400' : metrics.strength.status === 'Amber' ? 'text-amber-400' : 'text-red-400'}
          />
          <MetricBox
            icon={AlertTriangle}
            label="Non-Deployable"
            value={metrics.non_deployable_count}
            color={metrics.non_deployable_count > 20 ? 'text-red-400' : 'text-amber-400'}
          />
          <MetricBox icon={Activity} label="Incoming" value={metrics.total_incoming} color="text-emerald-400" />
          <MetricBox icon={UserMinus} label="Outgoing" value={metrics.total_outgoing} color="text-amber-400" />
        </div>
      </div>
    </Card>
  );
}
