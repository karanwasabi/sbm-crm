import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { cn } from '@/lib/cn';
import type { GeoItem } from '@/types/crm';

type DonutChartProps = {
  items: GeoItem[];
  totalLabel?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
};

export function DonutChart({
  items,
  totalLabel = '12.4k',
  title = 'Geography',
  subtitle = 'Lead distribution',
  className,
  compact = false,
}: DonutChartProps) {
  if (items.length === 0) {
    return (
      <Card className={cn('h-full', className)}>
        <SectionHead title={title} subtitle={subtitle} className={compact ? 'mb-2.5' : undefined} />
        <p className="text-sm text-slate-500">No location data on leads yet.</p>
      </Card>
    );
  }

  const size = compact ? 96 : 140;
  const R = compact ? 36 : 56;
  const C = size / 2;
  const innerR = compact ? 22 : 32;

  let cum = 0;

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
    <Card className={cn('h-full', className)}>
      <SectionHead title={title} subtitle={subtitle} className={compact ? 'mb-2.5' : undefined} />
      <div
        className={cn(compact ? 'flex flex-col items-center gap-3' : 'grid grid-cols-[140px_1fr] items-center gap-4.5')}
      >
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
          {segments.map((seg, i) => (
            <path key={i} d={seg.d} fill={seg.color} />
          ))}
          <circle cx={C} cy={C} r={innerR} fill="#fff" />
          <text
            x={C}
            y={C - (compact ? 1 : 2)}
            textAnchor="middle"
            fontSize={compact ? '14' : '18'}
            fontWeight="800"
            fill="#1E293B"
          >
            {totalLabel}
          </text>
          <text
            x={C}
            y={C + (compact ? 10 : 12)}
            textAnchor="middle"
            fontSize={compact ? '7' : '8'}
            fontWeight="700"
            letterSpacing="0.16em"
            fill="#64748B"
          >
            LEADS
          </text>
        </svg>
        <div className={cn('flex flex-col gap-2', compact && 'w-full')}>
          {items.map((item) => (
            <div key={item.city} className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: item.color }} />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-semibold text-slate-700',
                  compact ? 'text-[11px]' : 'text-[12.5px]'
                )}
                title={item.city}
              >
                {item.city}
              </span>
              <span
                className={cn(
                  'shrink-0 font-bold text-slate-800 tabular-nums',
                  compact ? 'text-[11px]' : 'text-[12.5px]'
                )}
              >
                {Math.round(item.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
