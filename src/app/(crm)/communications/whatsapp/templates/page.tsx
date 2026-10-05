import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';
import { WA_ACCOUNT_SEARCH_PARAM } from '@/lib/whatsapp-account';

type WhatsAppTemplatesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WhatsAppTemplatesPage({ searchParams }: WhatsAppTemplatesPageProps) {
  const params = await searchParams;
  const raw = params[WA_ACCOUNT_SEARCH_PARAM];
  const accountId = typeof raw === 'string' ? raw : undefined;
  const data = await loadCommsTemplatesTab('whatsapp', { accountId });
  return <CommunicationsView {...data} />;
}
