import { CommsTemplatesPage } from '@/app/(crm)/communications/_lib/comms-templates-panel';

type WhatsAppTemplatesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WhatsAppTemplatesPage({ searchParams }: WhatsAppTemplatesPageProps) {
  const params = await searchParams;
  return <CommsTemplatesPage channel="whatsapp" searchParams={params} />;
}
