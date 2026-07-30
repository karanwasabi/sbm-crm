import { redirect } from 'next/navigation';

export default async function LegacyWhatsAppAutomationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/communications/automations/${id}`);
}
