'use client';

import { Mail } from 'lucide-react';
import { useState } from 'react';
import { BulkSendEmailDialog } from '@/components/comms/bulk-send-email-dialog';
import { BulkSendWhatsAppDialog } from '@/components/comms/bulk-send-whatsapp-dialog';
import { LeadExportPreparingDialog } from '@/components/crm/lead-export-preparing-dialog';
import { useLeadDatabaseSelection } from '@/components/crm/lead-database-selection-context';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fetchEmailTemplatesClient, fetchWhatsAppTemplatesClient } from '@/lib/comms-templates-client';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';
import { cn } from '@/lib/cn';

type LeadDatabaseBulkSendButtonProps = {
  emailTemplates?: EmailTemplate[];
  whatsappTemplates?: WhatsAppTemplate[];
  whatsappSendsEnabled?: boolean;
  createdByMe: boolean;
  restrictToCreatedByMe?: boolean;
};

export function LeadDatabaseBulkSendButton({
  emailTemplates = [],
  whatsappTemplates = [],
  whatsappSendsEnabled = false,
  createdByMe,
  restrictToCreatedByMe = false,
}: LeadDatabaseBulkSendButtonProps) {
  const { selectedCount, getExportLeads, needsPrefetchForExport, waitForPrefetch, cancelPendingExport } =
    useLeadDatabaseSelection();
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [preparingOpen, setPreparingOpen] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [fetchedEmailTemplates, setFetchedEmailTemplates] = useState<EmailTemplate[]>(emailTemplates);
  const [fetchedWhatsappTemplates, setFetchedWhatsappTemplates] = useState<WhatsAppTemplate[]>(whatsappTemplates);

  const activeEmailTemplates = fetchedEmailTemplates.filter((template) => template.status === 'active');
  const activeWhatsappTemplates = fetchedWhatsappTemplates.filter((template) => template.status === 'active');
  const createdByMeBlocked = restrictToCreatedByMe && !createdByMe;
  const isDisabled = selectedCount === 0 || createdByMeBlocked || loadingTemplates;

  const ensureEmailTemplates = async (): Promise<EmailTemplate[]> => {
    if (fetchedEmailTemplates.length > 0) {
      return fetchedEmailTemplates;
    }
    const templates = await fetchEmailTemplatesClient();
    setFetchedEmailTemplates(templates);
    return templates;
  };

  const ensureWhatsappTemplates = async (): Promise<WhatsAppTemplate[]> => {
    if (fetchedWhatsappTemplates.length > 0) {
      return fetchedWhatsappTemplates;
    }
    const templates = await fetchWhatsAppTemplatesClient();
    setFetchedWhatsappTemplates(templates);
    return templates;
  };

  const openWithLeads = (ids: string[], channel: 'email' | 'whatsapp') => {
    setLeadIds(ids);
    if (channel === 'email') {
      setEmailDialogOpen(true);
    } else {
      setWhatsappDialogOpen(true);
    }
  };

  const handleClick = async (channel: 'email' | 'whatsapp') => {
    if (createdByMeBlocked) {
      toast({
        message:
          channel === 'email'
            ? 'Turn on the Created by me filter to send email.'
            : 'Turn on the Created by me filter to send WhatsApp.',
        variant: 'warning',
        durationMs: 5000,
      });
      return;
    }

    if (selectedCount === 0 || loadingTemplates) {
      return;
    }

    if (channel === 'whatsapp' && !whatsappSendsEnabled) {
      toast({
        message: 'WhatsApp sends are disabled on the backend.',
        variant: 'warning',
        durationMs: 5000,
      });
      return;
    }

    try {
      setLoadingTemplates(true);
      if (channel === 'email') {
        const templates = await ensureEmailTemplates();
        if (templates.filter((template) => template.status === 'active').length === 0) {
          toast({ message: 'No active email templates available.', variant: 'warning', durationMs: 5000 });
          return;
        }
      } else {
        const templates = await ensureWhatsappTemplates();
        if (templates.filter((template) => template.status === 'active').length === 0) {
          toast({ message: 'No active WhatsApp templates available.', variant: 'warning', durationMs: 5000 });
          return;
        }
      }
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : 'Failed to load templates.',
        variant: 'error',
        durationMs: 5000,
      });
      return;
    } finally {
      setLoadingTemplates(false);
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
        aria-disabled={isDisabled || loadingTemplates}
        className={cn(
          (isDisabled || loadingTemplates) &&
            'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none'
        )}
        onClick={() => void handleClick('email')}
      >
        {loadingTemplates ? 'Loading…' : 'Send email'}
      </Button>

      <Button
        type="button"
        variant="light"
        size="sm"
        leftIcon={<WhatsAppIcon />}
        aria-disabled={isDisabled || !whatsappSendsEnabled || loadingTemplates}
        title={!whatsappSendsEnabled ? 'WhatsApp sends are disabled on the backend.' : undefined}
        className={cn(
          (isDisabled || !whatsappSendsEnabled || loadingTemplates) &&
            'cursor-not-allowed border-b-slate-200 bg-slate-100 text-slate-400 shadow-none'
        )}
        onClick={() => void handleClick('whatsapp')}
      >
        {loadingTemplates ? 'Loading…' : 'Send WhatsApp'}
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
