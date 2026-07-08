import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { getReportById } from '@/lib/reports';

export default async function ReportViewerPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getReportById(reportId);
  if (!report) {
    notFound();
  }

  return (
    <CrmPageLayout className="gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-800">{report.title}</h1>
          {report.batchLabel || report.dateRangeLabel ? (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
              {[report.batchLabel, report.dateRangeLabel].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
        <Link
          href="/reports"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
        >
          Back
        </Link>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <iframe
          title={report.title}
          src={`/api/reports/${encodeURIComponent(report.id)}`}
          className="h-[calc(100vh-220px)] min-h-[640px] w-full border-0 bg-white"
        />
      </div>
    </CrmPageLayout>
  );
}
