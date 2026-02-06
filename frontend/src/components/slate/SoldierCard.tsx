/**
 * Soldier Card Component
 * Draggable card for unassigned soldiers in the bench/pool.
 */
import { GripVertical, Star, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Soldier } from '@/types';

interface SoldierCardProps {
  soldier: Soldier;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function SoldierCard({ soldier, isSelected, onSelect }: SoldierCardProps) {
  const hasKsbs = soldier.ksbs && soldier.ksbs.length > 0;
  const isDeployable = soldier.deployable_status === 'Green';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('soldier-edipi', soldier.edipi);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:shadow-black/20',
        isSelected && 'ring-2 ring-emerald-500',
        !isDeployable && 'border-amber-500/30',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 text-slate-600">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-200">
              {soldier.rank} {soldier.last_name}, {soldier.first_name}
            </p>
            {soldier.is_incoming && (
              <Badge variant="green" className="text-[10px]">INCOMING</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{soldier.mos}</Badge>
            {soldier.asi && (
              <Badge variant="default" className="text-xs">ASI: {soldier.asi}</Badge>
            )}
          </div>

          {/* Status row */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                soldier.deployable_status === 'Green' && 'bg-emerald-500',
                soldier.deployable_status === 'Amber' && 'bg-amber-500',
                soldier.deployable_status === 'Red' && 'bg-red-500',
              )} />
              <span className="text-xs text-slate-500">{soldier.deployable_status}</span>
            </div>
            {soldier.security_clearance === 'TS/SCI' && (
              <Badge variant="default" className="text-[10px]">TS/SCI</Badge>
            )}
          </div>

          {/* KSBs */}
          {hasKsbs && (
            <div className="flex flex-wrap gap-1 mt-2">
              {soldier.ksbs!.slice(0, 3).map((ksb) => (
                <Badge key={ksb} variant="outline" className="text-[9px]">{ksb}</Badge>
              ))}
              {soldier.ksbs!.length > 3 && (
                <Badge variant="outline" className="text-[9px]">+{soldier.ksbs!.length - 3}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Quality indicators */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {hasKsbs && soldier.ksbs!.length >= 3 && (
            <span title="Multiple KSBs"><Star className="w-4 h-4 text-amber-400" /></span>
          )}
          {!isDeployable && (
            <span title="Limited Deployability"><AlertCircle className="w-4 h-4 text-amber-500" /></span>
          )}
        </div>
      </div>

      <p className="text-[10px] font-mono text-slate-600 mt-2">EDIPI: {soldier.edipi}</p>
    </Card>
  );
}
