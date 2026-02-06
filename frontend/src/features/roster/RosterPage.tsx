import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { LinearGauge } from '@/components/ui/gauge';
import { LoadingSpinner, ErrorDisplay } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import {
  Users, Search, Shield, Star, AlertTriangle, Eye,
  ChevronDown, ChevronUp, Award, Globe, Briefcase,
} from 'lucide-react';
import type { Billet, Soldier } from '@/types';

function SoldierDetailPanel({ edipi }: { edipi: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['soldier', edipi],
    queryFn: () => api.getSoldier(edipi),
  });

  if (isLoading) return <LoadingSpinner message="Loading profile..." />;
  if (!data) return null;

  return (
    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500">EDIPI:</span>
          <span className="ml-2 font-mono text-slate-300">{data.edipi}</span>
        </div>
        <div>
          <span className="text-slate-500">MOS:</span>
          <span className="ml-2 font-mono text-slate-300">{data.mos}</span>
        </div>
        <div>
          <span className="text-slate-500">Clearance:</span>
          <span className="ml-2 text-slate-300">{data.security_clearance}</span>
        </div>
        <div>
          <span className="text-slate-500">ETS:</span>
          <span className="ml-2 font-mono text-slate-300">{data.ets_date || 'N/A'}</span>
        </div>
      </div>

      {/* KSBs */}
      {data.ksbs && data.ksbs.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <Award className="w-3 h-3" /> KSBs
          </div>
          <div className="flex flex-wrap gap-1">
            {data.ksbs.map((ksb) => (
              <Badge key={ksb} variant="blue">{ksb}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <Globe className="w-3 h-3" /> Languages
          </div>
          <div className="flex flex-wrap gap-1">
            {data.languages.map((lang) => (
              <Badge key={lang} variant="outline">{lang}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Talents */}
      {data.civilian_certifications && data.civilian_certifications.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mb-1">
            <Star className="w-3 h-3" /> Hidden Talents
          </div>
          <div className="flex flex-wrap gap-1">
            {data.civilian_certifications.map((cert) => (
              <Badge key={cert} variant="green">{cert}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      {data.intake_completed && (
        <div className="text-xs space-y-1">
          {data.desired_role && (
            <div><span className="text-slate-500">Desired Role:</span> <span className="text-slate-300">{data.desired_role}</span></div>
          )}
          {data.family_considerations && data.family_considerations !== 'None' && (
            <div><span className="text-slate-500">Family:</span> <span className="text-amber-400">{data.family_considerations}</span></div>
          )}
          {data.career_preferences && (
            <div><span className="text-slate-500">Career:</span> <span className="text-slate-300">{data.career_preferences}</span></div>
          )}
        </div>
      )}

      {data.has_local_override && (
        <Badge variant="amber">Data Drift - Local Override</Badge>
      )}
    </div>
  );
}

export function RosterPage({ uic }: { uic: string }) {
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: roster, isLoading, error } = useQuery({
    queryKey: ['roster', uic],
    queryFn: () => api.getUnitRoster(uic),
  });

  const { data: gaps } = useQuery({
    queryKey: ['gaps', uic],
    queryFn: () => api.getUnitGaps(uic),
  });

  if (isLoading) return <LoadingSpinner message="Loading roster..." />;
  if (error) return <ErrorDisplay message={(error as Error).message} />;
  if (!roster) return null;

  const filteredBillets = roster.billets.filter(b => {
    const matchesSearch = search === '' ||
      b.position_title.toLowerCase().includes(search.toLowerCase()) ||
      b.assigned_soldier_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.required_mos.toLowerCase().includes(search.toLowerCase()) ||
      b.position_id.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'filled' && b.assigned_soldier_edipi) ||
      (filterStatus === 'empty' && !b.assigned_soldier_edipi) ||
      (filterStatus === 'key' && b.is_key_billet);

    return matchesSearch && matchesFilter;
  });

  const fillPct = (roster.assigned_strength / roster.authorized_strength) * 100;
  const fillStatus = fillPct >= 91 ? 'Green' : fillPct >= 71 ? 'Amber' : 'Red';

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Unit Roster &mdash; {roster.unit_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinearGauge value={fillPct} label={`${roster.assigned_strength} / ${roster.authorized_strength} Assigned`} status={fillStatus} />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>KSB Gaps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {gaps?.gaps.slice(0, 5).map((gap) => (
                <div key={gap.ksb} className="flex items-center justify-between text-xs">
                  <span className={cn('truncate', gap.risk_level === 'Red' ? 'text-red-400' : 'text-amber-400')}>
                    {gap.ksb}
                  </span>
                  <span className="font-mono text-slate-400">-{gap.deficit}</span>
                </div>
              )) || <p className="text-xs text-slate-500">No gaps identified</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, MOS, position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'filled', 'empty', 'key'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    filterStatus === f
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800 border border-transparent',
                  )}
                >
                  {f === 'all' ? 'All' : f === 'filled' ? 'Filled' : f === 'empty' ? 'Empty' : 'Key Billets'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 ml-auto">{filteredBillets.length} billets</span>
          </div>
        </CardContent>
      </Card>

      {/* Roster Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Para/Line</th>
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Position</th>
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Req</th>
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Assigned</th>
                <th className="text-left px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">KSBs</th>
                <th className="text-center px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">Crit</th>
                <th className="text-center px-4 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBillets.map((billet) => (
                <>
                  <tr
                    key={billet.id}
                    className={cn(
                      'border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer',
                      !billet.assigned_soldier_edipi && 'bg-red-500/5',
                    )}
                    onClick={() => setExpandedRow(expandedRow === billet.id ? null : billet.id)}
                  >
                    <td className="px-4 py-2 text-xs font-mono text-slate-400">{billet.position_id}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        {billet.is_key_billet && <Star className="w-3 h-3 text-amber-400" />}
                        <span className="text-sm text-slate-200">{billet.position_title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-slate-400">
                      {billet.required_rank}/{billet.required_mos}
                    </td>
                    <td className="px-4 py-2">
                      {billet.assigned_soldier_name ? (
                        <span className="text-sm text-slate-200">{billet.assigned_soldier_name}</span>
                      ) : (
                        <span className="text-sm text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> VACANT
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-0.5">
                        {billet.critical_ksbs?.slice(0, 3).map((ksb) => (
                          <Badge key={ksb} variant="blue" className="text-[9px]">{ksb}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={cn('text-xs font-mono font-bold', {
                        'text-red-400': billet.mission_criticality >= 8,
                        'text-amber-400': billet.mission_criticality >= 5,
                        'text-slate-400': billet.mission_criticality < 5,
                      })}>
                        {billet.mission_criticality}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {billet.assigned_soldier_edipi && (
                        <Eye className="w-3.5 h-3.5 text-slate-500 inline" />
                      )}
                    </td>
                  </tr>
                  {expandedRow === billet.id && billet.assigned_soldier_edipi && (
                    <tr key={`${billet.id}-detail`}>
                      <td colSpan={7} className="px-4 py-3">
                        <SoldierDetailPanel edipi={billet.assigned_soldier_edipi} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
