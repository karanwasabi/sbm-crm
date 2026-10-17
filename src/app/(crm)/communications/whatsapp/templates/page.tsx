import { redirect } from 'next/navigation';
import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';
import { buildCommsTemplatesHref, clampCommsTemplatePage } from '@/lib/comms-templates-query';

type WhatsAppTemplatesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WhatsAppTemplatesPage({ searchParams }: WhatsAppTemplatesPageProps) {
  const params = await searchParams;
  const data = await loadCommsTemplatesTab('whatsapp', params);
  const clampedPage = clampCommsTemplatePage(
    data.templateFilters.page,
    data.templatesTotal,
    data.templateFilters.pageSize
  );
  if (clampedPage !== data.templateFilters.page) {
    redirect(buildCommsTemplatesHref(data.templateFilters, { page: clampedPage }));
  }
  return <CommunicationsView {...data} />;
}
