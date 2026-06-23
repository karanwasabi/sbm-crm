import { redirect } from 'next/navigation';
import { SettingsView } from '@/components/views/settings-view';
import { getMetaIntegrationStatus, listStaff, type StaffList } from '@/utils/api';
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

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let staff = emptyStaff;
  let integrationStatus = EMPTY_STATUS;

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

  return <SettingsView staff={staff} currentUserId={user.id} integrationStatus={integrationStatus} />;
}
