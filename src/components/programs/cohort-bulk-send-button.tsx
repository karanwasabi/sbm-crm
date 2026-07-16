'use client';

import { Mail } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BulkSendEmailDialog } from '@/components/comms/bulk-send-email-dialog';
import { Button } from '@/components/ui/button';
import type { CohortMember } from '@/types/crm';
import type { EmailTemplate } from '@/utils/api';

type CohortBulkSendButtonProps = {
  members: CohortMember[];
  selectedEnrollmentIds: string[];
  templates: EmailTemplate[];
};

export function CohortBulkSendButton({ members, selectedEnrollmentIds, templates }: CohortBulkSendButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const activeTemplates = templates.filter((template) => template.status === 'active');

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

  useEffect(() => {
    setNotice(null);
  }, [selectedEnrollmentIds]);

  const isDisabled =
    selectedEnrollmentIds.length === 0 || activeTemplates.length === 0 || selectedLeadIds.ids.length === 0;

  const handleClick = () => {
    if (isDisabled) return;

    if (selectedLeadIds.missing > 0) {
      setNotice(
        `${selectedLeadIds.missing} selected member${selectedLeadIds.missing === 1 ? '' : 's'} have no linked lead and were excluded.`
      );
    } else {
      setNotice(null);
    }

    setLeadIds(selectedLeadIds.ids);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="light"
        size="sm"
        leftIcon={<Mail className="h-3.5 w-3.5" />}
        disabled={isDisabled}
        onClick={handleClick}
      >
        Send email
      </Button>

      {notice ? <p className="max-w-xs text-right text-xs text-amber-700">{notice}</p> : null}

      <BulkSendEmailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        leadIds={leadIds}
        templates={activeTemplates}
      />
    </div>
  );
}
