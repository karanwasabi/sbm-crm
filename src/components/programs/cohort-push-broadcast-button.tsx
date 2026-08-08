'use client';

import { Bell } from 'lucide-react';
import { useState } from 'react';
import { CohortPushSendDialog } from '@/components/programs/cohort-push-send-dialog';
import { Button } from '@/components/ui/button';

type CohortPushBroadcastButtonProps = {
  cohortId: string;
  cohortName: string;
  onScheduled?: () => void;
};

export function CohortPushBroadcastButton({ cohortId, cohortName, onScheduled }: CohortPushBroadcastButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="light"
        size="sm"
        leftIcon={<Bell className="h-3.5 w-3.5" />}
        onClick={() => setOpen(true)}
      >
        Send push
      </Button>
      <CohortPushSendDialog
        cohortId={cohortId}
        cohortName={cohortName}
        open={open}
        onClose={() => setOpen(false)}
        onScheduled={onScheduled}
      />
    </>
  );
}
