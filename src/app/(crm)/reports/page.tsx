import Link from 'next/link';
import { CalendarRange, FileText } from 'lucide-react';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { loadReportManifest } from '@/lib/reports';

function formatGeneratedOn(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function ReportsPage() {
  let reports: Awaited<ReturnType<typeof loadReportManifest>> = [];
  let loadError: string | null = null;
  try {
    reports = await loadReportManifest();
  } catch {
    loadError = 'Reports are unavailable right now. Please try again.';
  }

  return (
    <CrmPageLayout className="gap-4">
      {loadError ? (
        <Card>
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {loadError}
          </p>
        </Card>
      ) : null}

      {!loadError && reports.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-600">No reports yet.</p>
          </div>
        </Card>
      ) : null}

      {!loadError && reports.length > 0 ? (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id} padding="sm" className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-800">{report.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {report.batchLabel ? <Pill tone="brand">{report.batchLabel}</Pill> : null}
                      {report.dateRangeLabel ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          <CalendarRange className="h-3.5 w-3.5 text-brand" />
                          {report.dateRangeLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Generated {formatGeneratedOn(report.generatedOn)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/reports/${report.id}`}
                  className="inline-flex min-w-[112px] shrink-0 items-center justify-center rounded-full bg-brand px-5 py-2 text-xs font-bold text-white shadow-[0_6px_12px_-4px_rgba(79,70,229,0.35)] transition hover:bg-brand-press"
                >
                  Open
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </CrmPageLayout>
  );
}
