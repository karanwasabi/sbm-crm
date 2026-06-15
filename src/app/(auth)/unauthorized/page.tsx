import { redirect } from 'next/navigation';
import { signOut } from '@/app/(auth)/actions';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { SectionHead } from '@/components/ui/section-head';
import { createClient } from '@/utils/supabase/server';

export default async function UnauthorizedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const email = user.email ?? 'Unknown account';

  return (
    <AuthLayout>
      <div className="mb-7">
        <SbmWordmark size="sm" />
      </div>
      <SectionHead
        title="CRM access not available"
        subtitle="Your account does not have CRM access. Contact an administrator if you need staff access."
        className="mb-5"
      />
      <p className="mb-6 rounded-2xl border border-slate-200 bg-canvas-cool px-4 py-3 text-[13px] text-slate-700">
        Signed in as <span className="font-semibold text-slate-900">{email}</span>
      </p>
      <form action={signOut}>
        <Button type="submit" fullWidth>
          Log out
        </Button>
      </form>
    </AuthLayout>
  );
}
