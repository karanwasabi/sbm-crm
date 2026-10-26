'use client';

import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';

type CohortConditionMultiSelectProps = {
  options: string[];
  selected: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
};

export function CohortConditionMultiSelect({
  options,
  selected,
  onChange,
  disabled = false,
}: CohortConditionMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedSet = useMemo(() => new Set(selected.map((name) => name.toLowerCase())), [selected]);

  const choices = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const name of [...selected, ...options]) {
      const trimmed = name.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed || seen.has(key)) continue;
      seen.add(key);
      names.push(trimmed);
    }
    const needle = query.trim().toLowerCase();
    if (!needle) return names;
    return names.filter((name) => name.toLowerCase().includes(needle));
  }, [options, query, selected]);

  const toggle = (name: string, checked: boolean) => {
    if (disabled) return;
    if (checked) {
      if (selectedSet.has(name.toLowerCase())) return;
      onChange([...selected, name]);
      return;
    }
    onChange(selected.filter((item) => item.toLowerCase() !== name.toLowerCase()));
  };

  const label =
    selected.length === 0 ? 'Select cohorts' : selected.length === 1 ? selected[0] : `${selected.length} cohorts`;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium',
          selected.length > 0 ? 'text-slate-800' : 'text-slate-400',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50'
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3" sideOffset={8}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search cohorts…"
          className="mb-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none"
        />
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {choices.length === 0 ? (
            <p className="px-1 py-2 text-xs text-slate-500">No cohorts found.</p>
          ) : (
            choices.map((name) => (
              <Checkbox
                key={name}
                checked={selectedSet.has(name.toLowerCase())}
                disabled={disabled}
                onChange={(checked) => toggle(name, checked)}
                label={<span className="text-xs">{name}</span>}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
