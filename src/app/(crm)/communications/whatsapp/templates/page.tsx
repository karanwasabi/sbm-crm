import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';

type WhatsAppTemplatesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WhatsAppTemplatesPage({ searchParams }: WhatsAppTemplatesPageProps) {
  const params = await searchParams;
  const data = await loadCommsTemplatesTab('whatsapp', params);
  return <CommunicationsView {...data} />;
}
