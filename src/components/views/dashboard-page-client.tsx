'use client';

import { Database, RefreshCw, Sparkles, Trophy, UserPlus } from 'lucide-react';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { fetchDashboardPageData, type DashboardPageData } from '@/app/(crm)/actions';
import { BarChart } from '@/components/crm/charts/bar-chart';
import { DonutChart } from '@/components/crm/charts/donut-chart';
import { FunnelChart } from '@/components/crm/charts/funnel-chart';
import { AdPerformanceTable } from '@/components/crm/ad-performance-table';
import { DashboardOverviewSection } from '@/components/crm/dashboard-overview-section';
import { KpiStrip, type KpiStripItem } from '@/components/crm/kpi-strip';
import { MetaCampaignPerformanceTable } from '@/components/crm/meta-campaign-performance-table';
import { SourcePerformanceSection } from '@/components/crm/source-performance-section';
import { useRegisterDashboardFilter } from '@/components/layout/crm/crm-dashboard-filter-context';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { DashboardFilteredContentSkeleton } from '@/components/loading/dashboard-page-skeleton';
import { normalizeDashboardFunnel } from '@/lib/dashboard-analytics';
import {
  formatConversionRate,
  formatLeadCount,
  formatPeriodTrend,
  formatThousandsFromPaise,
  normalizeRevenueWeeks,
} from '@/lib/dashboard-display';
import { LIFECYCLE_STAGES } from '@/lib/lifecycle-stages';
import {
  dashboardRevenueChartTitle,
  formatPerformanceDateRange,
  formatPerformanceWindowDates,
  performanceWindowLabel,
  resolvePerformanceWindow,
  type PerformanceWindowPreset,
} from '@/lib/performance-display';
import type { DashboardAnalytics, FunnelStep, GeoItem, LifecycleStage } from '@/types/crm';

const KPI_ICONS = [UserPlus, Trophy, Database, Sparkles, RefreshCw];
const GEO_COLORS = ['#5C65CF', '#8338EC', '#0EA5E9', '#10B981', '#FFB703', '#90A1B9'];
const DEFAULT_WINDOW: PerformanceWindowPreset = 90;

const KPI_ICONS_BY_INDEX = KPI_ICONS;

function funnelStageStyle(stage: string): { color: string; tint: string } {
  if (stage in LIFECYCLE_STAGES) {
    const config = LIFECYCLE_STAGES[stage as LifecycleStage];
    return { color: config.color, tint: config.tint };
  }
  return { color: '#64748B', tint: '#F1F5F9' };
}

function buildFunnelSteps(analytics: DashboardAnalytics): FunnelStep[] {
  return normalizeDashboardFunnel(analytics.funnel).map((step) => {
    const { color, tint } = funnelStageStyle(step.stage);
    return {
      stage: step.stage,
      label: step.label,
      count: step.count,
      color,
      tint,
    };
  });
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

function buildKpiItems(analytics: DashboardAnalytics): KpiStripItem[] {
  const { kpis } = analytics;

  return [
    {
      label: 'New leads (7d)',
      value: formatLeadCount(kpis.newLeads7d),
      sub: `${formatLeadCount(kpis.totalLeads)} total in CRM`,
      trend: formatPeriodTrend(kpis.newLeads7d, kpis.newLeadsPrev7d),
      accent: '#5C65CF',
      icon: KPI_ICONS_BY_INDEX[0],
    },
    {
      label: 'Inquiry → Paid',
      value: formatConversionRate(kpis.conversionRate),
      sub: 'Registered and beyond',
      accent: '#10B981',
      icon: KPI_ICONS_BY_INDEX[1],
    },
    {
      label: 'Active members',
      value: formatLeadCount(kpis.activeMembers),
      sub: `Across ${kpis.activeCohorts} cohort${kpis.activeCohorts === 1 ? '' : 's'}`,
      accent: LIFECYCLE_STAGES.member.color,
      icon: KPI_ICONS_BY_INDEX[2],
    },
    {
      label: 'Revenue MTD',
      value: formatThousandsFromPaise(kpis.revenueMtdPaise),
      sub: 'This month',
      trend: formatPeriodTrend(kpis.revenueMtdPaise, kpis.revenuePrevMtdPaise),
      accent: '#FFB703',
      icon: KPI_ICONS_BY_INDEX[3],
    },
    {
      label: 'Renewals at risk',
      value: formatLeadCount(kpis.renewalsAtRisk),
      sub: 'Cancelling or payment issues',
      accent: '#F43F5E',
      icon: KPI_ICONS_BY_INDEX[4],
    },
  ];
}

type DashboardPageClientProps = {
  initialData: DashboardPageData;
  initialError?: string | null;
};

export function DashboardPageClient({ initialData, initialError = null }: DashboardPageClientProps) {
  const [data, setData] = useState(initialData);
  const [selected, setSelected] = useState<PerformanceWindowPreset>(DEFAULT_WINDOW);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  const changeWindow = useCallback(
    (days: PerformanceWindowPreset) => {
      if (days === selected) return;
      setSelected(days);
      setError(null);
      startTransition(async () => {
        const result = await fetchDashboardPageData(days);
        if (result.ok) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      });
    },
    [selected]
  );

  const reportingWindow = useMemo(
    () =>
      resolvePerformanceWindow(
        selected,
        data.analytics.window,
        data.sourcePerformanceWindow,
        data.campaignPerformanceWindow,
        data.adPerformanceWindow
      ),
    [
      data.adPerformanceWindow,
      data.analytics.window,
      data.campaignPerformanceWindow,
      data.sourcePerformanceWindow,
      selected,
    ]
  );

  const periodLabel = useMemo(() => performanceWindowLabel(selected), [selected]);
  const periodDates = useMemo(
    () => formatPerformanceWindowDates(reportingWindow, selected),
    [reportingWindow, selected]
  );
  const periodSubtitle = useMemo(
    () => formatPerformanceDateRange(reportingWindow, selected),
    [reportingWindow, selected]
  );

  const dashboardFilter = useMemo(
    () => ({
      periodSubtitle,
      periodLabel,
      periodDates,
      selected,
      pending: isPending,
      onChange: changeWindow,
    }),
    [changeWindow, isPending, periodDates, periodLabel, periodSubtitle, selected]
  );

  useRegisterDashboardFilter(dashboardFilter);

  const revenueData = useMemo(
    () => normalizeRevenueWeeks(data.analytics.revenueWeekly),
    [data.analytics.revenueWeekly]
  );
  const revenueTitle = dashboardRevenueChartTitle(selected);

  return (
    <CrmPageLayout className="gap-4.5">
      {error ? (
        <p className="rounded-2xl border border-danger-press/20 bg-danger-press/5 px-4 py-3 text-sm font-medium text-danger-press">
          {error}
        </p>
      ) : null}

      <KpiStrip items={buildKpiItems(data.analytics)} />

      {isPending ? (
        <DashboardFilteredContentSkeleton />
      ) : (
        <>
          <DashboardOverviewSection>
            <FunnelChart className="min-w-0" steps={buildFunnelSteps(data.analytics)} title="Lifecycle funnel" />
            <BarChart className="min-w-0" data={revenueData} title={revenueTitle} />
            <DonutChart
              className="min-w-0"
              items={buildGeoItems(data.analytics)}
              totalLabel={geoTotalLabel(data.analytics)}
              title="Geography"
              maxLegendItems={5}
            />
          </DashboardOverviewSection>

          <SourcePerformanceSection
            rows={data.sourcePerformance}
            offlineMetaEnrollments={data.sourcePerformanceOfflineMeta}
            window={data.sourcePerformanceWindow}
            subtitle={periodSubtitle}
            hideWindowSelector
          />

          <MetaCampaignPerformanceTable
            days={selected}
            rows={data.campaignPerformance}
            window={data.campaignPerformanceWindow}
            hideWindowSelector
          />

          <AdPerformanceTable
            days={selected}
            rows={data.adPerformance}
            window={data.adPerformanceWindow}
            hideWindowSelector
          />
        </>
      )}
    </CrmPageLayout>
  );
}
