import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BulkSendJobDetailView } from '@/components/comms/bulk-send-job-detail-view';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { commsTabHref } from '@/lib/comms-channel';
import { getBulkLeadEmailSendJob } from '@/utils/api';

export default async function EmailBulkSendJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let job;
  try {
    job = await getBulkLeadEmailSendJob(id);
  } catch {
    notFound();
  }

  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Bulk send</h1>
        <Link
          href={commsTabHref('email', 'bulk-sends')}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>
      <BulkSendJobDetailView channel="email" initialJob={job} />
    </CrmPageLayout>
  );
}
