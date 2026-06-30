'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { LeadExportPreparingDialog } from '@/components/crm/lead-export-preparing-dialog';
import { useLeadDatabaseSelection } from '@/components/crm/lead-database-selection-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { downloadLeadsCsv } from '@/lib/export-leads-csv';
import type { Lead } from '@/types/crm';
import { cn } from '@/lib/cn';

export function LeadDatabaseExportButton() {
  const { selectedCount, getExportLeads, needsPrefetchForExport, waitForPrefetch, cancelPendingExport } =
    useLeadDatabaseSelection();
  const { toast } = useToast();
  const [preparingOpen, setPreparingOpen] = useState(false);
  const isDisabled = selectedCount === 0;

  const runExport = (leads: Lead[]) => {
    if (leads.length === 0) {
      toast({
        message: 'No leads available to export.',
        variant: 'error',
        durationMs: 5000,
      });
      return;
    }

    downloadLeadsCsv(leads);
    window.setTimeout(() => {
      toast({
        message: `Exported ${leads.length} lead${leads.length === 1 ? '' : 's'}.`,
        variant: 'success',
        durationMs: 5000,
      });
    }, 0);
  };

  const handleClick = () => {
    if (selectedCount === 0) {
      toast({
        message: 'Select at least one lead to export.',
        variant: 'warning',
        durationMs: 5000,
      });
      return;
    }

    if (!needsPrefetchForExport()) {
      runExport(getExportLeads());
      return;
    }

    setPreparingOpen(true);
    void waitForPrefetch().then((leads) => {
      setPreparingOpen(false);
      if (!leads) {
        return;
      }
      runExport(leads);
    });
  };

  const handleCancelPrepare = () => {
    cancelPendingExport();
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
