'use client';

import { Bell, Mail } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BulkSendEmailDialog } from '@/components/comms/bulk-send-email-dialog';
import { BulkSendWhatsAppDialog } from '@/components/comms/bulk-send-whatsapp-dialog';
import { CohortPushSendDialog } from '@/components/programs/cohort-push-send-dialog';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button } from '@/components/ui/button';
import type { CohortMember } from '@/types/crm';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';

type CohortBulkSendButtonProps = {
  cohortId: string;
  cohortName: string;
  members: CohortMember[];
  selectedEnrollmentIds: string[];
  emailTemplates: EmailTemplate[];
  whatsappTemplates: WhatsAppTemplate[];
  whatsappSendsEnabled?: boolean;
  showPush?: boolean;
};

export function CohortBulkSendButton({
  cohortId,
  cohortName,
  members,
  selectedEnrollmentIds,
  emailTemplates,
  whatsappTemplates,
  whatsappSendsEnabled = false,
  showPush = false,
}: CohortBulkSendButtonProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const activeEmailTemplates = emailTemplates.filter((template) => template.status === 'active');
  const activeWhatsappTemplates = whatsappTemplates.filter((template) => template.status === 'active');
  const whatsappDisabled = !whatsappSendsEnabled || activeWhatsappTemplates.length === 0;

  const memberByEnrollment = useMemo(() => {
    const map = new Map<string, CohortMember>();
    for (const member of members) {
      map.set(member.enrollmentId, member);
    }
    return map;
  }, [members]);

  const selectedLeadIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();
    let missing = 0;

    for (const enrollmentId of selectedEnrollmentIds) {
      const member = memberByEnrollment.get(enrollmentId);
      const leadId = member?.leadId?.trim();
      if (!leadId) {
        missing += 1;
        continue;
      }
      if (seen.has(leadId)) continue;
      seen.add(leadId);
      ids.push(leadId);
    }

    return { ids, missing };
  }, [memberByEnrollment, selectedEnrollmentIds]);

  const selectedUserIds = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();

    for (const enrollmentId of selectedEnrollmentIds) {
      const member = memberByEnrollment.get(enrollmentId);
      const userId = member?.userId?.trim();
      if (!userId || seen.has(userId)) continue;
      seen.add(userId);
      ids.push(userId);
    }

    return ids;
  }, [memberByEnrollment, selectedEnrollmentIds]);

  useEffect(() => {
    setNotice(null);
  }, [selectedEnrollmentIds]);

  const isDisabled = selectedEnrollmentIds.length === 0 || selectedLeadIds.ids.length === 0;
  const pushDisabled = selectedEnrollmentIds.length === 0 || selectedUserIds.length === 0;

  const handleClick = (channel: 'email' | 'whatsapp') => {
    if (isDisabled) return;
    if (channel === 'email' && activeEmailTemplates.length === 0) return;
    if (channel === 'whatsapp' && activeWhatsappTemplates.length === 0) return;

    if (selectedLeadIds.missing > 0) {
      setNotice(
        `${selectedLeadIds.missing} selected member${selectedLeadIds.missing === 1 ? '' : 's'} have no linked lead and were excluded.`
      );
    } else {
      setNotice(null);
    }

    setLeadIds(selectedLeadIds.ids);
    if (channel === 'email') {
      setEmailDialogOpen(true);
    } else {
      setWhatsappDialogOpen(true);
    }
  };

  const handlePushClick = () => {
    if (pushDisabled) return;
    setUserIds(selectedUserIds);
    setPushDialogOpen(true);
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
        {showPush ? (
          <Button
            type="button"
            variant="light"
            size="sm"
            leftIcon={<Bell className="h-3.5 w-3.5" />}
            disabled={pushDisabled}
            onClick={handlePushClick}
          >
            Send push
          </Button>
        ) : null}
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

      {showPush ? (
        <CohortPushSendDialog
          cohortId={cohortId}
          cohortName={cohortName}
          userIds={userIds}
          open={pushDialogOpen}
          onClose={() => setPushDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}
