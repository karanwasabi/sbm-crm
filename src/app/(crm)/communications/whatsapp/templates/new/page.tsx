import { redirect } from 'next/navigation';
import { WhatsAppTemplateEditor } from '@/components/comms/whatsapp-template-editor';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { getWhatsAppFlags } from '@/utils/api';

export default async function NewWhatsAppTemplatePage() {
  const flags = await getWhatsAppFlags().catch(() => ({ templatesEnabled: false, sendsEnabled: false }));
  if (!flags.templatesEnabled) {
    redirect('/communications/whatsapp/templates');
  }

  return (
    <CrmPageLayout className="gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">New WhatsApp template</h1>
      </div>
      <WhatsAppTemplateEditor managementEnabled />
    </CrmPageLayout>
  );
}
