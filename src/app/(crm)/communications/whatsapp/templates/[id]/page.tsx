import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WhatsAppTemplateEditor } from '@/components/comms/whatsapp-template-editor';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { commsTabHref } from '@/lib/comms-channel';
import { getWhatsAppTemplate } from '@/utils/api';

export default async function EditWhatsAppTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let template;
  try {
    template = await getWhatsAppTemplate(id);
  } catch {
    notFound();
  }

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">{template.name}</h1>
        </div>
        <Link
          href={commsTabHref('whatsapp', 'templates')}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <WhatsAppTemplateEditor template={template} />
    </CrmPageLayout>
  );
}
