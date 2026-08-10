'use client';

import { PerformanceWindowSelector } from '@/components/crm/performance-window-selector';
import { useCrmDashboardFilter } from '@/components/layout/crm/crm-dashboard-filter-context';
import { DASHBOARD_CONTEXT_BAR_SURFACE_CLASS } from '@/lib/surface-gradients';
import { cn } from '@/lib/cn';

export function CrmDashboardContextBar() {
  const { registration } = useCrmDashboardFilter();

  if (!registration) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative z-30 shrink-0',
        DASHBOARD_CONTEXT_BAR_SURFACE_CLASS,
        registration.pending && 'ring-1 ring-white/10 ring-inset'
      )}
    >
      <div className="flex items-center gap-3 px-6 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <span className="shrink-0 text-[10px] font-semibold tracking-[0.14em] text-white/50 uppercase">Timeline</span>
          <div className="hidden h-3.5 w-px shrink-0 bg-white/15 sm:block" aria-hidden />
          <div className="min-w-0 scrollbar-none overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <PerformanceWindowSelector
              selected={registration.selected}
              pending={registration.pending}
              tone="dark"
              variant="segmented"
              onChange={registration.onChange}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pl-1">
          <div className="h-3.5 w-px shrink-0 bg-white/15" aria-hidden />
          <p
            className="flex max-w-[min(52vw,32rem)] items-center justify-end gap-1.5 truncate text-[11px] font-semibold whitespace-nowrap"
            title={registration.periodSubtitle}
          >
            <span className="text-white/65">{registration.periodLabel}</span>
            {registration.periodDates ? (
              <>
                <span className="text-white/35">·</span>
                <span className="text-white/90">{registration.periodDates}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
