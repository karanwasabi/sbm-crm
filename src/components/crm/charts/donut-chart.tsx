import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { GeoItem } from '@/types/crm';

type DonutChartProps = {
  items: GeoItem[];
  totalLabel?: string;
  title?: string;
  subtitle?: string;
};

export function DonutChart({
  items,
  totalLabel = '12.4k',
  title = 'Geography',
  subtitle = 'Lead distribution',
}: DonutChartProps) {
  if (items.length === 0) {
    return (
      <Card>
        <SectionHead title={title} subtitle={subtitle} />
        <p className="px-5 pb-5 text-sm text-slate-500">No location data on leads yet.</p>
      </Card>
    );
  }

  let cum = 0;
  const R = 56;
  const C = 70;

  const segments = items.map((item) => {
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
    <Card>
      <SectionHead title={title} subtitle={subtitle} />
      <div className="grid grid-cols-[140px_1fr] items-center gap-4.5">
        <svg viewBox="0 0 140 140" width={140} height={140}>
          {segments.map((seg, i) => (
            <path key={i} d={seg.d} fill={seg.color} />
          ))}
          <circle cx={C} cy={C} r={32} fill="#fff" />
          <text x={C} y={C - 2} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1E293B">
            {totalLabel}
          </text>
          <text
            x={C}
            y={C + 12}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            letterSpacing="0.16em"
            fill="#64748B"
          >
            LEADS
          </text>
        </svg>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.city} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
              <span className="flex-1 text-[12.5px] font-semibold text-slate-700">{item.city}</span>
              <span className="text-[12.5px] font-bold text-slate-800 tabular-nums">{Math.round(item.pct * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
