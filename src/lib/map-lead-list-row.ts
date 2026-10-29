import type { Lead, LeadMedium, LifecycleStage, ManualLeadSource, MarketingContactStatus } from '@/types/crm';

/** List-row JSON from GET /admin/leads. The table and the Excel export both use this. */
export type LeadListApiRow = {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  location: string;
  country_code?: string | null;
  city?: string | null;
  stage: LifecycleStage;
  medium?: LeadMedium | null;
  interest?: string | null;
  batch?: string | null;
  system_tags?: string[];
  manual_tags?: string[];
  tags?: string[];
  enriched: boolean;
  dedup: boolean;
  phone_duplicate?: boolean;
  phone_duplicate_count?: number;
  added_at: string;
  updated_at?: string | null;
  converted_at?: string | null;
  marketing_contact_status?: MarketingContactStatus | null;
  marketing_contact_synced_at?: string | null;
  marketing_unsubscribed_at?: string | null;
  unseen_suggestion_count?: number;
  source_label?: string | null;
  manual_source?: ManualLeadSource;
  member_kind?: 'renewal' | 'returnee' | null;
  latest_renewal_plan_key?: string | null;
  latest_renewal_duration?: string | null;
  latest_renewal_category?: string | null;
  created_by?: string | null;
  referrer_coach_name?: string | null;
  stars_earned?: number | null;
  stars_spent?: number | null;
  stars_available?: number | null;
  stars_value?: string | null;
  membership_ends_at?: string | null;
};

export function mapLeadListRow(row: LeadListApiRow): Lead {
  const firstName = row.first_name;
  const lastName = row.last_name ?? '';
  return {
    id: row.id,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(' '),
    email: row.email,
    phone: row.phone ?? '',
    location: row.location,
    countryCode: row.country_code ?? '',
    city: row.city ?? '',
    stage: row.stage,
    medium: row.medium ?? 'offline',
    sourceLabel: row.source_label ?? '',
    interest: row.interest || '—',
    batch: row.batch || '—',
    systemTags: row.system_tags ?? [],
    manualTags: row.manual_tags ?? [],
    tags: row.tags ?? [],
    enriched: row.enriched,
    dedup: row.dedup,
    phoneDuplicate: row.phone_duplicate ?? false,
    phoneDuplicateCount: row.phone_duplicate_count ?? 0,
    addedAt: row.added_at,
    updatedAt: row.updated_at ?? row.added_at,
    convertedAt: row.converted_at ?? null,
    marketingContactStatus: row.marketing_contact_status ?? 'no_consent',
    marketingContactSyncedAt: row.marketing_contact_synced_at ?? null,
    marketingUnsubscribedAt: row.marketing_unsubscribed_at ?? null,
    unseenSuggestionCount: row.unseen_suggestion_count ?? 0,
    memberKind: row.member_kind === 'renewal' || row.member_kind === 'returnee' ? row.member_kind : null,
    latestRenewalPlanKey: row.latest_renewal_plan_key?.trim() || null,
    latestRenewalDuration: row.latest_renewal_duration?.trim() || null,
    latestRenewalCategory: row.latest_renewal_category?.trim() || null,
    createdBy: row.created_by ?? null,
    referrerCoachName: row.referrer_coach_name ?? null,
    starsEarned: row.stars_earned ?? null,
    starsSpent: row.stars_spent ?? null,
    starsAvailable: row.stars_available ?? null,
    starsValue: row.stars_value ?? null,
    membershipEndsAt: row.membership_ends_at ?? null,
  };
}
