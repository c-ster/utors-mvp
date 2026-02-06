/**
 * Slate Generator Page
 * One-click AI-powered personnel slating with manual override capability.
 * Uses BilletCard grid grouped by MOS, with a detail panel for MatchScoreCard.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Users, Check, ArrowLeft, RefreshCw, Save,
  AlertTriangle, Brain, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BilletCard, MatchScoreCard } from '@/components/slate';
import { LoadingSpinner, ErrorDisplay } from '@/components/ui/loading';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { MatchResult, Billet, SlateResponse } from '@/types';

const DEFAULT_UIC = 'W1SF00';

export function SlateGeneratorPage() {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [selectedBillet, setSelectedBillet] = useState<Billet | null>(null);
  const [slateResult, setSlateResult] = useState<SlateResponse | null>(null);
  const [showUnslotted, setShowUnslotted] = useState(true);

  // Fetch unit data
  const unitQuery = useQuery({
    queryKey: ['unit', DEFAULT_UIC],
    queryFn: () => api.getUnit(DEFAULT_UIC),
  });

  // Fetch roster to see billets
  const rosterQuery = useQuery({
    queryKey: ['roster', DEFAULT_UIC],
    queryFn: () => api.getUnitRoster(DEFAULT_UIC),
  });

  // Generate slate mutation
  const generateMutation = useMutation({
    mutationFn: () => api.generateSlate(DEFAULT_UIC, true),
    onSuccess: (data) => {
      setSlateResult(data);
      setSelectedMatch(null);
      setSelectedBillet(null);
    },
  });

  // Commit slate mutation
  const commitMutation = useMutation({
    mutationFn: () => {
      if (!slateResult) throw new Error('No slate to commit');
      const assignments = slateResult.matches.map(m => ({
        soldier_edipi: m.soldier_edipi,
        billet_id: m.billet_id,
      }));
      return api.commitSlate(DEFAULT_UIC, assignments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit'] });
      queryClient.invalidateQueries({ queryKey: ['roster'] });
      setSlateResult(null);
    },
  });

  const unit = unitQuery.data;
  const billets = rosterQuery.data?.billets || [];
  const matches = slateResult?.matches || [];

  // Get match for a specific billet
  const getMatchForBillet = (billetId: string): MatchResult | undefined => {
    return matches.find((m) => m.billet_id === billetId);
  };

  // Stats
  const totalBillets = billets.length;
  const currentlyFilled = billets.filter(b => b.assigned_soldier_edipi).length;
  const newlyMatched = matches.length;
  const fillRate = totalBillets > 0 ? ((currentlyFilled + (slateResult ? newlyMatched : 0)) / totalBillets) * 100 : 0;

  // Group billets by MOS
  const groupedBillets = billets.reduce((acc, billet) => {
    const key = billet.required_mos;
    if (!acc[key]) acc[key] = [];
    acc[key].push(billet);
    return acc;
  }, {} as Record<string, Billet[]>);

  const handleBilletSelect = (billet: Billet) => {
    setSelectedBillet(billet);
    const match = getMatchForBillet(billet.id);
    setSelectedMatch(match || null);
  };

  if (unitQuery.isLoading || rosterQuery.isLoading) {
    return <LoadingSpinner message="Loading unit data..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700/50 sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  Slate Generator
                </h1>
                <p className="text-xs text-slate-500">
                  {unit?.unit_name || 'Loading...'} &bull; {DEFAULT_UIC}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-mono font-bold text-slate-200">{currentlyFilled}/{totalBillets}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Filled</p>
                </div>
                <div className="text-center">
                  <p className={cn(
                    'font-mono font-bold',
                    fillRate >= 90 ? 'text-emerald-400' : fillRate >= 70 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {fillRate.toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">Fill Rate</p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Actions */}
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="gap-2"
              >
                {generateMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                Generate Slate
              </Button>

              {slateResult && (
                <Button
                  onClick={() => commitMutation.mutate()}
                  disabled={commitMutation.isPending}
                  className="gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  {commitMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Commit Slate
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        {/* Error states */}
        {generateMutation.error && (
          <div className="mb-4">
            <ErrorDisplay message={(generateMutation.error as Error).message} />
          </div>
        )}

        {/* Slate Result Banner */}
        {slateResult && (
          <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Check className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="font-medium text-slate-200">Slate Generated Successfully</p>
                    <p className="text-sm text-slate-500">
                      {matches.length} positions matched &bull; {slateResult.unslotted_soldiers.length} soldiers unassigned &bull; {slateResult.unfilled_billets.length} billets unfilled
                    </p>
                  </div>
                </div>
                {matches.some(m => m.flags.length > 0) && (
                  <Badge variant="amber" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {matches.filter(m => m.flags.length > 0).length} with warnings
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {commitMutation.isSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400 text-sm">
            Slate committed successfully. Assignments saved.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Billet Grid grouped by MOS */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(groupedBillets).map(([mosType, mosBillets]) => {
              const filledCount = mosBillets.filter(b =>
                getMatchForBillet(b.id) || b.assigned_soldier_edipi
              ).length;

              return (
                <Card key={mosType}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      MOS {mosType} Positions
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {filledCount}/{mosBillets.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {mosBillets.map((billet) => (
                        <BilletCard
                          key={billet.id}
                          billet={billet}
                          match={getMatchForBillet(billet.id)}
                          isSelected={selectedBillet?.id === billet.id}
                          onSelect={() => handleBilletSelect(billet)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {billets.length === 0 && (
              <Card className="py-12">
                <div className="text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No billets found for this unit</p>
                  <p className="text-xs mt-1">Select a subordinate unit with billets</p>
                </div>
              </Card>
            )}
          </div>

          {/* Right: Details Panel */}
          <div className="space-y-6">
            {/* Match Details */}
            {selectedMatch ? (
              <MatchScoreCard
                match={selectedMatch}
                billet={selectedBillet || undefined}
              />
            ) : selectedBillet ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Position Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Position</p>
                    <p className="text-sm font-medium text-slate-200">{selectedBillet.position_title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Requirements</p>
                    <p className="text-sm font-mono text-slate-300">{selectedBillet.required_rank} / {selectedBillet.required_mos}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Mission Criticality</p>
                    <p className={cn('text-sm font-mono font-bold', {
                      'text-red-400': selectedBillet.mission_criticality >= 8,
                      'text-amber-400': selectedBillet.mission_criticality >= 5,
                      'text-slate-300': selectedBillet.mission_criticality < 5,
                    })}>
                      {selectedBillet.mission_criticality}/10
                    </p>
                  </div>
                  {selectedBillet.critical_ksbs && selectedBillet.critical_ksbs.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-2">Required KSBs</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedBillet.critical_ksbs.map((ksb) => (
                          <Badge key={ksb} variant="blue" className="text-[10px]">{ksb}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <Badge variant={selectedBillet.assigned_soldier_edipi ? 'green' : 'red'}>
                      {selectedBillet.assigned_soldier_edipi ? 'Assigned' : 'Vacant'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm text-slate-500">Select a position to view details</p>
                  <p className="text-xs text-slate-600 mt-1">or click "Generate Slate" to auto-fill</p>
                </CardContent>
              </Card>
            )}

            {/* Unslotted Soldiers */}
            {slateResult && slateResult.unslotted_soldiers.length > 0 && (
              <Card>
                <CardHeader
                  className="py-3 cursor-pointer"
                  onClick={() => setShowUnslotted(!showUnslotted)}
                >
                  <CardTitle className="text-xs flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Unassigned Soldiers
                      <Badge variant="default">{slateResult.unslotted_soldiers.length}</Badge>
                    </span>
                    {showUnslotted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </CardHeader>
                {showUnslotted && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-slate-500 mb-3">
                      Drag soldiers to empty positions to manually assign
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {slateResult.unslotted_soldiers.map((edipi) => (
                        <div
                          key={edipi}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('soldier-edipi', edipi);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="text-xs font-mono text-slate-400 py-1.5 px-3 rounded bg-slate-800/50 cursor-grab active:cursor-grabbing hover:bg-slate-800"
                        >
                          {edipi}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Unfilled Billets */}
            {slateResult && slateResult.unfilled_billets.length > 0 && (
              <Card className="border-amber-500/20">
                <CardHeader className="py-3">
                  <CardTitle className="text-xs flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    Unfilled Billets ({slateResult.unfilled_billets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1 max-h-48 overflow-y-auto">
                  {slateResult.unfilled_billets.map((bid) => (
                    <div key={bid} className="text-xs font-mono text-amber-400 py-1 px-2 rounded bg-amber-500/10">
                      {bid.substring(0, 8)}...
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
