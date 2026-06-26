import { redirect } from 'next/navigation';
import { SettingsView } from '@/components/views/settings-view';
import {
  fetchCountries,
  getMetaIntegrationStatus,
  getRazorpayIntegrationStatus,
  listPurgeAuditEvents,
  listStaff,
  type StaffList,
} from '@/utils/api';
import { createClient } from '@/utils/supabase/server';
import type { MetaIntegrationStatus, RazorpayIntegrationStatus } from '@/types/crm';
import type { Country } from '@/types/reference';

const emptyStaff: StaffList = { active: [], inactive: [] };

const EMPTY_STATUS: MetaIntegrationStatus = {
  connected: false,
  provider: null,
  webhookConfigured: false,
  webhookUrl: '',
  leadsToday: 0,
  lastSyncAt: null,
  metaLeadsTotal: 0,
  metaLeads7d: 0,
};

const EMPTY_RAZORPAY_STATUS: RazorpayIntegrationStatus = {
  configured: false,
  webhookConfigured: false,
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let countries: Country[] = [];
  let staff = emptyStaff;
  let integrationStatus = EMPTY_STATUS;
  let razorpayStatus = EMPTY_RAZORPAY_STATUS;
  let purgeAuditItems: Awaited<ReturnType<typeof listPurgeAuditEvents>>['items'] = [];
  let purgeAuditTotal = 0;

  try {
    countries = await fetchCountries();
  } catch {
    countries = [];
  }

  try {
    staff = await listStaff();
  } catch {
    staff = emptyStaff;
  }

  try {
    integrationStatus = await getMetaIntegrationStatus();
  } catch {
    integrationStatus = EMPTY_STATUS;
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
