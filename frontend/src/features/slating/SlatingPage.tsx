import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner, ErrorDisplay } from '@/components/ui/loading';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { cn, riskColor, formatScore } from '@/lib/utils';
import {
  Brain, Wand2, Check, AlertTriangle, ChevronDown, ChevronUp,
  GripVertical, User, Crosshair, Heart, Info,
} from 'lucide-react';
import type { MatchResult, SlateResponse } from '@/types';

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8 text-right">{formatScore(value)}</span>
    </div>
  );
}

function MatchCard({ match, onRemove }: { match: MatchResult; onRemove?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasWarnings = match.flags.some(f => f.startsWith('Missing') || f.startsWith('MOS mismatch'));

  return (
    <div className={cn(
      'rounded-lg border bg-slate-800/60 p-3 transition-all',
      hasWarnings ? 'border-amber-500/30' : 'border-slate-700/50',
    )}>
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-slate-600 cursor-grab flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-sm font-semibold text-slate-200 truncate">{match.soldier_name}</span>
            <Badge variant="outline">{match.soldier_mos}</Badge>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            &rarr; {match.billet_position_title}
            <span className="text-slate-600 ml-1">({match.billet_required_rank}/{match.billet_required_mos})</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={cn(
            'text-lg font-bold font-mono',
            match.total_score >= 80 ? 'text-emerald-400' :
            match.total_score >= 55 ? 'text-amber-400' : 'text-red-400'
          )}>
            {formatScore(match.total_score)}
          </div>

          <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-300">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
          {/* Score breakdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Crosshair className="w-3 h-3" /> MTOE Fit (55 max)
            </div>
            <ScoreBar value={match.breakdown.mtoe_fit} max={55} color="bg-blue-500" />

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <User className="w-3 h-3" /> Talent Fit (25 max)
            </div>
            <ScoreBar value={match.breakdown.talent_fit} max={25} color="bg-emerald-500" />

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Heart className="w-3 h-3" /> Preference (20 max)
            </div>
            <ScoreBar value={match.breakdown.preference_fit} max={20} color="bg-amber-500" />
          </div>

          {/* AI Reasoning */}
          <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-2">
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-1">
              <Brain className="w-3 h-3" /> AI Reasoning
            </div>
            <p className="text-xs text-slate-300">{match.ai_reasoning}</p>
          </div>

          {/* Flags */}
          {match.flags.length > 0 && (
            <div className="space-y-1">
              {match.flags.map((flag, i) => (
                <div key={i} className={cn(
                  'flex items-center gap-1.5 text-xs',
                  flag.startsWith('Missing') || flag.startsWith('MOS mismatch')
                    ? 'text-amber-400' : 'text-slate-400'
                )}>
                  {flag.startsWith('Missing') || flag.startsWith('MOS mismatch')
                    ? <AlertTriangle className="w-3 h-3" />
                    : <Info className="w-3 h-3" />
                  }
                  {flag}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SlatingPage({ uic }: { uic: string }) {
  const [slateResult, setSlateResult] = useState<SlateResponse | null>(null);

  const { data: unitData, isLoading: unitLoading } = useQuery({
    queryKey: ['unit', uic],
    queryFn: () => api.getUnit(uic),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateSlate(uic, true),
    onSuccess: (data) => setSlateResult(data),
  });

  const commitMutation = useMutation({
    mutationFn: () => {
      if (!slateResult) return Promise.reject('No slate');
      const assignments = slateResult.matches.map(m => ({
        soldier_edipi: m.soldier_edipi,
        billet_id: m.billet_id,
      }));
      return api.commitSlate(uic, assignments);
    },
  });

  if (unitLoading) return <LoadingSpinner message="Loading unit data..." />;

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-500" />
              Slate Generator &mdash; {unitData?.unit_name || uic}
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  'bg-emerald-500 hover:bg-emerald-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {generateMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generate Slate
              </button>

              {slateResult && (
                <button
                  onClick={() => commitMutation.mutate()}
                  disabled={commitMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Commit Slate
                </button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {generateMutation.isPending && <LoadingSpinner message="Running Seating Chart Algorithm..." />}
      {generateMutation.error && <ErrorDisplay message={(generateMutation.error as Error).message} />}
      {commitMutation.isSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400 text-sm">
          Slate committed successfully.
        </div>
      )}

      {slateResult && (
        <div className="grid grid-cols-12 gap-4">
          {/* Matches */}
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  AI-Recommended Assignments ({slateResult.matches.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {slateResult.matches
                  .sort((a, b) => b.total_score - a.total_score)
                  .map((match) => (
                    <MatchCard key={`${match.soldier_edipi}-${match.billet_id}`} match={match} />
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Unslotted & Unfilled */}
          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Unslotted Soldiers ({slateResult.unslotted_soldiers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {slateResult.unslotted_soldiers.length === 0 ? (
                  <p className="text-xs text-slate-500">All soldiers assigned.</p>
                ) : (
                  <div className="space-y-1">
                    {slateResult.unslotted_soldiers.map((edipi) => (
                      <div key={edipi} className="text-xs font-mono text-slate-400 py-1 px-2 rounded bg-slate-800/50">
                        {edipi}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unfilled Billets ({slateResult.unfilled_billets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {slateResult.unfilled_billets.length === 0 ? (
                  <p className="text-xs text-slate-500">All billets filled.</p>
                ) : (
                  <div className="space-y-1">
                    {slateResult.unfilled_billets.map((bid) => (
                      <div key={bid} className="text-xs font-mono text-amber-400 py-1 px-2 rounded bg-amber-500/10">
                        {bid.substring(0, 8)}...
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
