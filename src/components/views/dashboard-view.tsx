import { Database, RefreshCw, Sparkles, Trophy, UserPlus } from 'lucide-react';
import { BarChart } from '@/components/crm/charts/bar-chart';
import { DonutChart } from '@/components/crm/charts/donut-chart';
import { FunnelChart } from '@/components/crm/charts/funnel-chart';
import { KpiStrip, type KpiStripItem } from '@/components/crm/kpi-strip';
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

  const kpiItems: KpiStripItem[] = [
    {
      label: 'New leads (7d)',
      value: formatLeadCount(kpis.newLeads7d),
      sub: `${formatLeadCount(kpis.totalLeads)} total in CRM`,
      trend: formatPeriodTrend(kpis.newLeads7d, kpis.newLeadsPrev7d),
      accent: '#5C65CF',
      icon: KPI_ICONS[0],
      spark: analytics.newLeadsSparkline,
    },
    {
      label: 'Inquiry → Paid',
      value: formatConversionRate(kpis.conversionRate),
      sub: 'Registered and beyond',
      accent: '#10B981',
      icon: KPI_ICONS[1],
    },
    {
      label: 'Active members',
      value: formatLeadCount(kpis.activeMembers),
      sub: `Across ${kpis.activeCohorts} cohort${kpis.activeCohorts === 1 ? '' : 's'}`,
      accent: LIFECYCLE_STAGES.completed.color,
      icon: KPI_ICONS[2],
    },
    {
      label: 'Revenue (₹L)',
      value: formatLakhsFromPaise(kpis.revenueMtdPaise),
      sub: 'This month · MTD',
      trend: formatPeriodTrend(kpis.revenueMtdPaise, kpis.revenuePrevMtdPaise),
      accent: '#FFB703',
      icon: KPI_ICONS[3],
    },
    {
      label: 'Renewals at risk',
      value: formatLeadCount(kpis.renewalsAtRisk),
      sub: 'Cancelling or payment issues',
      accent: '#F43F5E',
      icon: KPI_ICONS[4],
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

      <KpiStrip items={kpiItems} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <FunnelChart steps={buildFunnelSteps(analytics)} title="Lifecycle funnel" subtitle="All contacts by stage" />
        <DonutChart
          items={buildGeoItems(analytics)}
          totalLabel={geoTotalLabel(analytics)}
          title="Geography"
          subtitle="City, or country when city is unknown"
        />
      </div>

      <SourcePerformanceTable rows={sourcePerformance} />

      <BarChart data={revenueData} />
    </CrmPageLayout>
  );
}
