import { redirect } from 'next/navigation';

export default async function LegacyEditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/communications/email/templates/${id}`);
}
