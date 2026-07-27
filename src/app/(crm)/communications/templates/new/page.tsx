import { redirect } from 'next/navigation';

export default function LegacyNewTemplatePage() {
  redirect('/communications/email/templates/new');
}
