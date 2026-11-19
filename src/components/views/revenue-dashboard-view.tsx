'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { RevenueExportButton } from '@/components/crm/revenue-export-button';
import { Button } from '@/components/ui/button';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { formatInrFromPaise } from '@/lib/money';
import {
  buildRevenueSearchParams,
  classLabel,
  planLabel,
  sourceLabel,
  type RevenueAnalytics,
  type RevenueWindow,
} from '@/lib/revenue-analytics';
import { isoToISTDateInput, istLocalInputToRFC3339, shiftCalendarDate } from '@/lib/ist-datetime';
import { cn } from '@/lib/cn';

type RevenueDashboardViewProps = {
  data: RevenueAnalytics;
  window: RevenueWindow;
  loadError?: string | null;
};

function AmountCells({
  basePaise,
  gstPaise,
  discountPaise,
  starsPaise,
  totalPaise,
}: {
  basePaise: number;
  gstPaise: number;
  discountPaise: number;
  starsPaise: number;
  totalPaise: number;
}) {
  return (
    <>
      <td className="px-3 py-2 text-right tabular-nums">{formatInrFromPaise(basePaise)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatInrFromPaise(gstPaise)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatInrFromPaise(discountPaise)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatInrFromPaise(starsPaise)}</td>
      <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatInrFromPaise(totalPaise)}</td>
    </>
  );
}

export function RevenueDashboardView({ data, window, loadError = null }: RevenueDashboardViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fromDate, setFromDate] = useState(() => isoToISTDateInput(window.since));
  const [toDate, setToDate] = useState(() => {
    const untilDay = isoToISTDateInput(window.until);
    // until is exclusive midnight → show previous calendar day as inclusive end
    return shiftCalendarDate(untilDay, -1) || untilDay;
  });

  const applyWindow = (nextFrom: string, nextToInclusive: string) => {
    const since = istLocalInputToRFC3339(nextFrom, '00:00');
    const untilExclusive = istLocalInputToRFC3339(shiftCalendarDate(nextToInclusive, 1), '00:00');
    const params = buildRevenueSearchParams({ since, until: untilExclusive });
    startTransition(() => {
      router.push(`/revenue?${params.toString()}`);
    });
  };

  const presets = useMemo(() => {
    const end = toDate || isoToISTDateInput(new Date().toISOString());
    return [
      { label: '7d', from: shiftCalendarDate(end, -6), to: end },
      { label: '30d', from: shiftCalendarDate(end, -29), to: end },
      { label: '90d', from: shiftCalendarDate(end, -89), to: end },
    ];
  }, [toDate]);

  const studentPages = Math.max(1, Math.ceil(data.studentTotal / Math.max(data.studentLimit, 1)));
  const currentPage = Math.floor(data.studentOffset / Math.max(data.studentLimit, 1)) + 1;

  return (
    <CrmPageLayout className="gap-6">
      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{loadError}</div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Revenue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Payments in range (IST). Newbie / renewal / returning use a 3-month access-gap rule.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-600">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={pending || !fromDate || !toDate}
            onClick={() => applyWindow(fromDate, toDate)}
          >
            Apply
          </Button>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant="light"
              disabled={pending}
              onClick={() => {
                setFromDate(preset.from);
                setToDate(preset.to);
                applyWindow(preset.from, preset.to);
              }}
            >
              {preset.label}
            </Button>
          ))}
          <RevenueExportButton data={data} window={window} />
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-800">Revenue split</h2>
        <p className="mt-1 text-xs text-slate-500">Students and ₹ by class and plan length.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2 text-right">Students</th>
                <th className="px-3 py-2 text-right">Payments</th>
                <th className="px-3 py-2 text-right">Base</th>
                <th className="px-3 py-2 text-right">GST</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Stars</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.split.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                    No paid payments in this range.
                  </td>
                </tr>
              ) : (
                data.split.map((row) => (
                  <tr key={`${row.class}-${row.plan}`} className="border-b border-slate-50">
                    <td className="px-3 py-2">{classLabel(row.class)}</td>
                    <td className="px-3 py-2">{planLabel(row.plan)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.amounts.studentCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.amounts.paymentCount}</td>
                    <AmountCells {...row.amounts} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-800">Newbie sources</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2 text-right">Students</th>
                <th className="px-3 py-2 text-right">Payments</th>
                <th className="px-3 py-2 text-right">Base</th>
                <th className="px-3 py-2 text-right">GST</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Stars</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.newbieSources.map((row) => (
                <tr key={row.source} className="border-b border-slate-50">
                  <td className="px-3 py-2">{sourceLabel(row.source)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.amounts.studentCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.amounts.paymentCount}</td>
                  <AmountCells {...row.amounts} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Students</h2>
            <p className="mt-1 text-xs text-slate-500">
              {data.studentTotal} with a paid event in range · page {currentPage} of {studentPages}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="light"
              disabled={pending || data.studentOffset <= 0}
              onClick={() => {
                const params = buildRevenueSearchParams(window, {
                  studentOffset: Math.max(0, data.studentOffset - data.studentLimit),
                  studentLimit: data.studentLimit,
                });
                startTransition(() => router.push(`/revenue?${params.toString()}`));
              }}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="light"
              disabled={pending || data.studentOffset + data.studentLimit >= data.studentTotal}
              onClick={() => {
                const params = buildRevenueSearchParams(window, {
                  studentOffset: data.studentOffset + data.studentLimit,
                  studentLimit: data.studentLimit,
                });
                startTransition(() => router.push(`/revenue?${params.toString()}`));
              }}
            >
              Next
            </Button>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">First purchase</th>
                <th className="px-3 py-2 text-right">Purchases</th>
                <th className="px-3 py-2 text-right">Lifetime paid</th>
                <th className="px-3 py-2 text-right">Months</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    No students in this range.
                  </td>
                </tr>
              ) : (
                data.students.map((row) => (
                  <tr key={row.userId} className="border-b border-slate-50">
                    <td className="px-3 py-2">
                      {row.leadId ? (
                        <Link href={`/customers/${row.leadId}`} className="font-medium text-slate-800 hover:underline">
                          {row.fullName}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-800">{row.fullName}</span>
                      )}
                      <div className="text-[11px] text-slate-400">{row.email}</div>
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.firstPurchaseAt ? new Date(row.firstPurchaseAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.purchaseCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatInrFromPaise(row.lifetimePaidPaise)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.monthsWithUs.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-800">By joining month</h2>
        <p className="mt-1 text-xs text-slate-500">
          Cohorts whose first purchase fell in this range; returned = still open or paid again by month 3 / 6 / 12.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 text-[11px] tracking-wide text-slate-400 uppercase">
              <tr>
                <th className="px-3 py-2">Join month</th>
                <th className="px-3 py-2 text-right">Cohort</th>
                <th className="px-3 py-2 text-right">By M3</th>
                <th className="px-3 py-2 text-right">By M6</th>
                <th className="px-3 py-2 text-right">By M12</th>
                <th className="px-3 py-2 text-right">Avg paid</th>
              </tr>
            </thead>
            <tbody>
              {data.joiningMonths.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    No first-time joiners in this range.
                  </td>
                </tr>
              ) : (
                data.joiningMonths.map((row) => (
                  <tr key={row.joinMonth} className="border-b border-slate-50">
                    <td className="px-3 py-2">{row.joinMonth}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.cohortSize}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.returnedByMonth3}
                      {row.cohortSize > 0 ? ` (${Math.round((row.returnedByMonth3 / row.cohortSize) * 100)}%)` : ''}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.returnedByMonth6}
                      {row.cohortSize > 0 ? ` (${Math.round((row.returnedByMonth6 / row.cohortSize) * 100)}%)` : ''}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.returnedByMonth12}
                      {row.cohortSize > 0 ? ` (${Math.round((row.returnedByMonth12 / row.cohortSize) * 100)}%)` : ''}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatInrFromPaise(Math.round(row.avgLifetimePaidPaise))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-800">Refunds & failed payments</h2>
        <p className="mt-1 text-xs text-slate-500">
          Kept separate from collected revenue. Offline refunds are count-only.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FailCard
            label="Failed checkouts"
            count={data.failures.failedCheckoutsCount}
            paise={data.failures.failedCheckoutsPaise}
          />
          <FailCard
            label="Failed subscription charges"
            count={data.failures.failedChargesCount}
            paise={data.failures.failedChargesPaise}
          />
          <FailCard label="Offline refunds recorded" count={data.failures.offlineRefundsCount} />
          <FailCard label="Payment failed events" count={data.failures.paymentFailedEventsCount} />
        </div>
      </section>
    </CrmPageLayout>
  );
}

function FailCard({ label, count, paise }: { label: string; count: number; paise?: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-800 tabular-nums">{count}</div>
      {paise != null ? <div className="text-xs text-slate-500">{formatInrFromPaise(paise)}</div> : null}
    </div>
  );
}
