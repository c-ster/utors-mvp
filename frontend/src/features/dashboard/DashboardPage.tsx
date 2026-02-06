import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingSpinner, ErrorDisplay } from '@/components/ui/loading';
import { TopBanner } from './TopBanner';
import { HeatMap } from './HeatMap';
import { RiskFeed } from './RiskFeed';
import { Timeline } from './Timeline';

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
