'use client';

import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  RENEW_ANY_CATEGORY_DESCRIPTION,
  RENEW_CATEGORY_DESCRIPTIONS,
  RENEW_CATEGORY_LABELS,
  RENEW_PAYABLE_CATEGORIES,
  renewalCategoriesFilterLabel,
} from '@/lib/automation-types';
import { cn } from '@/lib/cn';

type RenewalCategoryMultiSelectProps = {
  selected: string[];
  onChange: (categories: string[]) => void;
  disabled?: boolean;
  variant?: 'popover' | 'inline';
  className?: string;
};

export function RenewalCategoryMultiSelect({
  selected,
  onChange,
  disabled = false,
  variant = 'popover',
  className,
}: RenewalCategoryMultiSelectProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const [open, setOpen] = useState(false);

  const toggle = (slug: string, checked: boolean) => {
    if (disabled) return;
    if (checked) {
      if (selectedSet.has(slug)) return;
      onChange([...selected, slug]);
      return;
    }
    onChange(selected.filter((item) => item !== slug));
  };

  const optionList = (
    <div className="flex flex-col gap-2">
      {RENEW_PAYABLE_CATEGORIES.map((slug) => (
        <Checkbox
          key={slug}
          checked={selectedSet.has(slug)}
          disabled={disabled}
          onChange={(checked) => toggle(slug, checked)}
          label={
            <span className="flex flex-col gap-0.5">
              <span>{RENEW_CATEGORY_LABELS[slug]}</span>
              {variant === 'inline' ? (
                <span className="text-[11px] font-medium text-slate-500">{RENEW_CATEGORY_DESCRIPTIONS[slug]}</span>
              ) : null}
            </span>
          }
        />
      ))}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <p className="text-xs text-slate-500">
          Select one or more — workflow runs when the payment matches any selected category. Leave all unchecked for{' '}
          {RENEW_ANY_CATEGORY_DESCRIPTION.toLowerCase()}.
        </p>
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-canvas-cool p-3">
          {optionList}
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(filterPopoverTriggerClass, 'min-w-[220px] justify-between gap-2', className)}
      >
        <span className="truncate">{renewalCategoriesFilterLabel(selected)}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3" sideOffset={8}>
        <p className="mb-2 text-xs text-slate-500">
          Runs when payment category matches any selected. None selected = any category.
        </p>
        <div className="max-h-64 space-y-2 overflow-y-auto">{optionList}</div>
      </PopoverContent>
    </Popover>
  );
}
