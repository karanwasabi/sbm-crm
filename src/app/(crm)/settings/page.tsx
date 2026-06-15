import { redirect } from 'next/navigation';
import { SettingsView } from '@/components/views/settings-view';
import { listStaff, type StaffList } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';

const emptyStaff: StaffList = { active: [], inactive: [] };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let staff = emptyStaff;
  try {
    staff = await listStaff();
  } catch {
    staff = emptyStaff;
  }

  return <SettingsView staff={staff} currentUserId={user.id} />;
}
