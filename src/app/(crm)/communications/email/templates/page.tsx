import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';

type EmailTemplatesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EmailTemplatesPage({ searchParams }: EmailTemplatesPageProps) {
  const params = await searchParams;
  const data = await loadCommsTemplatesTab('email', params);
  return <CommunicationsView {...data} />;
}
