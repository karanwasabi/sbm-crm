import Link from 'next/link';
import { AutomationBuilder } from '@/components/comms/automation-builder';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { COMMS_AUTOMATIONS_HREF } from '@/lib/comms-channel';
import { listEmailTemplates, listTagSuggestions, listWhatsAppTemplates } from '@/utils/api';

export default async function NewAutomationPage() {
  const [emailTemplates, whatsappTemplates, tagSuggestions] = await Promise.all([
    listEmailTemplates().catch(() => []),
    listWhatsAppTemplates().catch(() => []),
    listTagSuggestions().catch(() => []),
  ]);

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">New automation</h1>
        <Link
          href={COMMS_AUTOMATIONS_HREF}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <AutomationBuilder
        automation={null}
        emailTemplates={emailTemplates}
        whatsappTemplates={whatsappTemplates}
        tagSuggestions={tagSuggestions}
      />
    </CrmPageLayout>
  );
}
