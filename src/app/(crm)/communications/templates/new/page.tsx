import { GrapesMjmlEditor } from '@/components/comms/grapes-mjml-editor-lazy';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

export default function NewTemplatePage() {
  return (
    <CrmPageLayout className="gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">New email template</h1>
        <p className="text-sm font-medium text-slate-500">Design with MJML blocks, upload images, and send a test.</p>
      </div>
      <GrapesMjmlEditor />
    </CrmPageLayout>
  );
}
