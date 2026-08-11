import { redirect } from 'next/navigation';
import { CrmShell } from '@/components/layout/crm/crm-shell';
import { hasProduct, PRODUCT_CRM, visibleStaffRoles, isSuperadmin, isMarketingOnly } from '@/lib/access';
import { getLatestProfile, getMyAccess, getWhatsAppFlags, ApiError } from '@/utils/api';
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
  let superadmin = false;
  let marketing = false;
  try {
    const access = await getMyAccess();
    if (!hasProduct(access.products, PRODUCT_CRM)) {
      redirect('/unauthorized');
    }
    superadmin = isSuperadmin(access.roles);
    marketing = isMarketingOnly(access.roles);
    const visible = visibleStaffRoles(access.roles);
    if (superadmin) {
      accessLabel = 'Superadmin';
    } else if (visible.length > 0) {
      accessLabel = visible.map((role) => role.charAt(0).toUpperCase() + role.slice(1)).join(', ');
    }
  } catch {
    redirect('/unauthorized');
  }

  // Fetch profile and WhatsApp flags in parallel
  const [profileResult, flagsResult] = await Promise.allSettled([getLatestProfile(), getWhatsAppFlags()]);

  let profile: Profile | null = null;
  let profileError: string | null = null;
  if (profileResult.status === 'fulfilled') {
    profile = profileResult.value;
  } else {
    profileError = profileResult.reason instanceof ApiError ? profileResult.reason.message : 'Failed to load profile.';
  }

  let whatsappSendsEnabled = false;
  if (flagsResult.status === 'fulfilled') {
    whatsappSendsEnabled = flagsResult.value.sendsEnabled;
  }

  const staffUser = {
    email: user.email ?? 'Unknown user',
    initials: profile ? getInitials(profile) : initialsFromEmail(user.email ?? '??'),
    roleLabel: accessLabel,
  };

  return (
    <CrmShell
      staffUser={staffUser}
      profile={profile}
      profileError={profileError}
      isSuperadmin={superadmin}
      isMarketing={marketing}
      whatsappSendsEnabled={whatsappSendsEnabled}
    >
      {children}
    </CrmShell>
  );
}
