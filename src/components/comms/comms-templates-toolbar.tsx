'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  buildCommsTemplatesHref,
  COMMS_TEMPLATE_SORT_OPTIONS,
  type CommsTemplateFilters,
  type CommsTemplateSortKey,
} from '@/lib/comms-templates-query';
import { cn } from '@/lib/cn';

type ChipOption = { value: string; label: string };

type CommsTemplatesToolbarProps = {
  filters: CommsTemplateFilters;
  statusOptions: ChipOption[];
  classificationOptions?: ChipOption[];
  categoryOptions?: ChipOption[];
  purposeOptions?: ChipOption[];
  total: number;
};

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] font-bold tracking-wide text-slate-400 uppercase">{label}</span>
      <button
        type="button"
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-semibold',
          value === '' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        )}
        onClick={() => onChange('')}
      >
        All
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
            value === option.value ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function CommsTemplatesToolbar({
  filters,
  statusOptions,
  classificationOptions,
  categoryOptions,
  purposeOptions,
  total,
}: CommsTemplatesToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draftQ, setDraftQ] = useState(filters.q);

  useEffect(() => {
    setDraftQ(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draftQ.trim();
      if (next === filters.q) return;
      startTransition(() => {
        router.push(buildCommsTemplatesHref(filters, { q: next }));
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [draftQ, filters, router]);

  const pushPatch = (patch: Partial<CommsTemplateFilters>) => {
    startTransition(() => {
      router.push(buildCommsTemplatesHref(filters, patch));
    });
  };

  return (
    <div className={cn('mb-4 space-y-3', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            type="search"
            value={draftQ}
            onChange={(event) => setDraftQ(event.target.value)}
            placeholder={filters.channel === 'email' ? 'Search name or subject…' : 'Search template name…'}
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          Sort
          <select
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none"
            value={filters.sort}
            onChange={(event) => pushPatch({ sort: event.target.value as CommsTemplateSortKey })}
          >
            {COMMS_TEMPLATE_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs font-medium text-slate-500">{total.toLocaleString('en-IN')} matching</p>
      </div>

      <div className="flex flex-col gap-2">
        <ChipRow
          label="Status"
          options={statusOptions}
          value={filters.status}
          onChange={(status) => pushPatch({ status })}
        />
        {filters.channel === 'email' && classificationOptions ? (
          <ChipRow
            label="Type"
            options={classificationOptions}
            value={filters.classification}
            onChange={(classification) => pushPatch({ classification })}
          />
        ) : null}
        {filters.channel === 'whatsapp' && categoryOptions ? (
          <ChipRow
            label="Category"
            options={categoryOptions}
            value={filters.category}
            onChange={(category) => pushPatch({ category })}
          />
        ) : null}
        {filters.channel === 'whatsapp' && purposeOptions ? (
          <ChipRow
            label="Purpose"
            options={purposeOptions}
            value={filters.purpose}
            onChange={(purpose) => pushPatch({ purpose })}
          />
        ) : null}
      </div>
    </div>
  );
}
