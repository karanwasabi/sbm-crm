import Link from 'next/link';
import { TemplateEditorForm } from '@/components/comms/template-editor-form';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

export default function NewTemplatePage() {
  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">New email template</h1>
          <p className="text-sm font-medium text-slate-500">Choose a layout, add content, and save.</p>
        </div>
        <Link
          href="/communications"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <TemplateEditorForm />
    </CrmPageLayout>
  );
}
