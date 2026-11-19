'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { downloadRevenueXlsx } from '@/lib/export-revenue-xlsx';
import { fetchRevenueAnalyticsClient } from '@/lib/fetch-revenue-client';
import { buildRevenueSearchParams, type RevenueAnalytics, type RevenueWindow } from '@/lib/revenue-analytics';

type RevenueExportButtonProps = {
  data: RevenueAnalytics;
  window: RevenueWindow;
};

export function RevenueExportButton({ data, window }: RevenueExportButtonProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      try {
        const query = buildRevenueSearchParams(window, {
          studentOffset: 0,
          studentLimit: 10000,
        }).toString();
        const full = await fetchRevenueAnalyticsClient(query);
        await downloadRevenueXlsx({ ...data, ...full, students: full.students }, full.students);
        toast({
          message: 'Revenue workbook downloaded.',
          variant: 'success',
          durationMs: 4000,
        });
      } catch {
        toast({
          message: 'Could not generate the export file.',
          variant: 'error',
          durationMs: 5000,
        });
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={busy}
      onClick={handleClick}
      leftIcon={<Download className="h-3.5 w-3.5" />}
      className="text-slate-600 hover:bg-white hover:text-brand"
    >
      {busy ? 'Preparing…' : 'Export'}
    </Button>
  );
}
