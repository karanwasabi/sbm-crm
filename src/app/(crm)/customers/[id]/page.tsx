import { notFound } from 'next/navigation';
import { Customer360View } from '@/components/views/customer-360-view';
import { ApiError, getLead, getMemberEnrollments, listEmailTemplates, listTagSuggestions } from '@/utils/api';

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  try {
    const lead = await getLead(id);
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
      />
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
