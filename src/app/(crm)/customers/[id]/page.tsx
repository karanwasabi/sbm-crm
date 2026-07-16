import { notFound } from 'next/navigation';
import { Customer360View } from '@/components/views/customer-360-view';
import { isSuperadmin } from '@/lib/access';
import {
  ApiError,
  getLead,
  getMemberEnrollments,
  getMyAccess,
  listEmailTemplates,
  listTagSuggestions,
} from '@/utils/api';

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  try {
    const [lead, access] = await Promise.all([getLead(id), getMyAccess()]);
    const [programHistory, emailTemplates, tagSuggestions] = await Promise.all([
      lead.memberUserId != null ? getMemberEnrollments(lead.memberUserId).catch(() => []) : Promise.resolve([]),
      listEmailTemplates().catch(() => []),
      listTagSuggestions().catch(() => []),
    ]);
    return (
      <Customer360View
        lead={lead}
        programHistory={programHistory}
        emailTemplates={emailTemplates}
        tagSuggestions={tagSuggestions}
        canSyncPayment={isSuperadmin(access.roles)}
      />
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
