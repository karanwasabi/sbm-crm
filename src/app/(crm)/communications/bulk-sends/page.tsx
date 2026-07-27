import { redirect } from 'next/navigation';

export default function LegacyBulkSendsPage() {
  redirect('/communications/email/bulk-sends');
}
