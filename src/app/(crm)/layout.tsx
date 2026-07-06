import { redirect } from 'next/navigation';
import { CrmShell } from '@/components/layout/crm/crm-shell';
import { hasProduct, PRODUCT_CRM, visibleStaffRoles, isSuperadmin } from '@/lib/access';
import { getLatestProfile, getMyAccess, ApiError } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';
import { getInitials, type Profile } from '@/types/profile';

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let accessLabel = 'Staff';
  try {
    const access = await getMyAccess();
    if (!hasProduct(access.products, PRODUCT_CRM)) {
      redirect('/unauthorized');
    }
    const visible = visibleStaffRoles(access.roles);
    if (isSuperadmin(access.roles)) {
      accessLabel = 'Superadmin';
    } else if (visible.length > 0) {
      accessLabel = visible.map((role) => role.charAt(0).toUpperCase() + role.slice(1)).join(', ');
    }
  } catch {
    redirect('/unauthorized');
  }

  let profile: Profile | null = null;
  let profileError: string | null = null;

  try {
    profile = await getLatestProfile();
  } catch (error) {
    profileError = error instanceof ApiError ? error.message : 'Failed to load profile.';
  }

  const staffUser = {
    email: user.email ?? 'Unknown user',
    initials: profile ? getInitials(profile) : initialsFromEmail(user.email ?? '??'),
    roleLabel: accessLabel,
  };

  return (
    <CrmShell staffUser={staffUser} profile={profile} profileError={profileError}>
      {children}
    </CrmShell>
  );
}
