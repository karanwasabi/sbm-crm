'use client';

import { Mail } from 'lucide-react';
import { useState } from 'react';
import { BulkSendEmailDialog } from '@/components/comms/bulk-send-email-dialog';
import { BulkSendWhatsAppDialog } from '@/components/comms/bulk-send-whatsapp-dialog';
import { LeadExportPreparingDialog } from '@/components/crm/lead-export-preparing-dialog';
import { useLeadDatabaseSelection } from '@/components/crm/lead-database-selection-context';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button } from '@/components/ui/button';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';
import { cn } from '@/lib/cn';

type LeadDatabaseBulkSendButtonProps = {
  emailTemplates: EmailTemplate[];
  whatsappTemplates: WhatsAppTemplate[];
  whatsappSendsEnabled?: boolean;
};

export function LeadDatabaseBulkSendButton({
  emailTemplates,
  whatsappTemplates,
  whatsappSendsEnabled = false,
}: LeadDatabaseBulkSendButtonProps) {
  const { selectedCount, getExportLeads, needsPrefetchForExport, waitForPrefetch, cancelPendingExport } =
    useLeadDatabaseSelection();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [preparingOpen, setPreparingOpen] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);

  const activeEmailTemplates = emailTemplates.filter((template) => template.status === 'active');
  const activeWhatsappTemplates = whatsappTemplates.filter((template) => template.status === 'active');
  const whatsappDisabled = !whatsappSendsEnabled || activeWhatsappTemplates.length === 0;
  const isDisabled = selectedCount === 0;

  const openWithLeads = (ids: string[], channel: 'email' | 'whatsapp') => {
    setLeadIds(ids);
    if (channel === 'email') {
      setEmailDialogOpen(true);
    } else {
      setWhatsappDialogOpen(true);
    }
  };

  const handleClick = (channel: 'email' | 'whatsapp') => {
    if (selectedCount === 0) {
      return;
    }

    if (!needsPrefetchForExport()) {
      openWithLeads(
        getExportLeads().map((lead) => lead.id),
        channel
      );
      return;
    }

    setPreparingOpen(true);
    void waitForPrefetch().then((leads) => {
      setPreparingOpen(false);
      if (!leads) {
        return;
      }
      openWithLeads(
        leads.map((lead) => lead.id),
        channel
      );
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
        aria-disabled={isDisabled || activeEmailTemplates.length === 0}
        className={cn(
          (isDisabled || activeEmailTemplates.length === 0) &&
            'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none'
        )}
        onClick={() => handleClick('email')}
      >
        Send email
      </Button>

      <Button
        type="button"
        variant="light"
        size="sm"
        leftIcon={<WhatsAppIcon />}
        aria-disabled={isDisabled || whatsappDisabled}
        title={!whatsappSendsEnabled ? 'WhatsApp sends are disabled on the backend.' : undefined}
        className={cn(
          (isDisabled || whatsappDisabled) &&
            'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none'
        )}
        onClick={() => handleClick('whatsapp')}
      >
        Send WhatsApp
      </Button>

      <LeadExportPreparingDialog open={preparingOpen} selectedCount={selectedCount} onCancel={handleCancelPrepare} />

      <BulkSendEmailDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        leadIds={leadIds}
        templates={activeEmailTemplates}
      />

      <BulkSendWhatsAppDialog
        open={whatsappDialogOpen}
        onClose={() => setWhatsappDialogOpen(false)}
        leadIds={leadIds}
        templates={activeWhatsappTemplates}
      />
    </>
  );
}
