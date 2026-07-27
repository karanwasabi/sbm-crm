import { redirect } from 'next/navigation';

export default function LegacyTemplatesPage() {
  redirect('/communications/email/templates');
}
