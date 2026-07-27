import { redirect } from 'next/navigation';

export default async function LegacyBulkSendJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/communications/email/bulk-sends/${id}`);
}
