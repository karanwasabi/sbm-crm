'use client';

import { useMemo, useState } from 'react';
import { Braces } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { EmailVariable } from '@/lib/email-template-types';

type EmailVariablesPickerProps = {
  variables: EmailVariable[];
  disabled?: boolean;
  onInsert: (token: string) => void;
};

export function EmailVariablesPicker({ variables, disabled, onInsert }: EmailVariablesPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return variables;
    return variables.filter(
      (variable) => variable.label.toLowerCase().includes(needle) || variable.token.toLowerCase().includes(needle)
    );
  }, [query, variables]);

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
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-brand/30 hover:text-brand disabled:opacity-50"
      >
        <Braces className="h-3.5 w-3.5" strokeWidth={2.25} />
        Insert variable
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2" sideOffset={8}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search variables…"
          className="mb-2 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-brand/40"
        />
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500">No matching variables.</p>
          ) : (
            filtered.map((variable) => (
              <button
                key={variable.token}
                type="button"
                title={variable.token}
                className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
                onPointerDown={(event) => {
                  // Keep canvas caret / RTE focus while inserting.
                  event.preventDefault();
                  event.stopPropagation();
                  onInsert(variable.token);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <span className="text-sm font-medium text-slate-800">{variable.label}</span>
                <span className="font-mono text-[11px] text-slate-400">{variable.token}</span>
              </button>
            ))
          )}
        </div>
        <p className="mt-2 border-t border-slate-100 px-1 pt-2 text-[11px] text-slate-400">
          Tip: click into the text first, then insert at the caret.
        </p>
      </PopoverContent>
    </Popover>
  );
}
