import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TemplateEditorForm } from '@/components/comms/template-editor-form';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { getEmailTemplate } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let template;
  try {
    template = await getEmailTemplate(id);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">{template.name}</h1>
          <p className="text-sm font-medium text-slate-500">Edit layout, content, and send a test email.</p>
        </div>
        <Link
          href="/communications"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <TemplateEditorForm template={template} staffEmail={user?.email ?? ''} />
    </CrmPageLayout>
  );
}
