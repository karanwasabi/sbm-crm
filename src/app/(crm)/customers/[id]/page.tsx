import { Customer360View } from '@/components/views/customer-360-view';

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  return <Customer360View customerId={id} />;
}
