import { MarketingContactBadge } from '@/components/comms/marketing-contact-badge';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import type { LeadDetail } from '@/types/crm';

type MarketingContactCardProps = {
  lead: LeadDetail;
};

export function MarketingContactCard({ lead }: MarketingContactCardProps) {
  return (
    <Card>
      <SectionHead title="Marketing contact" subtitle="Resend audience eligibility" />
      <div className="flex flex-wrap items-center gap-2">
        <MarketingContactBadge status={lead.marketingContactStatus} />
        {lead.marketingContactSyncedAt ? (
          <span className="text-xs font-medium text-slate-500">
            Synced {new Date(lead.marketingContactSyncedAt).toLocaleString('en-IN')}
          </span>
        ) : null}
        {lead.marketingUnsubscribedAt ? (
          <span className="text-xs font-medium text-slate-500">
            Unsubscribed {new Date(lead.marketingUnsubscribedAt).toLocaleString('en-IN')}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
