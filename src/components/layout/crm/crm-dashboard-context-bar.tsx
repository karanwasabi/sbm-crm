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
        registration.pending && 'ring-1 ring-white/15 ring-inset'
      )}
    >
      <div className="flex flex-col gap-3 px-6 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <span className="shrink-0 text-[11px] font-semibold tracking-wide text-white/60 uppercase">Period</span>
          <PerformanceWindowSelector
            selected={registration.selected}
            pending={registration.pending}
            tone="dark"
            onChange={registration.onChange}
          />
        </div>

        <p
          className="truncate text-xs font-semibold text-white/85 sm:max-w-[min(40vw,22rem)] sm:text-right"
          title={registration.periodSubtitle}
        >
          {registration.periodSubtitle}
        </p>
      </div>
    </div>
  );
}
