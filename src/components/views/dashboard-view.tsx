import { Database, RefreshCw, Sparkles, Trophy, UserPlus } from 'lucide-react';
import { BarChart } from '@/components/crm/charts/bar-chart';
import { CommsHealth } from '@/components/crm/charts/comms-health';
import { DonutChart } from '@/components/crm/charts/donut-chart';
import { FunnelChart } from '@/components/crm/charts/funnel-chart';
import { KpiCard } from '@/components/crm/kpi-card';
import { SourcePerformanceTable } from '@/components/crm/source-performance-table';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import {
  MOCK_COMMS_HEALTH,
  MOCK_FUNNEL,
  MOCK_GEO,
  MOCK_KPIS,
  MOCK_REVENUE,
  MOCK_SOURCE_ROWS,
} from '@/lib/mock/dashboard';

const KPI_ICONS = [UserPlus, Trophy, Database, Sparkles, RefreshCw];

export function DashboardView() {
  return (
    <CrmPageLayout className="gap-4.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        {MOCK_KPIS.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            trend={kpi.trend}
            accent={kpi.accent}
            icon={KPI_ICONS[i]}
            spark={kpi.spark}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <FunnelChart steps={MOCK_FUNNEL} />
        <CommsHealth items={MOCK_COMMS_HEALTH} />
      </div>

      <SourcePerformanceTable rows={MOCK_SOURCE_ROWS} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <BarChart data={MOCK_REVENUE} />
        <DonutChart items={MOCK_GEO} />
      </div>
    </CrmPageLayout>
  );
}
