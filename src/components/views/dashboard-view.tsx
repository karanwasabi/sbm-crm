import { Database, RefreshCw, Sparkles, Trophy, UserPlus } from 'lucide-react';
import { BarChart } from '@/components/crm/charts/bar-chart';
import { DonutChart } from '@/components/crm/charts/donut-chart';
import { FunnelChart } from '@/components/crm/charts/funnel-chart';
import { KpiCard } from '@/components/crm/kpi-card';
import { SourcePerformanceTable } from '@/components/crm/source-performance-table';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import {
  formatConversionRate,
  formatLakhsFromPaise,
  formatLeadCount,
  formatPeriodTrend,
} from '@/lib/dashboard-display';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import type { DashboardAnalytics, FunnelStep, GeoItem, LifecycleStage, SourcePerformanceRow } from '@/types/crm';

const KPI_ICONS = [UserPlus, Trophy, Database, Sparkles, RefreshCw];

const GEO_COLORS = ['#5C65CF', '#8338EC', '#0EA5E9', '#10B981', '#FFB703', '#90A1B9'];

type DashboardViewProps = {
  analytics: DashboardAnalytics;
  sourcePerformance: SourcePerformanceRow[];
  analyticsError?: string | null;
};

function funnelColor(stage: string): string {
  if (stage in LIFECYCLE_STAGES) {
    return LIFECYCLE_STAGES[stage as LifecycleStage].color;
  }
  return '#64748B';
}

function buildFunnelSteps(analytics: DashboardAnalytics): FunnelStep[] {
  return analytics.funnel.map((step) => ({
    label: step.label,
    count: step.count,
    color: funnelColor(step.stage),
  }));
}

function buildGeoItems(analytics: DashboardAnalytics): GeoItem[] {
  return analytics.geo.map((item, index) => ({
    city: item.label,
    pct: item.pct,
    color: GEO_COLORS[index % GEO_COLORS.length],
  }));
}

function geoTotalLabel(analytics: DashboardAnalytics): string {
  const total = analytics.geo.reduce((sum, item) => sum + item.count, 0);
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1)}k`;
  }
  return String(total);
}

export function DashboardView({ analytics, sourcePerformance, analyticsError }: DashboardViewProps) {
  const { kpis } = analytics;

  const kpisToRender = [
    {
      label: 'New leads (7d)',
      value: formatLeadCount(kpis.newLeads7d),
      sub: `${formatLeadCount(kpis.totalLeads)} total in CRM`,
      trend: formatPeriodTrend(kpis.newLeads7d, kpis.newLeadsPrev7d),
      accent: '#5C65CF',
      spark: analytics.newLeadsSparkline,
    },
    {
      label: 'Inquiry → Paid',
      value: formatConversionRate(kpis.conversionRate),
      sub: 'registered and beyond · excl. lost',
      trend: undefined,
      accent: '#10B981',
      spark: undefined,
    },
    {
      label: 'Active members',
      value: formatLeadCount(kpis.activeMembers),
      sub: `across ${kpis.activeCohorts} cohort${kpis.activeCohorts === 1 ? '' : 's'}`,
      trend: undefined,
      accent: LIFECYCLE_STAGES.completed.color,
      spark: undefined,
    },
    {
      label: 'Revenue (₹L)',
      value: formatLakhsFromPaise(kpis.revenueMtdPaise),
      sub: 'this month · MTD',
      trend: formatPeriodTrend(kpis.revenueMtdPaise, kpis.revenuePrevMtdPaise),
      accent: '#FFB703',
      spark: undefined,
    },
    {
      label: 'Renewals at risk',
      value: formatLeadCount(kpis.renewalsAtRisk),
      sub: 'cancelling or payment issues',
      trend: undefined,
      accent: '#F43F5E',
      spark: undefined,
    },
  ];

  const revenueData = analytics.revenueWeekly.map((week) => ({
    week: week.weekLabel,
    revenue: week.revenueLakhs,
  }));

  return (
    <CrmPageLayout className="gap-4.5">
      {analyticsError ? (
        <p className="rounded-2xl border border-danger-press/20 bg-danger-press/5 px-4 py-3 text-sm font-medium text-danger-press">
          {analyticsError}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        {kpisToRender.map((kpi, i) => (
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
        <FunnelChart steps={buildFunnelSteps(analytics)} title="Lifecycle funnel" subtitle="All contacts by stage" />
        <DonutChart
          items={buildGeoItems(analytics)}
          totalLabel={geoTotalLabel(analytics)}
          title="Geography"
          subtitle="Lead distribution by city"
        />
      </div>

      <SourcePerformanceTable rows={sourcePerformance} />

      <BarChart data={revenueData} />
    </CrmPageLayout>
  );
}
