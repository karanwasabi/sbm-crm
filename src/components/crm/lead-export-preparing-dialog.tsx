'use client';

import { Download, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type LeadExportPreparingDialogProps = {
  open: boolean;
  selectedCount: number;
  onCancel: () => void;
};

export function LeadExportPreparingDialog({ open, selectedCount, onCancel }: LeadExportPreparingDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
        <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-900">Preparing export</DialogTitle>
          <DialogDescription className="sr-only">
            Loading {selectedCount.toLocaleString('en-IN')} selected leads for CSV export
          </DialogDescription>
        </DialogHeader>

        <section className="border-b border-slate-100 bg-canvas-cool/60 px-6 py-4">
          <div className="space-y-3">
            <div
              className="flex gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-500"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" aria-hidden />
              <span>Loading selected leads…</span>
            </div>

            <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
              <p>
                Exporting <span className="font-semibold">{selectedCount.toLocaleString('en-IN')}</span> lead
                {selectedCount === 1 ? '' : 's'} to CSV. Large selections may take a moment.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FF] text-brand">
              <Download className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Your download will start automatically</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Stay on this page until the export finishes, or cancel to stop the download.
              </p>
            </div>
          </div>
        </section>

        <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button type="button" variant="light" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
