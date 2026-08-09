export type MarketingCampaignKind =
  | 'unattributed'
  | 'lead_ad'
  | 'web_traffic'
  | 'retargeting'
  | 'lookalike'
  | 'registration'
  | 'sales'
  | 'prospecting'
  | 'other';

export type MarketingHealthStatus =
  | 'unattributed'
  | 'on_track'
  | 'no_crm_leads'
  | 'no_direct_leads'
  | 'traffic_only'
  | 'no_spend'
  | 'no_activity';

const CAMPAIGN_KIND_LABELS: Record<MarketingCampaignKind, string> = {
  unattributed: 'Unattributed',
  lead_ad: 'Lead Ad',
  web_traffic: 'Web traffic',
  retargeting: 'Retargeting',
  lookalike: 'Lookalike',
  registration: 'Registration',
  sales: 'Sales',
  prospecting: 'Prospecting',
  other: 'Other',
};

const HEALTH_LABELS: Record<MarketingHealthStatus, string> = {
  unattributed: 'Unattributed',
  on_track: 'On track',
  no_crm_leads: 'No CRM leads',
  no_direct_leads: 'No direct leads',
  traffic_only: 'Traffic only',
  no_spend: 'No spend synced',
  no_activity: 'No activity',
};

const HEALTH_HINTS: Record<MarketingHealthStatus, string> = {
  unattributed: 'Meta-influenced leads missing a campaign id.',
  on_track: 'CRM leads are attributed to this row in the selected window.',
  no_crm_leads: 'Lead Ad spend with zero CRM leads — investigate attribution or pause spend.',
  no_direct_leads: 'Spend without direct CRM leads — may still assist via site traffic or other campaigns.',
  traffic_only: 'Website traffic campaign — CRM leads are not expected on this campaign id.',
  no_spend: 'Leads exist but no synced ad spend for this campaign in the window.',
  no_activity: 'No spend or leads in the selected window.',
};

export function marketingCampaignKindLabel(kind: string | null | undefined): string {
  if (!kind) return 'Other';
  return CAMPAIGN_KIND_LABELS[kind as MarketingCampaignKind] ?? 'Other';
}

export function marketingHealthLabel(health: string | null | undefined): string {
  if (!health) return 'Unknown';
  return HEALTH_LABELS[health as MarketingHealthStatus] ?? health;
}

export function marketingHealthHint(health: string | null | undefined): string {
  if (!health) return '';
  return HEALTH_HINTS[health as MarketingHealthStatus] ?? '';
}

export function marketingHealthTone(
  health: string | null | undefined
): 'success' | 'warn' | 'danger' | 'neutral' | 'brand' {
  switch (health) {
    case 'on_track':
      return 'success';
    case 'no_crm_leads':
      return 'danger';
    case 'no_direct_leads':
    case 'no_spend':
      return 'warn';
    case 'traffic_only':
      return 'brand';
    default:
      return 'neutral';
  }
}

export function formatCompactCount(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  return value.toLocaleString('en-IN');
}

export function formatCtr(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCpc(value: number | null | undefined): string {
  if (value == null) return '—';
  return `₹${value.toFixed(0)}`;
}
