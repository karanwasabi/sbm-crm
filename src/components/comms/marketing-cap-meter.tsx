import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { MarketingContactsSummary } from '@/utils/api';

type MarketingCapMeterProps = {
  summary: MarketingContactsSummary;
};

export function MarketingCapMeter({ summary }: MarketingCapMeterProps) {
  const pct = summary.limit > 0 ? Math.min(100, (summary.used / summary.limit) * 100) : 0;
  const tone = pct >= 95 ? 'danger' : pct >= 80 ? 'warn' : 'ok';

  return (
    <Card padding="sm" className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Marketing contacts</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800 tabular-nums">
            {summary.used.toLocaleString('en-IN')} / {summary.limit.toLocaleString('en-IN')}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Active marketing contacts synced from CRM sends</p>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full',
                tone === 'danger' && 'bg-danger-press',
                tone === 'warn' && 'bg-amber-500',
                tone === 'ok' && 'bg-brand'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] font-semibold text-slate-500 tabular-nums">
            {Math.round(pct)}% used
          </p>
        </div>
      </div>
    </Card>
  );
}
