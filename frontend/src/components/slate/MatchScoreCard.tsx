/**
 * Match Score Card Component
 * Displays detailed breakdown of a soldier-to-billet match with
 * MTOE/Talent/Preference progress bars and AI reasoning.
 */
import { Brain, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { MatchResult, Billet } from '@/types';

interface MatchScoreCardProps {
  match: MatchResult;
  billet?: Billet;
}

function scoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreTextColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export function MatchScoreCard({ match, billet }: MatchScoreCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            Match Analysis
          </CardTitle>
          <Badge variant="blue" className="text-[10px]">AI Generated</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment Summary */}
        <div className="p-3 rounded-lg bg-slate-800/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">{match.soldier_name}</p>
              <p className="text-xs text-slate-500">{match.soldier_mos}</p>
            </div>
            <span className="text-xs text-slate-600">&rarr;</span>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-200">{match.billet_position_title}</p>
              <p className="text-xs text-slate-500">{match.billet_required_rank}/{match.billet_required_mos}</p>
            </div>
          </div>
        </div>

        {/* Total Score */}
        <div className="text-center">
          <p className="text-4xl font-mono font-bold">
            <span className={scoreTextColor(match.total_score, 100)}>
              {match.total_score.toFixed(0)}
            </span>
            <span className="text-lg text-slate-600">/100</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Match Score</p>
        </div>

        <Separator />

        {/* Score Breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Score Breakdown</p>

          {/* MTOE Fit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">MTOE Fit (Rank/MOS)</span>
              <span className={cn('font-mono text-xs', scoreTextColor(match.breakdown.mtoe_fit, 55))}>
                {match.breakdown.mtoe_fit.toFixed(0)}/55
              </span>
            </div>
            <Progress
              value={(match.breakdown.mtoe_fit / 55) * 100}
              indicatorClassName={scoreColor(match.breakdown.mtoe_fit, 55)}
            />
          </div>

          {/* Talent Fit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Talent Fit (KSBs)</span>
              <span className={cn('font-mono text-xs', scoreTextColor(match.breakdown.talent_fit, 25))}>
                {match.breakdown.talent_fit.toFixed(0)}/25
              </span>
            </div>
            <Progress
              value={(match.breakdown.talent_fit / 25) * 100}
              indicatorClassName={scoreColor(match.breakdown.talent_fit, 25)}
            />
          </div>

          {/* Preference Fit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Preference Fit</span>
              <span className={cn('font-mono text-xs', scoreTextColor(match.breakdown.preference_fit, 20))}>
                {match.breakdown.preference_fit.toFixed(0)}/20
              </span>
            </div>
            <Progress
              value={(match.breakdown.preference_fit / 20) * 100}
              indicatorClassName={scoreColor(match.breakdown.preference_fit, 20)}
            />
          </div>
        </div>

        <Separator />

        {/* AI Reasoning */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            Why This Match?
          </p>
          <p className="text-sm text-slate-300 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
            {match.ai_reasoning || 'Standard assignment based on MOS and grade requirements.'}
          </p>
        </div>

        {/* Flags/Warnings */}
        {match.flags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Warnings ({match.flags.length})
            </p>
            <ul className="space-y-1">
              {match.flags.map((flag, index) => (
                <li key={index} className="text-xs text-amber-400 flex items-start gap-2">
                  <span className="mt-0.5">&bull;</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Positive indicator */}
        {match.total_score >= 70 && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Strong match recommended</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
