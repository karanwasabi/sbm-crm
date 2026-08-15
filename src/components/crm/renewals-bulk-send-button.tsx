'use client';

import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BulkSendEmailDialog } from '@/components/comms/bulk-send-email-dialog';
import { BulkSendWhatsAppDialog } from '@/components/comms/bulk-send-whatsapp-dialog';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button } from '@/components/ui/button';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';

type RenewalsBulkSendButtonProps = {
  leadIds: string[];
  skippedCount?: number;
  emailTemplates: EmailTemplate[];
  whatsappTemplates: WhatsAppTemplate[];
  whatsappSendsEnabled?: boolean;
};

export function RenewalsBulkSendButton({
  leadIds,
  skippedCount = 0,
  emailTemplates,
  whatsappTemplates,
  whatsappSendsEnabled = false,
}: RenewalsBulkSendButtonProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const activeEmailTemplates = emailTemplates.filter((template) => template.status === 'active');
  const activeWhatsappTemplates = whatsappTemplates.filter((template) => template.status === 'active');
  const whatsappDisabled = !whatsappSendsEnabled || activeWhatsappTemplates.length === 0;
  const isDisabled = leadIds.length === 0;

  useEffect(() => {
    if (skippedCount > 0) {
      setNotice(
        `${skippedCount} selected member${skippedCount === 1 ? '' : 's'} have no linked lead and were excluded.`
      );
    } else {
      setNotice(null);
    }
  }, [leadIds, skippedCount]);

  const handleClick = (channel: 'email' | 'whatsapp') => {
    if (isDisabled) return;
    if (channel === 'email' && activeEmailTemplates.length === 0) return;
    if (channel === 'whatsapp' && activeWhatsappTemplates.length === 0) return;
    if (channel === 'email') {
      setEmailDialogOpen(true);
    } else {
      setWhatsappDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="light"
          size="sm"
          leftIcon={<Mail className="h-3.5 w-3.5" />}
          disabled={isDisabled || activeEmailTemplates.length === 0}
          onClick={() => handleClick('email')}
        >
          Send email
        </Button>
        <Button
          type="button"
          variant="light"
          size="sm"
          leftIcon={<WhatsAppIcon />}
          disabled={isDisabled || whatsappDisabled}
          title={!whatsappSendsEnabled ? 'WhatsApp sends are disabled on the backend.' : undefined}
          onClick={() => handleClick('whatsapp')}
        >
          Send WhatsApp
        </Button>
      </div>
      {notice ? <p className="max-w-xs text-right text-xs text-amber-700">{notice}</p> : null}
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
    </div>
  );
}
