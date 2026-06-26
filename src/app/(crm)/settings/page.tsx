import { redirect } from 'next/navigation';
import { SettingsView } from '@/components/views/settings-view';
import { getMetaIntegrationStatus, listPurgeAuditEvents, listStaff, type StaffList } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';
import type { MetaIntegrationStatus } from '@/types/crm';

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

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let staff = emptyStaff;
  let integrationStatus = EMPTY_STATUS;
  let purgeAuditItems: Awaited<ReturnType<typeof listPurgeAuditEvents>>['items'] = [];
  let purgeAuditTotal = 0;

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
    const purgeAudit = await listPurgeAuditEvents({ limit: 50, offset: 0 });
    purgeAuditItems = purgeAudit.items;
    purgeAuditTotal = purgeAudit.total;
  } catch {
    purgeAuditItems = [];
    purgeAuditTotal = 0;
  }

  return (
    <SettingsView
      staff={staff}
      currentUserId={user.id}
      integrationStatus={integrationStatus}
      initialTab={tab}
      purgeAuditItems={purgeAuditItems}
      purgeAuditTotal={purgeAuditTotal}
    />
  );
}
