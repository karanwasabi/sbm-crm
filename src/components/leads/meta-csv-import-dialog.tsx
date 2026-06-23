'use client';

import { useRef, useState, useTransition } from 'react';
import { importMetaLeadsCSVAction } from '@/app/(crm)/leads/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';

type MetaCsvImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

export function MetaCsvImportDialog({ open, onClose, onImported }: MetaCsvImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return null;
  }

  const handleImport = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('Choose a CSV file exported from Meta Leads Center.');
      return;
    }

    setError(null);
    setSummary(null);
    startTransition(async () => {
      try {
        const result = await importMetaLeadsCSVAction(file);
        const parts = [`${result.created} created`];
        if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
        if (result.duplicate > 0) parts.push(`${result.duplicate} duplicates`);
        setSummary(parts.join(' · '));
        if (result.errors.length > 0) {
          setError(result.errors.slice(0, 3).join(' '));
        }
        if (result.created > 0) {
          onImported();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <Card className="w-full max-w-md">
        <SectionHead title="Import Meta leads" subtitle="Upload a CSV from Meta Leads Center or Instant Forms" />
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="mt-3 w-full text-sm" />
        {error ? <p className="mt-3 text-sm font-medium text-danger-press">{error}</p> : null}
        {summary ? <p className="mt-3 text-sm font-medium text-slate-700">{summary}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Close
          </Button>
          <Button variant="primary" onClick={handleImport} loading={pending} loadingLabel="Importing…">
            Import
          </Button>
        </div>
      </Card>
    </div>
  );
}
