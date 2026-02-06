import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { LoadingSpinner, ErrorDisplay } from '@/components/ui/loading';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopBanner } from './TopBanner';
import { HeatMap } from './HeatMap';
import { RiskFeed } from './RiskFeed';
import { Timeline } from './Timeline';
import { Sparkles, ClipboardList, Users, Swords } from 'lucide-react';

export function DashboardPage({ uic }: { uic: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', uic],
    queryFn: () => api.getDashboardMetrics(uic),
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner message="Loading Commander's Dashboard..." />;
  if (error) return <ErrorDisplay message={(error as Error).message} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen">
      <TopBanner metrics={data} />

      {/* Quick Actions */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-xs">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-16 flex-col gap-1.5" asChild>
              <Link to="/slate">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider">Generate Slate</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1.5" asChild>
              <Link to="/roster">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] uppercase tracking-wider">View Roster</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1.5" asChild>
              <Link to="/wargame">
                <Swords className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] uppercase tracking-wider">Wargame</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1.5" asChild>
              <Link to="/intake">
                <ClipboardList className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] uppercase tracking-wider">Intake Form</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Left Pane: Critical Risk Feed */}
        <div className="col-span-3">
          <RiskFeed alerts={data.critical_alerts} />
        </div>

        {/* Main Pane: Organizational Heat Map */}
        <div className="col-span-6">
          <HeatMap subunits={data.subunit_risks} parentUic={uic} />
        </div>

        {/* Right Pane: Timeline */}
        <div className="col-span-3">
          <Timeline
            entries={data.personnel_timeline}
            incoming={data.total_incoming}
            outgoing={data.total_outgoing}
          />
        </div>
      </div>
    </div>
  );
}
