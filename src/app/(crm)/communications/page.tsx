import { CommunicationsView } from '@/components/views/communications-view';
import { getMarketingContactsSummary, listEmailTemplates } from '@/utils/api';

export default async function CommunicationsPage() {
  let templates: Awaited<ReturnType<typeof listEmailTemplates>> = [];
  let marketingSummary: Awaited<ReturnType<typeof getMarketingContactsSummary>> = {
    used: 0,
    limit: 1000,
    planTier: 'free',
    percentUsed: 0,
  };

  try {
    [templates, marketingSummary] = await Promise.all([listEmailTemplates(), getMarketingContactsSummary()]);
  } catch {
    // Page still renders with empty state if backend/migration not ready.
  }

  return <CommunicationsView templates={templates} marketingSummary={marketingSummary} />;
}
