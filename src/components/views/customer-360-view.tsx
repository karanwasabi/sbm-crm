'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markLeadAsLost } from '@/app/(crm)/customers/actions';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { CallLogModal } from '@/components/crm/call-log-modal';
import { ProfileHeader } from '@/components/crm/profile-header';
import { ProgramHistory } from '@/components/crm/program-history';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { leadDetailToContactProfile } from '@/lib/lead-display';
import type { LeadDetail } from '@/types/crm';

type Customer360ViewProps = {
  lead: LeadDetail;
};

export function Customer360View({ lead: initialLead }: Customer360ViewProps) {
  const router = useRouter();
  const { setContactName } = useCrmContactName();
  const [lead, setLead] = useState(initialLead);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [markLostOpen, setMarkLostOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  const contact = leadDetailToContactProfile(lead);

  useEffect(() => {
    setContactName(contact.name);
    return () => setContactName(null);
  }, [contact.name, setContactName]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleMarkLost = () => {
    startTransition(async () => {
      const result = await markLeadAsLost(lead.id);
      if (!result.error) {
        setMarkLostOpen(false);
        refresh();
      }
    });
  };

  return (
    <CrmPageLayout>
      <ProfileHeader
        contact={contact}
        onLogCall={() => setCallModalOpen(true)}
        onMarkLost={contact.canMarkLost ? () => setMarkLostOpen(true) : undefined}
        markLostPending={pending}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <ActivityTimeline events={lead.timeline} />
        <ProgramHistory items={[]} />
      </div>
      <CallLogModal
        open={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        leadId={lead.id}
        onSaved={() => {
          setCallModalOpen(false);
          refresh();
        }}
        onSuggestMarkLost={() => setMarkLostOpen(true)}
      />
      {markLostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800">Mark as lost?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This lead will move to the lost stage. You can still view their profile and contact history.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMarkLostOpen(false)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkLost}
                disabled={pending}
                className="cursor-pointer rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Mark as lost
              </button>
            </div>
          </div>
        </div>
      )}
    </CrmPageLayout>
  );
}
