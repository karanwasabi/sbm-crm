'use client';

import { Loader2 } from 'lucide-react';
import { FilterChip } from '@/components/ui/filter-chip';
import { PERFORMANCE_WINDOW_OPTIONS, type PerformanceWindowPreset } from '@/lib/performance-display';
import { cn } from '@/lib/cn';

type PerformanceWindowSelectorProps = {
  selected: PerformanceWindowPreset;
  pending?: boolean;
  tone?: 'light' | 'dark';
  variant?: 'chips' | 'segmented';
  onChange: (days: PerformanceWindowPreset) => void;
};

export function PerformanceWindowSelector({
  selected,
  pending = false,
  tone = 'light',
  variant = 'chips',
  onChange,
}: PerformanceWindowSelectorProps) {
  const isDark = tone === 'dark';

  if (variant === 'segmented') {
    return (
      <div className="inline-flex min-w-0 items-center gap-1.5" role="group" aria-label="Timeline">
        <span className="flex size-3 shrink-0 items-center justify-center" aria-hidden>
          {pending ? (
            <Loader2 size={11} className={cn('animate-spin', isDark ? 'text-white/70' : 'text-brand')} />
          ) : null}
        </span>
        <div
          className={cn(
            'inline-flex max-w-full scrollbar-none overflow-x-auto rounded-lg p-0.5 ring-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
            isDark ? 'bg-black/15 ring-white/10' : 'bg-slate-100/90 ring-slate-200/60'
          )}
        >
          {PERFORMANCE_WINDOW_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={pending}
              title={option.label}
              onClick={() => onChange(option.days)}
              className={cn(
                'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-all disabled:cursor-wait disabled:opacity-70',
                option.days === selected
                  ? isDark
                    ? 'bg-white text-brand-deep shadow-sm'
                    : 'bg-white text-brand-deep shadow-sm ring-1 ring-slate-200/80'
                  : isDark
                    ? 'text-white/65 hover:text-white'
                    : 'text-slate-600 hover:text-slate-800'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PERFORMANCE_WINDOW_OPTIONS.map((option) => (
        <FilterChip
          key={option.label}
          active={option.days === selected}
          pending={pending && option.days === selected}
          tone={tone}
          onClick={() => onChange(option.days)}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );
}
