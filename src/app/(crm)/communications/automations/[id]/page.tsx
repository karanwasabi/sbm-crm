import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutomationDetailView } from '@/components/comms/automation-detail-view';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { getAutomation, listEmailTemplates, listTagSuggestions } from '@/utils/api';

export default async function EditAutomationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let automation;
  let templates;
  let tagSuggestions;
  try {
    [automation, templates, tagSuggestions] = await Promise.all([
      getAutomation(id),
      listEmailTemplates(),
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
          href="/communications/automations"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <AutomationDetailView automation={automation} templates={templates} tagSuggestions={tagSuggestions} />
    </CrmPageLayout>
  );
}
