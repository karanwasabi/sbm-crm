import { notFound } from 'next/navigation';
import { Customer360View } from '@/components/views/customer-360-view';
import { ApiError, getLead, getMemberEnrollments, listEmailTemplates } from '@/utils/api';

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  try {
    const lead = await getLead(id);
    const [programHistory, emailTemplates] = await Promise.all([
      lead.memberUserId != null ? getMemberEnrollments(lead.memberUserId).catch(() => []) : Promise.resolve([]),
      listEmailTemplates().catch(() => []),
    ]);
    return <Customer360View lead={lead} programHistory={programHistory} emailTemplates={emailTemplates} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
