import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { RevenueWeek } from '@/types/crm';

type BarChartProps = {
  data: RevenueWeek[];
  title?: string;
  subtitle?: string;
};

export function BarChart({ data, title = 'Revenue vs ad spend (₹L)', subtitle = 'Weekly · ROI 3.8×' }: BarChartProps) {
  const W = 460;
  const H = 200;
  const P = 26;
  const maxV = 16;

  return (
    <Card>
      <SectionHead
        title={title}
        subtitle={subtitle}
        right={
          <div className="flex gap-3.5 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
              Revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-motivation" />
              Ad spend
            </span>
          </div>
        }
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <line
            key={i}
            x1={P}
            x2={W - 8}
            y1={H - P - f * (H - P * 2)}
            y2={H - P - f * (H - P * 2)}
            stroke="#F1F5F9"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
        {data.map((d, i) => {
          const x = P + (i * (W - P - 12)) / (data.length - 1);
          const barW = 18;
          const yR = H - P - (d.revenue / maxV) * (H - P * 2);
          const yS = H - P - (d.spend / maxV) * (H - P * 2);
          return (
            <g key={d.week}>
              <rect x={x - barW - 2} y={yR} width={barW} height={H - P - yR} rx={5} fill="#5C65CF" />
              <rect x={x + 2} y={yS} width={barW} height={H - P - yS} rx={5} fill="#FFB703" />
              <text x={x} y={H - 6} fontSize="9" fontWeight="600" fill="#64748B" textAnchor="middle">
                {d.week}
              </text>
            </g>
          );
        })}
        {[0, 4, 8, 12, 16].map((v, i) => (
          <text
            key={i}
            x={P - 4}
            y={H - P - (v / maxV) * (H - P * 2) + 3}
            fontSize="9"
            fontWeight="600"
            fill="#90A1B9"
            textAnchor="end"
          >
            {v}
          </text>
        ))}
      </svg>
    </Card>
  );
}
