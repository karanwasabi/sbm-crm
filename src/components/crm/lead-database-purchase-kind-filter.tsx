'use client';

import { ShoppingBag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { PURCHASE_KIND_FILTER_OPTIONS } from '@/lib/lead-sources';

type LeadDatabasePurchaseKindFilterProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabasePurchaseKindFilter({ filters }: LeadDatabasePurchaseKindFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = filters.purchaseKind === 'new' || filters.purchaseKind === 'renewal' ? filters.purchaseKind : '';
  const [draft, setDraft] = useState(current);
  const isFiltered = Boolean(current);

  const apply = () => {
    router.push(buildLeadDatabaseHref(filters, { purchaseKind: draft }));
    setOpen(false);
  };

  const clear = () => {
    setDraft('');
    router.push(buildLeadDatabaseHref(filters, { purchaseKind: '' }));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(current);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <ShoppingBag className="h-3.5 w-3.5" />
        Purchase{isFiltered ? ' (1)' : ''}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by purchase type</p>
        <p className="mt-1 text-[11px] text-slate-500">Uses paid checkout product (new vs renewal).</p>
        <div className="mt-3 space-y-1">
          {PURCHASE_KIND_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id || 'any'}
              type="button"
              className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
                draft === option.id ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setDraft(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {isFiltered || draft ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
