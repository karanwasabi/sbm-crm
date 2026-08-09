export type PerformanceWindow = {
  timezone: string;
  since: string | null;
  until: string | null;
};

export type PerformanceDrilldownParams = {
  mode: 'leads' | 'purchases';
  sourceKey?: string;
  campaignId?: string;
  campaignUnattributed?: boolean;
  utmContent?: string;
  offlineCrmPaid?: boolean;
  since?: string | null;
  until?: string | null;
};

export function buildPerformanceDrilldownHref(params: PerformanceDrilldownParams): string {
  const search = new URLSearchParams();

  if (params.sourceKey) {
    search.set('perf_source', params.sourceKey);
  }
  if (params.campaignId) {
    search.set('meta_campaign_id', params.campaignId);
  }
  if (params.campaignUnattributed) {
    search.set('meta_campaign_unattributed', 'true');
  }
  if (params.utmContent) {
    search.set('utm_content', params.utmContent);
  }
  if (params.offlineCrmPaid) {
    search.set('offline_crm_paid', 'true');
  }

  if (params.mode === 'leads') {
    if (params.since) search.set('added_from', params.since);
    if (params.until) search.set('added_to', params.until);
  } else {
    if (params.since) search.set('paid_from', params.since);
    if (params.until) search.set('paid_to', params.until);
  }

  const query = search.toString();
  return query ? `/database?${query}` : '/database';
}

export function performanceWindowSubtitle(window: PerformanceWindow | null, days: number | 'all'): string {
  const ist = window?.timezone === 'Asia/Kolkata' ? 'IST' : (window?.timezone ?? 'IST');
  const range =
    window?.since && window?.until
      ? `${window.since.slice(0, 10)} – ${window.until.slice(0, 10)} ${ist}`
      : days === 'all'
        ? 'all time'
        : `last ${days} days ${ist}`;
  return range;
}
