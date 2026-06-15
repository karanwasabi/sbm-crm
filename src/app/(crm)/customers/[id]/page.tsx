import { notFound } from 'next/navigation';
import { Customer360View } from '@/components/views/customer-360-view';
import { ApiError, getLead, getMemberEnrollments } from '@/utils/api';

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  try {
    const lead = await getLead(id);
    const programHistory =
      lead.memberUserId != null ? await getMemberEnrollments(lead.memberUserId).catch(() => []) : [];
    return <Customer360View lead={lead} programHistory={programHistory} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
