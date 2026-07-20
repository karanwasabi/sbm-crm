'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { downloadCohortMembersXlsx } from '@/lib/export-cohort-members-xlsx';
import { cn } from '@/lib/cn';
import type { CohortMember } from '@/types/crm';

type CohortExportButtonProps = {
  members: CohortMember[];
  selectedEnrollmentIds: string[];
  includeBodyMetrics?: boolean;
};

export function CohortExportButton({
  members,
  selectedEnrollmentIds,
  includeBodyMetrics = false,
}: CohortExportButtonProps) {
  const { toast } = useToast();
  const isDisabled = selectedEnrollmentIds.length === 0;

  const handleClick = () => {
    if (selectedEnrollmentIds.length === 0) {
      toast({
        message: 'Select at least one member to export.',
        variant: 'warning',
        durationMs: 5000,
      });
      return;
    }

    const selected = new Set(selectedEnrollmentIds);
    const rows = members.filter((member) => selected.has(member.enrollmentId));
    if (rows.length === 0) {
      toast({
        message: 'No members available to export.',
        variant: 'error',
        durationMs: 5000,
      });
      return;
    }

    void downloadCohortMembersXlsx(rows, { includeBodyMetrics })
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

  return (
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
  );
}
