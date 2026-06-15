import { SettingsView } from '@/components/views/settings-view';
import { listStaffRoles, type StaffRoleRow } from '@/utils/api';

export default async function SettingsPage() {
  let teamRows: StaffRoleRow[] = [];
  try {
    teamRows = await listStaffRoles();
  } catch {
    teamRows = [];
  }

  return <SettingsView teamRows={teamRows} />;
}
