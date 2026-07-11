'use client';

import { Globe, MessageCircle, Share2 } from 'lucide-react';
import { InboundLog } from '@/components/crm/inbound-log';
import { IntegrationCard } from '@/components/crm/integration-card';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import { buildMetaIntegrationCard } from '@/lib/meta-integration';
import type { InboundLead, MetaIntegrationStatus } from '@/types/crm';

const INTEGRATION_ICONS = {
  meta: Share2,
  whatsapp: MessageCircle,
  website: Globe,
};

type MetaIntakeTabProps = {
  integrationStatus: MetaIntegrationStatus;
  inboundLeads: InboundLead[];
};

export function MetaIntakeTab({ integrationStatus, inboundLeads }: MetaIntakeTabProps) {
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
      <InboundLog leads={inboundLeads} />
    </div>
  );
}
