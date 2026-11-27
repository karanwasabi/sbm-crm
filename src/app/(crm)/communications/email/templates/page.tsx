import { CommsTemplatesPage } from '@/app/(crm)/communications/_lib/comms-templates-panel';

type EmailTemplatesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EmailTemplatesPage({ searchParams }: EmailTemplatesPageProps) {
  const params = await searchParams;
  return <CommsTemplatesPage channel="email" searchParams={params} />;
}
