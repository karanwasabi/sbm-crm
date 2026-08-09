'use client';

import { Globe, MessageCircle, Share2 } from 'lucide-react';
import { InboundLog } from '@/components/crm/inbound-log';
import { IntegrationCard } from '@/components/crm/integration-card';
import { MetaPurchaseDailyTable } from '@/components/crm/meta-purchase-daily-table';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { buildMetaIntegrationCard } from '@/lib/meta-integration';
import type { InboundLead, MetaIntegrationStatus, MetaPurchaseDailyReport } from '@/types/crm';

const INTEGRATION_ICONS = {
  meta: Share2,
  whatsapp: MessageCircle,
  website: Globe,
};

type MetaIntakeTabProps = {
  integrationStatus: MetaIntegrationStatus;
  inboundLeads: InboundLead[];
  purchaseDaily: MetaPurchaseDailyReport | null;
  purchaseDailyError?: string | null;
};

export function MetaIntakeTab({
  integrationStatus,
  inboundLeads,
  purchaseDaily,
  purchaseDailyError,
}: MetaIntakeTabProps) {
  const metaIntegration = buildMetaIntegrationCard(integrationStatus);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card>
        <SectionHead title="Integration health" subtitle="Native Meta leadgen inbound" />
        <div className="flex flex-col gap-2.5">
          <IntegrationCard
            name={metaIntegration.name}
            subtitle={metaIntegration.subtitle}
            icon={INTEGRATION_ICONS.meta}
            color={metaIntegration.color}
            status={metaIntegration.status}
          />
        </div>
      </Card>
      <Card>
        <div className="p-5">
          <SectionHead
            title="Meta-influenced purchases"
            subtitle="Daily paid checkouts with Meta attribution signals (IST)"
          />
        </div>
        <div className="px-5 pb-5">
          <MetaPurchaseDailyTable
            rows={purchaseDaily?.rows ?? []}
            windowDays={purchaseDaily?.windowDays ?? 30}
            total={purchaseDaily?.totalPurchases ?? 0}
            error={purchaseDailyError}
          />
        </div>
      </Card>
      <InboundLog leads={inboundLeads} />
    </div>
  );
}
