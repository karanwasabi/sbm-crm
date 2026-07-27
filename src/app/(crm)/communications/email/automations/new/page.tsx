import Link from 'next/link';
import { AutomationBuilder } from '@/components/comms/automation-builder';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { commsTabHref } from '@/lib/comms-channel';
import { listEmailTemplates, listTagSuggestions } from '@/utils/api';

export default async function NewEmailAutomationPage() {
  const [emailTemplates, tagSuggestions] = await Promise.all([
    listEmailTemplates().catch(() => []),
    listTagSuggestions().catch(() => []),
  ]);

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">New automation</h1>
        <Link
          href={commsTabHref('email', 'automations')}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <AutomationBuilder
        automation={null}
        channel="email"
        emailTemplates={emailTemplates}
        tagSuggestions={tagSuggestions}
      />
    </CrmPageLayout>
  );
}
