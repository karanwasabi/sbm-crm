import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { CommsHealthItem } from '@/types/crm';

type CommsHealthProps = {
  items: CommsHealthItem[];
  title?: string;
  subtitle?: string;
};

function RateBar({ label, value, color, faded }: { label: string; value: number; color: string; faded?: boolean }) {
  return (
    <div className="grid grid-cols-[70px_1fr_50px] items-center gap-2">
      <span className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${value * 100}%`, background: color, opacity: faded ? 0.65 : 1 }}
        />
      </div>
      <span className="text-right text-xs font-bold text-slate-700 tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function CommsHealth({ items, title = 'Comms health', subtitle = 'Last 7 days' }: CommsHealthProps) {
  return (
    <Card>
      <SectionHead title={title} subtitle={subtitle} />
      <div className="flex flex-col gap-3.5">
        {items.map((item) => (
          <div key={item.channel}>
            <div className="mb-1.5 flex justify-between">
              <span className="text-[13px] font-bold text-slate-700">{item.channel}</span>
              <span className="text-[11px] font-medium text-slate-500">{item.sent.toLocaleString()} sent</span>
            </div>
            <div className="mb-1 flex flex-col gap-1">
              <RateBar label="Delivered" value={item.delivered} color={item.color} />
              <RateBar label="Open rate" value={item.openRate} color={item.color} faded />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
