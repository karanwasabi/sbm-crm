'use client';

import { useMemo, useState } from 'react';
import { Braces } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { EmailVariable } from '@/lib/email-template-types';

type EmailVariablesPickerProps = {
  variables: EmailVariable[];
  disabled?: boolean;
  onInsert: (token: string) => void;
  /** Button label. Defaults to "Insert variable". */
  label?: string;
  /** Footer tip under the list. */
  tip?: string;
  /** Keep focus on a related input (e.g. subject) when picking a variable. */
  preserveFocus?: boolean;
};

export function EmailVariablesPicker({
  variables,
  disabled,
  onInsert,
  label = 'Insert variable',
  tip = 'Tip: click into the text first, then insert at the caret.',
  preserveFocus = true,
}: EmailVariablesPickerProps) {
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
        {label}
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
                  if (preserveFocus) {
                    // Keep caret / RTE focus while inserting.
                    event.preventDefault();
                    event.stopPropagation();
                  }
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
        {tip ? <p className="mt-2 border-t border-slate-100 px-1 pt-2 text-[11px] text-slate-400">{tip}</p> : null}
      </PopoverContent>
    </Popover>
  );
}

/** Insert `token` into a text input at the current selection (or append). */
export function insertTokenIntoInput(
  input: HTMLInputElement | HTMLTextAreaElement | null,
  token: string,
  onChange: (next: string) => void
) {
  if (!input) {
    onChange(token);
    return;
  }

  const value = input.value;
  const start = input.selectionStart ?? value.length;
  const end = input.selectionEnd ?? value.length;
  const next = `${value.slice(0, start)}${token}${value.slice(end)}`;
  onChange(next);

  const caret = start + token.length;
  // Restore focus + caret after React state update.
  window.requestAnimationFrame(() => {
    input.focus();
    input.setSelectionRange(caret, caret);
  });
}
