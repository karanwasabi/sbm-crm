import { notFound } from 'next/navigation';
import { Customer360View } from '@/components/views/customer-360-view';
import { ApiError, getLead } from '@/utils/api';

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;

  try {
    const lead = await getLead(id);
    return <Customer360View lead={lead} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
