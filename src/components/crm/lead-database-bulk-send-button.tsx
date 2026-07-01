'use client';

import { Mail } from 'lucide-react';
import { useState } from 'react';
import { BulkSendEmailDialog } from '@/components/comms/bulk-send-email-dialog';
import { LeadExportPreparingDialog } from '@/components/crm/lead-export-preparing-dialog';
import { useLeadDatabaseSelection } from '@/components/crm/lead-database-selection-context';
import { Button } from '@/components/ui/button';
import type { EmailTemplate } from '@/utils/api';
import { cn } from '@/lib/cn';

type LeadDatabaseBulkSendButtonProps = {
  templates: EmailTemplate[];
};

export function LeadDatabaseBulkSendButton({ templates }: LeadDatabaseBulkSendButtonProps) {
  const { selectedCount, getExportLeads, needsPrefetchForExport, waitForPrefetch, cancelPendingExport } =
    useLeadDatabaseSelection();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preparingOpen, setPreparingOpen] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);

  const activeTemplates = templates.filter((template) => template.status === 'active');
  const isDisabled = selectedCount === 0 || activeTemplates.length === 0;

  const openWithLeads = (ids: string[]) => {
    setLeadIds(ids);
    setDialogOpen(true);
  };

  const handleClick = () => {
    if (selectedCount === 0) {
      return;
    }

    if (!needsPrefetchForExport()) {
      openWithLeads(getExportLeads().map((lead) => lead.id));
      return;
    }

    setPreparingOpen(true);
    void waitForPrefetch().then((leads) => {
      setPreparingOpen(false);
      if (!leads) {
        return;
      }
      openWithLeads(leads.map((lead) => lead.id));
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
        leftIcon={<Mail className="h-3.5 w-3.5" />}
        aria-disabled={isDisabled}
        className={cn(isDisabled && 'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none')}
        onClick={handleClick}
      >
        Send email
      </Button>

      <LeadExportPreparingDialog open={preparingOpen} selectedCount={selectedCount} onCancel={handleCancelPrepare} />

      <BulkSendEmailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        leadIds={leadIds}
        templates={activeTemplates}
      />
    </>
  );
}
