import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge } from '@/components/ui/gauge';
import { LoadingSpinner, ErrorDisplay } from '@/components/ui/loading';
import { cn, riskColor } from '@/lib/utils';
import {
  Swords, UserMinus, UserPlus, RotateCcw, Play, AlertTriangle,
} from 'lucide-react';
import type { DashboardMetrics } from '@/types';

interface SimAction {
  id: string;
  type: 'loss' | 'gain';
  description: string;
  count: number;
  ksb_impact?: string;
}

function simulateImpact(
  baseline: DashboardMetrics,
  actions: SimAction[],
): DashboardMetrics {
  const totalLosses = actions.filter(a => a.type === 'loss').reduce((s, a) => s + a.count, 0);
  const totalGains = actions.filter(a => a.type === 'gain').reduce((s, a) => s + a.count, 0);
  const netChange = totalGains - totalLosses;

  const newAssigned = Math.max(0, baseline.strength.assigned + netChange);
  const newPct = (newAssigned / baseline.strength.authorized) * 100;
  const newStatus = newPct >= 91 ? 'Green' : newPct >= 71 ? 'Amber' : 'Red';

  const riskIncrease = totalLosses * 3;
  const riskDecrease = totalGains * 1.5;
  const newRisk = Math.max(0, Math.min(100, baseline.aggregate_risk_score + riskIncrease - riskDecrease));
  const newRiskLevel = newRisk <= 30 ? 'Green' : newRisk <= 60 ? 'Amber' : 'Red';

  const ksbLossActions = actions.filter(a => a.type === 'loss' && a.ksb_impact);
  const additionalAlerts = ksbLossActions.map(a => ({
    id: `sim-${a.id}`,
    severity: 'Critical' as const,
    title: `[SIMULATED] Loss of ${a.ksb_impact} capability`,
    description: `${a.count} personnel with ${a.ksb_impact} projected lost. Immediate action required.`,
    unit_uic: 'W1SF00',
    unit_name: 'SIMULATED SCENARIO',
    affected_ksb: a.ksb_impact || undefined,
  }));

  return {
    ...baseline,
    aggregate_risk_score: newRisk,
    aggregate_risk_level: newRiskLevel,
    strength: {
      ...baseline.strength,
      assigned: newAssigned,
      percentage: Math.round(newPct * 10) / 10,
      status: newStatus,
    },
    non_deployable_count: baseline.non_deployable_count + Math.floor(totalLosses * 0.2),
    critical_alerts: [...additionalAlerts, ...baseline.critical_alerts].slice(0, 5),
    talent_optimization_score: Math.max(0, baseline.talent_optimization_score - totalLosses * 2 + totalGains),
  };
}

export function WargamePage({ uic }: { uic: string }) {
  const [actions, setActions] = useState<SimAction[]>([]);
  const [simulated, setSimulated] = useState<DashboardMetrics | null>(null);

  const { data: baseline, isLoading, error } = useQuery({
    queryKey: ['dashboard', uic],
    queryFn: () => api.getDashboardMetrics(uic),
  });

  const [newAction, setNewAction] = useState<{
    type: 'loss' | 'gain';
    description: string;
    count: string;
    ksb_impact: string;
  }>({ type: 'loss', description: '', count: '1', ksb_impact: '' });

  const addAction = () => {
    if (!newAction.description) return;
    setActions([...actions, {
      id: Date.now().toString(),
      type: newAction.type,
      description: newAction.description,
      count: parseInt(newAction.count) || 1,
      ksb_impact: newAction.ksb_impact || undefined,
    }]);
    setNewAction({ type: 'loss', description: '', count: '1', ksb_impact: '' });
    setSimulated(null);
  };

  const runSimulation = () => {
    if (!baseline) return;
    setSimulated(simulateImpact(baseline, actions));
  };

  const reset = () => {
    setActions([]);
    setSimulated(null);
  };

  if (isLoading) return <LoadingSpinner message="Loading baseline data..." />;
  if (error) return <ErrorDisplay message={(error as Error).message} />;
  if (!baseline) return null;

  const display = simulated || baseline;

  return (
    <div className="p-4 space-y-4">
      <Card className="border-amber-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-500" />
              Wargame Module
              {simulated && <Badge variant="amber">SIMULATED</Badge>}
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={runSimulation}
                disabled={actions.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50 transition-all"
              >
                <Play className="w-4 h-4" /> Run Simulation
              </button>
              <button onClick={reset} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 border border-slate-700 transition-colors">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* Actions panel */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Add action form */}
              <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewAction({ ...newAction, type: 'loss' })}
                    className={cn('flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-colors', newAction.type === 'loss' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 border border-slate-700')}
                  >
                    <UserMinus className="w-3 h-3" /> Loss
                  </button>
                  <button
                    onClick={() => setNewAction({ ...newAction, type: 'gain' })}
                    className={cn('flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-colors', newAction.type === 'gain' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 border border-slate-700')}
                  >
                    <UserPlus className="w-3 h-3" /> Gain
                  </button>
                </div>
                <input
                  type="text" placeholder="Description (e.g., Lead engineer company)"
                  value={newAction.description}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" min="1" placeholder="Count"
                    value={newAction.count}
                    onChange={(e) => setNewAction({ ...newAction, count: e.target.value })}
                    className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:border-amber-500/50 focus:outline-none"
                  />
                  <input
                    type="text" placeholder="KSB Impact (opt)"
                    value={newAction.ksb_impact}
                    onChange={(e) => setNewAction({ ...newAction, ksb_impact: e.target.value })}
                    className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <button
                  onClick={addAction}
                  disabled={!newAction.description}
                  className="w-full py-2 rounded bg-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-600 disabled:opacity-40 transition-colors"
                >
                  Add Action
                </button>
              </div>

              {/* Queued actions */}
              {actions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Add personnel changes to simulate.</p>
              ) : (
                actions.map((action) => (
                  <div key={action.id} className={cn(
                    'flex items-center gap-2 p-2 rounded border text-xs',
                    action.type === 'loss' ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20',
                  )}>
                    {action.type === 'loss' ? <UserMinus className="w-3 h-3 text-red-400" /> : <UserPlus className="w-3 h-3 text-emerald-400" />}
                    <span className="flex-1 text-slate-300">{action.description}</span>
                    <span className="font-mono text-slate-400">x{action.count}</span>
                    <button
                      onClick={() => { setActions(actions.filter(a => a.id !== action.id)); setSimulated(null); }}
                      className="text-slate-600 hover:text-red-400"
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Simulated dashboard */}
        <div className="col-span-8 space-y-4">
          {/* Gauges */}
          <Card className={simulated ? 'border-amber-500/30' : ''}>
            <CardContent className="py-4">
              <div className="flex items-center justify-around">
                <Gauge
                  value={100 - display.aggregate_risk_score}
                  label="Aggregate Risk"
                  status={display.aggregate_risk_level}
                  size="md"
                />
                <Gauge
                  value={display.strength.percentage}
                  label="Strength"
                  status={display.strength.status}
                  size="md"
                />
                <Gauge
                  value={display.talent_optimization_score}
                  label="Talent Opt"
                  status={display.talent_optimization_score > 70 ? 'Green' : display.talent_optimization_score > 50 ? 'Amber' : 'Red'}
                  size="md"
                />
                <div className="text-center">
                  <div className="text-3xl font-bold font-mono text-slate-200">
                    {display.strength.assigned}/{display.strength.authorized}
                  </div>
                  <div className="text-xs text-slate-500 uppercase mt-1">Assigned / Authorized</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simulated alerts */}
          <Card className={simulated ? 'border-amber-500/30' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {simulated ? 'Projected Risk Feed' : 'Current Risk Feed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {display.critical_alerts.map((alert) => (
                <div key={alert.id} className={cn(
                  'rounded-lg border p-3 text-xs',
                  alert.id.startsWith('sim-')
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-800/50 border-slate-700/50',
                )}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn('w-3 h-3', alert.id.startsWith('sim-') ? 'text-amber-400' : riskColor(alert.severity === 'Critical' ? 'Red' : 'Amber'))} />
                    <span className="font-semibold text-slate-200">{alert.title}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{alert.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
