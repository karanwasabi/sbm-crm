import { cn } from '@/lib/cn';
import type { GeoItem } from '@/types/crm';
import {
  DashboardChartBody,
  DashboardChartCard,
  DashboardChartHeader,
} from '@/components/crm/charts/dashboard-chart-card';

type DonutChartProps = {
  items: GeoItem[];
  totalLabel?: string;
  title?: string;
  className?: string;
  maxLegendItems?: number;
};

function trimGeoLegend(items: GeoItem[], maxItems: number): GeoItem[] {
  if (items.length <= maxItems) {
    return items;
  }

  const visible = items.slice(0, maxItems - 1);
  const rest = items.slice(maxItems - 1);
  const othersPct = rest.reduce((sum, item) => sum + item.pct, 0);

  return [
    ...visible,
    {
      city: 'Others',
      pct: othersPct,
      color: '#94A3B8',
    },
  ];
}

export function DonutChart({
  items,
  totalLabel = '0',
  title = 'Geography',
  className,
  maxLegendItems = 5,
}: DonutChartProps) {
  if (items.length === 0) {
    return (
      <DashboardChartCard className={className}>
        <DashboardChartHeader title={title} metric="0" />
        <p className="text-sm text-slate-500">No location data on leads yet.</p>
      </DashboardChartCard>
    );
  }

  const legendItems = trimGeoLegend(items, maxLegendItems);
  const size = 120;
  const R = 46;
  const C = size / 2;
  const innerR = 30;

  let cum = 0;

  const segments = legendItems.map((item) => {
    const start = cum * Math.PI * 2 - Math.PI / 2;
    cum += item.pct;
    const end = cum * Math.PI * 2 - Math.PI / 2;
    const large = item.pct > 0.5 ? 1 : 0;
    const x1 = C + R * Math.cos(start);
    const y1 = C + R * Math.sin(start);
    const x2 = C + R * Math.cos(end);
    const y2 = C + R * Math.sin(end);
    return {
      ...item,
      d: `M ${C},${C} L ${x1},${y1} A ${R},${R} 0 ${large} 1 ${x2},${y2} Z`,
    };
  });

  return (
    <DashboardChartCard className={className}>
      <DashboardChartHeader title={title} metric={totalLabel} />
      <DashboardChartBody>
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 items-center justify-center">
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0" aria-hidden>
              {segments.map((seg, i) => (
                <path key={i} d={seg.d} fill={seg.color} />
              ))}
              <circle cx={C} cy={C} r={innerR} fill="#fff" />
            </svg>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            {legendItems.map((item) => (
              <div key={item.city} className="grid grid-cols-[0.5rem_1fr_2.25rem] items-center gap-x-2">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: item.color }} aria-hidden />
                <span className="min-w-0 truncate text-[11px] font-semibold text-slate-700" title={item.city}>
                  {item.city}
                </span>
                <span className="text-right text-[11px] font-extrabold text-slate-800 tabular-nums">
                  {Math.round(item.pct * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </DashboardChartBody>
    </DashboardChartCard>
  );
}
