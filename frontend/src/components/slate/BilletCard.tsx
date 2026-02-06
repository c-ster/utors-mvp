/**
 * Billet Card Component
 * Displays a single billet/position slot with assignment status.
 * Supports drag-and-drop for manual soldier placement.
 */
import { User, UserPlus, AlertTriangle, Brain, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Billet, MatchResult } from '@/types';

interface BilletCardProps {
  billet: Billet;
  match?: MatchResult;
  isSelected?: boolean;
  onSelect?: () => void;
  onDrop?: (soldierEdipi: string) => void;
}

export function BilletCard({ billet, match, isSelected, onSelect, onDrop }: BilletCardProps) {
  const isAssigned = !!match || !!billet.assigned_soldier_edipi;
  const hasFlags = match && match.flags.length > 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-emerald-500');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-emerald-500');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-emerald-500');
    const soldierEdipi = e.dataTransfer.getData('soldier-edipi');
    if (soldierEdipi && onDrop) {
      onDrop(soldierEdipi);
    }
  };

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md hover:shadow-black/20',
        isSelected && 'ring-2 ring-emerald-500',
        !isAssigned && 'border-dashed border-slate-600',
        isAssigned && hasFlags && 'border-amber-500/50',
      )}
      onClick={onSelect}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Position Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {billet.is_key_billet && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            <p className="text-xs font-mono text-slate-500">{billet.position_id}</p>
          </div>
          <p className="text-sm font-medium text-slate-200 truncate">{billet.position_title}</p>
        </div>
        <Badge variant="outline" className="text-[10px] ml-2 flex-shrink-0">
          {billet.required_rank}/{billet.required_mos}
        </Badge>
      </div>

      {/* Assignment Status */}
      {match ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded bg-slate-800/80">
            <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {match.soldier_name}
              </p>
              <p className="text-xs text-slate-500">{match.soldier_mos}</p>
            </div>
            <span title="AI Recommended"><Brain className="w-4 h-4 text-blue-400 flex-shrink-0" /></span>
          </div>

          {/* Match Score */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Match Score</span>
            <span className={cn(
              'font-mono font-bold',
              match.total_score >= 80 ? 'text-emerald-400' :
              match.total_score >= 60 ? 'text-amber-400' : 'text-red-400'
            )}>
              {match.total_score.toFixed(0)}/100
            </span>
          </div>

          {/* First flag */}
          {hasFlags && (
            <div className="flex items-start gap-1 text-xs text-amber-400">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="truncate">{match.flags[0]}</span>
            </div>
          )}
        </div>
      ) : billet.assigned_soldier_edipi ? (
        <div className="flex items-center gap-2 p-2 rounded bg-slate-800/80">
          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">
              {billet.assigned_soldier_name || billet.assigned_soldier_edipi}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-4 border border-dashed border-slate-700 rounded bg-slate-800/20">
          <div className="text-center">
            <UserPlus className="w-5 h-5 mx-auto text-slate-600 mb-1" />
            <p className="text-xs text-slate-600">Unassigned</p>
          </div>
        </div>
      )}

      {/* Critical KSBs */}
      {billet.critical_ksbs && billet.critical_ksbs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {billet.critical_ksbs.slice(0, 2).map((ksb) => (
            <Badge key={ksb} variant="blue" className="text-[9px]">
              {ksb}
            </Badge>
          ))}
          {billet.critical_ksbs.length > 2 && (
            <Badge variant="default" className="text-[9px]">
              +{billet.critical_ksbs.length - 2}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
