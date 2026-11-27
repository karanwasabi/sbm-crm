'use client';

import { usePathname, useRouter } from 'next/navigation';
import { CommsHeaderStats } from '@/components/comms/comms-header-stats';
import { commsTabHref, type CommsChannel } from '@/lib/comms-channel';
import type { CommsAnalyticsSummary, MarketingContactsSummary } from '@/utils/api';

type CommsHeaderStatsClientProps = {
  marketingSummary: MarketingContactsSummary;
  analyticsSummary: CommsAnalyticsSummary | null;
};

export function CommsHeaderStatsClient({ marketingSummary, analyticsSummary }: CommsHeaderStatsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const channel: CommsChannel = pathname.includes('/whatsapp') ? 'whatsapp' : 'email';
  const activeAutomationCount = analyticsSummary?.activeAutomations ?? 0;

  return (
    <CommsHeaderStats
      marketingSummary={marketingSummary}
      analytics={analyticsSummary}
      activeAutomationCount={activeAutomationCount}
      onOpenPerformance={() => router.push(commsTabHref(channel, 'performance'))}
    />
  );
}
