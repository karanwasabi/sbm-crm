import { redirect } from 'next/navigation';
import { CrmShell } from '@/components/layout/crm/crm-shell';
import { hasProduct, PRODUCT_CRM, visibleStaffRoles } from '@/lib/access';
import { getMyAccess } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';

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
    if (visible.length > 0) {
      accessLabel = visible.join(', ');
    }
  } catch {
    redirect('/unauthorized');
  }

  const staffUser = {
    email: user.email ?? 'Unknown user',
    initials: initialsFromEmail(user.email ?? '??'),
    roleLabel: accessLabel,
  };

  return <CrmShell staffUser={staffUser}>{children}</CrmShell>;
}
