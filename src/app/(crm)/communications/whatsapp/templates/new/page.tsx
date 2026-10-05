import { redirect } from 'next/navigation';
import { WhatsAppTemplateEditor } from '@/components/comms/whatsapp-template-editor';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { resolveWhatsAppAccountId, WA_ACCOUNT_SEARCH_PARAM } from '@/lib/whatsapp-account';
import { getWhatsAppFlags, listWhatsAppAccounts } from '@/utils/api';

type NewWhatsAppTemplatePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function NewWhatsAppTemplatePage({ searchParams }: NewWhatsAppTemplatePageProps) {
  const flags = await getWhatsAppFlags().catch(() => ({ templatesEnabled: false, sendsEnabled: false }));
  if (!flags.templatesEnabled) {
    redirect('/communications/whatsapp/templates');
  }

  const params = await searchParams;
  const raw = params[WA_ACCOUNT_SEARCH_PARAM];
  const requestedAccountId = typeof raw === 'string' ? raw : undefined;
  const accountsPayload = await listWhatsAppAccounts().catch(() => ({
    accounts: [],
    defaultAccountId: '',
    accountLocked: false,
  }));
  const createAccountId = resolveWhatsAppAccountId(
    requestedAccountId,
    accountsPayload.accounts,
    accountsPayload.defaultAccountId
  );

  return (
    <CrmPageLayout className="gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">New WhatsApp template</h1>
      </div>
      <WhatsAppTemplateEditor managementEnabled createAccountId={createAccountId || undefined} />
    </CrmPageLayout>
  );
}
