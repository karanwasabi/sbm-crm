import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutomationDetailView } from '@/components/comms/automation-detail-view';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { commsTabHref } from '@/lib/comms-channel';
import { getAutomation, listEmailTemplates, listTagSuggestions, listWhatsAppTemplates } from '@/utils/api';

export default async function EditWhatsAppAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let automation;
  let emailTemplates;
  let whatsappTemplates;
  let tagSuggestions;
  try {
    [automation, emailTemplates, whatsappTemplates, tagSuggestions] = await Promise.all([
      getAutomation(id),
      listEmailTemplates().catch(() => []),
      listWhatsAppTemplates().catch(() => []),
      listTagSuggestions().catch(() => []),
    ]);
  } catch {
    notFound();
  }

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Automation builder</h1>
        <Link
          href={commsTabHref('whatsapp', 'automations')}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <AutomationDetailView
        automation={automation}
        channel="whatsapp"
        emailTemplates={emailTemplates}
        whatsappTemplates={whatsappTemplates}
        tagSuggestions={tagSuggestions}
      />
    </CrmPageLayout>
  );
}
