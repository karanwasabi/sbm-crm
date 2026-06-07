import { redirect } from 'next/navigation';
import { CrmShell } from '@/components/layout/crm/crm-shell';
import { createClient } from '@/utils/supabase/server';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <CrmShell>{children}</CrmShell>;
}
