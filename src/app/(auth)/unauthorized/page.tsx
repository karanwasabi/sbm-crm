import Link from 'next/link';
import { AuthLayout } from '@/components/layout/auth-layout';
import { SbmWordmark } from '@/components/brand/sbm-wordmark';
import { SectionHead } from '@/components/ui/section-head';

export default function UnauthorizedPage() {
  return (
    <AuthLayout>
      <div className="mb-7">
        <SbmWordmark size="sm" />
      </div>
      <SectionHead
        title="CRM access not available"
        subtitle="Your account does not have CRM access. Contact an administrator if you need staff access."
        className="mb-6"
      />
      <Link
        href="/login"
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-bold text-white no-underline"
      >
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
