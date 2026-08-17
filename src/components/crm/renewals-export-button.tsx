'use client';

import { Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { LeadExportPreparingDialog } from '@/components/crm/lead-export-preparing-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { downloadRenewalsXlsx } from '@/lib/export-renewals-xlsx';
import { fetchAllFilteredRenewals } from '@/lib/fetch-renewals-client';
import { cn } from '@/lib/cn';
import type { RenewalFilters } from '@/lib/renewal-query';
import type { RenewalRow } from '@/types/crm';

type RenewalsExportButtonProps = {
  filters: RenewalFilters;
  pageItems: RenewalRow[];
  selectedIds: Set<string>;
  selectAllFiltered: boolean;
  selectedCount: number;
};

export function RenewalsExportButton({
  filters,
  pageItems,
  selectedIds,
  selectAllFiltered,
  selectedCount,
}: RenewalsExportButtonProps) {
  const { toast } = useToast();
  const [preparingOpen, setPreparingOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isDisabled = selectedCount === 0;

  const runExport = (rows: RenewalRow[]) => {
    if (rows.length === 0) {
      toast({
        message: 'No members available to export.',
        variant: 'error',
        durationMs: 5000,
      });
      return;
    }

    void downloadRenewalsXlsx(rows)
      .then(() => {
        toast({
          message: `Exported ${rows.length} member${rows.length === 1 ? '' : 's'}.`,
          variant: 'success',
          durationMs: 5000,
        });
      })
      .catch(() => {
        toast({
          message: 'Could not generate the export file.',
          variant: 'error',
          durationMs: 5000,
        });
      });
  };

  const handleClick = () => {
    if (selectedCount === 0) {
      toast({
        message: 'Select at least one member to export.',
        variant: 'warning',
        durationMs: 5000,
      });
      return;
    }

    if (!selectAllFiltered) {
      runExport(pageItems.filter((row) => selectedIds.has(row.checkoutSessionId)));
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPreparingOpen(true);
    void fetchAllFilteredRenewals(filters, controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setPreparingOpen(false);
        runExport(rows);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPreparingOpen(false);
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        toast({
          message: 'Could not load members for export.',
          variant: 'error',
          durationMs: 5000,
        });
      });
  };

  const handleCancelPrepare = () => {
    abortRef.current?.abort();
    setPreparingOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="light"
        size="sm"
        leftIcon={<Download className="h-3.5 w-3.5" />}
        aria-disabled={isDisabled}
        className={cn(isDisabled && 'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none')}
        onClick={handleClick}
      >
        Export
      </Button>

      <LeadExportPreparingDialog open={preparingOpen} selectedCount={selectedCount} onCancel={handleCancelPrepare} />
    </>
  );
}
