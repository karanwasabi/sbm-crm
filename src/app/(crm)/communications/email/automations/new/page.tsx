import { redirect } from 'next/navigation';

export default function LegacyEmailAutomationNewPage() {
  redirect('/communications/automations/new');
}
