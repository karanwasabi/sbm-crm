import { redirect } from 'next/navigation';

export default function LegacyNewAutomationPage() {
  redirect('/communications/email/automations/new');
}
