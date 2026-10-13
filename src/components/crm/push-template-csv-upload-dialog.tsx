'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PushCsvAddition, PushCsvDiff, PushCsvEdit, PushCsvParseError } from '@/lib/push-template-csv';
import { cn } from '@/lib/cn';

type PushTemplateCsvUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  diff: PushCsvDiff | null;
  parseErrors: PushCsvParseError[];
  pending?: boolean;
  onApply: (keepEditKeys: Set<string>) => void;
};

function slotLabel(week: number, day: number, slot: string) {
  return `W${week} D${day} · ${slot}`;
}

function CopyBlock({ title, body, tone }: { title: string; body: string; tone: 'current' | 'next' }) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2',
        tone === 'current' ? 'border-slate-200 bg-slate-50' : 'border-[#B8BEF5] bg-[#F7F8FF]'
      )}
    >
      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
        {tone === 'current' ? 'Current' : 'CSV'}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">
        {title || <span className="text-slate-400">(empty)</span>}
      </p>
      <p className="mt-0.5 text-xs leading-snug whitespace-pre-wrap text-slate-600">
        {body || <span className="text-slate-400">(empty)</span>}
      </p>
    </div>
  );
}

function EditRow({
  edit,
  checked,
  onChange,
}: {
  edit: PushCsvEdit;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <Checkbox
          checked={checked}
          onChange={onChange}
          label={
            <span className="font-semibold text-slate-800">{slotLabel(edit.weekIndex, edit.dayIndex, edit.slot)}</span>
          }
        />
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          {checked ? 'Overwrite' : 'Keep current'}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <CopyBlock title={edit.currentTitle} body={edit.currentBody} tone="current" />
        <CopyBlock title={edit.nextTitle} body={edit.nextBody} tone="next" />
      </div>
    </div>
  );
}

function AdditionPreview({ additions }: { additions: PushCsvAddition[] }) {
  if (additions.length === 0) return null;
  const preview = additions.slice(0, 8);
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
      <p className="text-sm font-semibold text-emerald-900">
        {additions.length} addition{additions.length === 1 ? '' : 's'} will be filled
      </p>
      <p className="mt-1 text-xs text-emerald-800/80">
        Empty slots (or new weeks) get CSV copy automatically. No keep/ignore choice for additions.
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {preview.map((a) => (
          <li
            key={a.key}
            className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-100"
          >
            {slotLabel(a.weekIndex, a.dayIndex, a.slot)}
          </li>
        ))}
        {additions.length > preview.length ? (
          <li className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-800/70 ring-1 ring-emerald-100">
            +{additions.length - preview.length} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function PushTemplateCsvUploadDialog({
  open,
  onOpenChange,
  fileName,
  diff,
  parseErrors,
  pending = false,
  onApply,
}: PushTemplateCsvUploadDialogProps) {
  const [keepKeys, setKeepKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !diff) return;
    setKeepKeys(new Set(diff.edits.map((e) => e.key)));
  }, [open, diff, fileName]);

  const keptCount = keepKeys.size;
  const ignoredCount = (diff?.edits.length ?? 0) - keptCount;
  const canApply =
    Boolean(diff) && parseErrors.length === 0 && ((diff?.edits.length ?? 0) > 0 || (diff?.additions.length ?? 0) > 0);

  const setAll = (value: boolean) => {
    if (!diff) return;
    setKeepKeys(value ? new Set(diff.edits.map((e) => e.key)) : new Set());
  };

  const toggle = (key: string, checked: boolean) => {
    setKeepKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4">
          <DialogTitle>Review CSV upload</DialogTitle>
          <DialogDescription>
            {fileName
              ? `Comparing ${fileName} to the current template. Uncheck an overwrite to keep the existing copy.`
              : 'Compare CSV rows to the current template.'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {parseErrors.length > 0 ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-semibold text-rose-900">
                {parseErrors.length} CSV error{parseErrors.length === 1 ? '' : 's'}
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-rose-800">
                {parseErrors.slice(0, 40).map((err, i) => (
                  <li key={`${err.line}-${i}`}>
                    Line {err.line}: {err.message}
                  </li>
                ))}
                {parseErrors.length > 40 ? <li>…and {parseErrors.length - 40} more</li> : null}
              </ul>
            </div>
          ) : null}

          {diff && parseErrors.length === 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
                  <p className="text-lg font-extrabold text-amber-950 tabular-nums">{diff.edits.length}</p>
                  <p className="text-[10px] font-bold tracking-wide text-amber-800/80 uppercase">Overwrites</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <p className="text-lg font-extrabold text-emerald-950 tabular-nums">{diff.additions.length}</p>
                  <p className="text-[10px] font-bold tracking-wide text-emerald-800/80 uppercase">Additions</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-lg font-extrabold text-slate-800 tabular-nums">{diff.unchanged}</p>
                  <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">Unchanged</p>
                </div>
              </div>

              <AdditionPreview additions={diff.additions} />

              {diff.edits.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      Overwrites · {keptCount} apply, {ignoredCount} keep current
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setAll(true)} disabled={pending}>
                        Keep all CSV
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setAll(false)} disabled={pending}>
                        Ignore all
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {diff.edits.map((edit) => (
                      <EditRow
                        key={edit.key}
                        edit={edit}
                        checked={keepKeys.has(edit.key)}
                        onChange={(checked) => toggle(edit.key, checked)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No overwrites — only empty slots / new weeks will change.</p>
              )}

              {!canApply ? (
                <p className="text-sm text-slate-600">Nothing to apply — CSV matches the current template.</p>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={pending}
            disabled={!canApply || pending}
            onClick={() => onApply(new Set(keepKeys))}
          >
            Apply selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
