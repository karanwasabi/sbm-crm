import { redirect } from 'next/navigation';

export default async function LegacyEmailAutomationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/communications/automations/${id}`);
}
