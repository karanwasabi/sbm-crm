import { redirect } from 'next/navigation';

export default function PurgeAuditPage() {
  redirect('/settings?tab=purge-audit');
}
