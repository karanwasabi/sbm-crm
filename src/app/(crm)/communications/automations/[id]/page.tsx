import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutomationDetailView } from '@/components/comms/automation-detail-view';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { COMMS_AUTOMATIONS_HREF } from '@/lib/comms-channel';
import { getAutomation, listEmailTemplates, listStaff, listTagSuggestions, listWhatsAppTemplates } from '@/utils/api';

export default async function EditAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let automation;
  let emailTemplates;
  let whatsappTemplates;
  let tagSuggestions;
  let coaches: Awaited<ReturnType<typeof listStaff>>['active'] = [];
  try {
    const [automationResult, emailResult, whatsappResult, tagsResult, staff] = await Promise.all([
      getAutomation(id),
      listEmailTemplates(),
      listWhatsAppTemplates().catch(() => []),
      listTagSuggestions().catch(() => []),
      listStaff().catch(() => ({ active: [], inactive: [] })),
    ]);
    automation = automationResult;
    emailTemplates = emailResult;
    whatsappTemplates = whatsappResult;
    tagSuggestions = tagsResult;
    coaches = staff.active.filter((row) => row.roles.includes('coach'));
  } catch {
    notFound();
  }

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Automation builder</h1>
        <Link
          href={COMMS_AUTOMATIONS_HREF}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <AutomationDetailView
        automation={automation}
        emailTemplates={emailTemplates}
        whatsappTemplates={whatsappTemplates}
        tagSuggestions={tagSuggestions}
        coaches={coaches}
      />
    </CrmPageLayout>
  );
}
