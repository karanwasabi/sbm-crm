import { redirect } from 'next/navigation';
import { SettingsView } from '@/components/views/settings-view';
import { isMarketingOnly } from '@/lib/access';
import type { MetaIntegrationStatus, RazorpayIntegrationStatus } from '@/types/crm';
import type { StaffList } from '@/utils/api';
import { fetchCountries, getMyAccess } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';
import type { Country } from '@/types/reference';

const EMPTY_META_STATUS: MetaIntegrationStatus = {
  connected: false,
  provider: null,
  automationAvailable: false,
  webhookConfigured: false,
  webhookUrl: '',
  leadsToday: 0,
  lastSyncAt: null,
  metaLeadsTotal: 0,
  metaLeads7d: 0,
  capiConfigured: false,
};

const EMPTY_STAFF: StaffList = { active: [], inactive: [] };

const EMPTY_RAZORPAY_STATUS: RazorpayIntegrationStatus = { configured: false, webhookConfigured: false };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let isMarketing = false;
  try {
    const access = await getMyAccess();
    isMarketing = isMarketingOnly(access.roles);
  } catch {
    isMarketing = false;
  }

  let countries: Country[] = [];

  try {
    countries = await fetchCountries();
  } catch {
    countries = [];
  }

  if (isMarketing) {
    return (
      <SettingsView
        countries={countries}
        staff={EMPTY_STAFF}
        currentUserId={user.id}
        integrationStatus={EMPTY_META_STATUS}
        razorpayStatus={EMPTY_RAZORPAY_STATUS}
        initialTab="Profile"
        purgeAuditItems={[]}
        purgeAuditTotal={0}
        isMarketingOnly
      />
    );
  }

  const { listStaff, getMetaIntegrationStatus, getRazorpayIntegrationStatus, listPurgeAuditEvents } =
    await import('@/utils/api');

  let staff: StaffList = EMPTY_STAFF;
  let integrationStatus: MetaIntegrationStatus = EMPTY_META_STATUS;
  let razorpayStatus: RazorpayIntegrationStatus = EMPTY_RAZORPAY_STATUS;
  let purgeAuditItems: Awaited<ReturnType<typeof listPurgeAuditEvents>>['items'] = [];
  let purgeAuditTotal = 0;

  try {
    staff = await listStaff();
  } catch {
    staff = EMPTY_STAFF;
  }

  try {
    integrationStatus = await getMetaIntegrationStatus();
  } catch {
    integrationStatus = EMPTY_META_STATUS;
  }

  try {
    razorpayStatus = await getRazorpayIntegrationStatus();
  } catch {
    razorpayStatus = EMPTY_RAZORPAY_STATUS;
  }

  try {
    const purgeAudit = await listPurgeAuditEvents({ limit: 50, offset: 0 });
    purgeAuditItems = purgeAudit.items;
    purgeAuditTotal = purgeAudit.total;
  } catch {
    purgeAuditItems = [];
    purgeAuditTotal = 0;
  }

  return (
    <SettingsView
      countries={countries}
      staff={staff}
      currentUserId={user.id}
      integrationStatus={integrationStatus}
      razorpayStatus={razorpayStatus}
      initialTab={tab}
      purgeAuditItems={purgeAuditItems}
      purgeAuditTotal={purgeAuditTotal}
    />
  );
}
