import { WhatsAppTemplateEditor } from '@/components/comms/whatsapp-template-editor';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

export default function NewWhatsAppTemplatePage() {
  return (
    <CrmPageLayout className="gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">New WhatsApp template</h1>
      </div>
      <WhatsAppTemplateEditor />
    </CrmPageLayout>
  );
}
