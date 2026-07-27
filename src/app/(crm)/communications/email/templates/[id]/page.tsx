import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GrapesMjmlEditor } from '@/components/comms/grapes-mjml-editor-lazy';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { commsTabHref } from '@/lib/comms-channel';
import { getEmailTemplate } from '@/utils/api';

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let template;
  try {
    template = await getEmailTemplate(id);
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
          href={commsTabHref('email', 'templates')}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <GrapesMjmlEditor template={template} />
    </CrmPageLayout>
  );
}
