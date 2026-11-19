'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { AlertTriangle, IndianRupee, Loader2, RefreshCw, RotateCcw, Sparkles, Users } from 'lucide-react';
import { KpiStrip, type KpiStripItem } from '@/components/crm/kpi-strip';
import { RevenueExportButton } from '@/components/crm/revenue-export-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { formatInrFromPaise } from '@/lib/money';
import {
  buildRevenueSearchParams,
  classLabel,
  planLabel,
  sourceLabel,
  type RevenueAmountBlock,
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

const CLASS_STYLE: Record<string, { color: string; tint: string }> = {
  newbie: { color: '#10B981', tint: '#DCFCE7' },
  renewal: { color: '#5C65CF', tint: '#EEF0FF' },
  returning: { color: '#8338EC', tint: '#F3E8FF' },
};

const SOURCE_STYLE: Record<string, { color: string; tint: string }> = {
  ads: { color: '#5C65CF', tint: '#EEF0FF' },
  referral: { color: '#0EA5E9', tint: '#DBEEFE' },
  coach_handle: { color: '#0284C7', tint: '#E0F2FE' },
  webinar: { color: '#FFB703', tint: '#FEF3C7' },
  old_leads: { color: '#64748B', tint: '#F1F5F9' },
  quad: { color: '#8338EC', tint: '#F3E8FF' },
  seo: { color: '#10B981', tint: '#DCFCE7' },
};

function sumAmounts(rows: { amounts: RevenueAmountBlock }[]): RevenueAmountBlock {
  return rows.reduce(
    (acc, row) => ({
      basePaise: acc.basePaise + row.amounts.basePaise,
      gstPaise: acc.gstPaise + row.amounts.gstPaise,
      discountPaise: acc.discountPaise + row.amounts.discountPaise,
      starsPaise: acc.starsPaise + row.amounts.starsPaise,
      totalPaise: acc.totalPaise + row.amounts.totalPaise,
      studentCount: acc.studentCount + row.amounts.studentCount,
      paymentCount: acc.paymentCount + row.amounts.paymentCount,
    }),
    {
      basePaise: 0,
      gstPaise: 0,
      discountPaise: 0,
      starsPaise: 0,
      totalPaise: 0,
      studentCount: 0,
      paymentCount: 0,
    }
  );
}

function classTotals(data: RevenueAnalytics, className: string): RevenueAmountBlock {
  return sumAmounts(data.split.filter((row) => row.class === className));
}

function Pill({ label, color, tint }: { label: string; color: string; tint: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: tint, color }}
    >
      {label}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  accent,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  accent: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-800">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function AmountCells(amounts: RevenueAmountBlock) {
  return (
    <>
      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{amounts.studentCount}</td>
      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{amounts.paymentCount}</td>
      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{formatInrFromPaise(amounts.basePaise)}</td>
      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{formatInrFromPaise(amounts.gstPaise)}</td>
      <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums">
        {formatInrFromPaise(amounts.discountPaise)}
      </td>
      <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums">{formatInrFromPaise(amounts.starsPaise)}</td>
      <td className="px-3 py-2.5 text-right text-sm font-bold text-slate-800 tabular-nums">
        {formatInrFromPaise(amounts.totalPaise)}
      </td>
    </>
  );
}

function SourceBar({ total, value, color }: { total: number; value: number; color: string }) {
  const pct = total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function RevenueDashboardView({ data, window, loadError = null }: RevenueDashboardViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fromDate, setFromDate] = useState(() => isoToISTDateInput(window.since));
  const [toDate, setToDate] = useState(() => {
    const untilDay = isoToISTDateInput(window.until);
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

  const appliedFrom = useMemo(() => isoToISTDateInput(window.since), [window.since]);
  const appliedTo = useMemo(() => {
    const untilDay = isoToISTDateInput(window.until);
    return shiftCalendarDate(untilDay, -1) || untilDay;
  }, [window.until]);

  const presets = useMemo(() => {
    const end = appliedTo || isoToISTDateInput(new Date().toISOString());
    return [
      { label: '7d', from: shiftCalendarDate(end, -6), to: end },
      { label: '30d', from: shiftCalendarDate(end, -29), to: end },
      { label: '90d', from: shiftCalendarDate(end, -89), to: end },
    ];
  }, [appliedTo]);

  const selectedPreset = presets.find((preset) => preset.from === appliedFrom && preset.to === appliedTo)?.label;
  const rangeDirty = fromDate !== appliedFrom || toDate !== appliedTo;

  const newbie = useMemo(() => classTotals(data, 'newbie'), [data]);
  const renewal = useMemo(() => classTotals(data, 'renewal'), [data]);
  const returning = useMemo(() => classTotals(data, 'returning'), [data]);
  const collected = useMemo(() => sumAmounts(data.split), [data]);
  const sourceTotal = useMemo(
    () => data.newbieSources.reduce((sum, row) => sum + row.amounts.totalPaise, 0),
    [data.newbieSources]
  );

  const kpiItems: KpiStripItem[] = [
    {
      label: 'Collected',
      value: formatInrFromPaise(collected.totalPaise),
      sub: `${collected.paymentCount} payment${collected.paymentCount === 1 ? '' : 's'} this period`,
      accent: '#FFB703',
      icon: IndianRupee,
    },
    {
      label: 'Newbie',
      value: formatInrFromPaise(newbie.totalPaise),
      sub: `${newbie.studentCount} first-time buyer${newbie.studentCount === 1 ? '' : 's'}`,
      accent: CLASS_STYLE.newbie.color,
      icon: Sparkles,
    },
    {
      label: 'Renewal',
      value: formatInrFromPaise(renewal.totalPaise),
      sub: `${renewal.studentCount} within 3 months of expiry`,
      accent: CLASS_STYLE.renewal.color,
      icon: RefreshCw,
    },
    {
      label: 'Returning',
      value: formatInrFromPaise(returning.totalPaise),
      sub: `${returning.studentCount} after a 3+ month break`,
      accent: CLASS_STYLE.returning.color,
      icon: RotateCcw,
    },
    {
      label: 'Students',
      value: String(data.studentTotal),
      sub: 'Who paid in this period',
      accent: '#0EA5E9',
      icon: Users,
    },
  ];

  const studentPages = Math.max(1, Math.ceil(data.studentTotal / Math.max(data.studentLimit, 1)));
  const currentPage = Math.floor(data.studentOffset / Math.max(data.studentLimit, 1)) + 1;
  const failTotal =
    data.failures.failedCheckoutsCount +
    data.failures.failedChargesCount +
    data.failures.offlineRefundsCount +
    data.failures.paymentFailedEventsCount;

  return (
    <CrmPageLayout className="gap-5">
      {loadError ? (
        <div className="rounded-2xl border border-danger-press/20 bg-danger-press/5 px-4 py-3 text-sm font-medium text-danger-press">
          {loadError}
        </div>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-canvas-cool px-3 py-2.5 lg:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="flex size-3 shrink-0 items-center justify-center" aria-hidden>
              {pending ? <Loader2 size={11} className="animate-spin text-brand" /> : null}
            </span>
            <div
              className="inline-flex rounded-lg bg-slate-100/90 p-0.5 ring-1 ring-slate-200/60"
              role="group"
              aria-label="Date range presets"
            >
              {presets.map((preset) => {
                const active = selectedPreset === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setFromDate(preset.from);
                      setToDate(preset.to);
                      applyWindow(preset.from, preset.to);
                    }}
                    className={cn(
                      'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-all disabled:cursor-wait disabled:opacity-70',
                      active
                        ? 'bg-white text-brand-deep shadow-sm ring-1 ring-slate-200/80'
                        : 'text-slate-600 hover:text-slate-800'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

            <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2">
              <input
                type="date"
                aria-label="Start date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-[8.25rem] border-0 bg-transparent text-[12px] font-semibold text-slate-800 outline-none"
              />
              <span className="text-[11px] font-semibold text-slate-300" aria-hidden>
                –
              </span>
              <input
                type="date"
                aria-label="End date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-[8.25rem] border-0 bg-transparent text-[12px] font-semibold text-slate-800 outline-none"
              />
            </div>

            {rangeDirty ? (
              <Button
                type="button"
                size="sm"
                variant="light"
                disabled={pending || !fromDate || !toDate}
                onClick={() => applyWindow(fromDate, toDate)}
              >
                Apply
              </Button>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
            <RevenueExportButton data={data} window={window} />
          </div>
        </div>
      </Card>

      <KpiStrip items={kpiItems} columnsClassName="sm:grid-cols-2 xl:grid-cols-5" />

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <SectionCard
            title="Collections by type"
            subtitle="Paid amount by membership type and plan duration"
            accent="#5C65CF"
          >
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5">Plan</th>
                    <th className="px-3 py-2.5 text-right">Students</th>
                    <th className="px-3 py-2.5 text-right">Payments</th>
                    <th className="px-3 py-2.5 text-right">Base</th>
                    <th className="px-3 py-2.5 text-right">GST</th>
                    <th className="px-3 py-2.5 text-right">Discount</th>
                    <th className="px-3 py-2.5 text-right">Stars</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.split.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                        No collections in this period.
                      </td>
                    </tr>
                  ) : (
                    data.split.map((row) => {
                      const style = CLASS_STYLE[row.class] ?? { color: '#64748B', tint: '#F1F5F9' };
                      return (
                        <tr
                          key={`${row.class}-${row.plan}`}
                          className="border-b border-slate-50 hover:bg-canvas-cool/40"
                        >
                          <td className="px-3 py-2.5">
                            <Pill label={classLabel(row.class)} color={style.color} tint={style.tint} />
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-700">{planLabel(row.plan)}</td>
                          <AmountCells {...row.amounts} />
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-2">
          <SectionCard title="New student sources" subtitle="Where first-time buyers came from" accent="#10B981">
            <div className="space-y-3">
              {data.newbieSources.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No new student purchases this period.</p>
              ) : (
                data.newbieSources.map((row) => {
                  const style = SOURCE_STYLE[row.source] ?? { color: '#64748B', tint: '#F1F5F9' };
                  return (
                    <div
                      key={row.source}
                      className="rounded-xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/80 px-3.5 py-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Pill label={sourceLabel(row.source)} color={style.color} tint={style.tint} />
                        <span className="text-sm font-extrabold text-slate-800 tabular-nums">
                          {formatInrFromPaise(row.amounts.totalPaise)}
                        </span>
                      </div>
                      <SourceBar total={sourceTotal} value={row.amounts.totalPaise} color={style.color} />
                      <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500">
                        <span>
                          {row.amounts.studentCount} student{row.amounts.studentCount === 1 ? '' : 's'}
                        </span>
                        <span>
                          {row.amounts.paymentCount} payment{row.amounts.paymentCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Paying students"
        subtitle={`${data.studentTotal} paid this period · page ${currentPage} of ${studentPages}`}
        accent="#0EA5E9"
        action={
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
        }
      >
        <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2.5">Student</th>
                <th className="px-3 py-2.5">Joined</th>
                <th className="px-3 py-2.5 text-right">Purchases</th>
                <th className="px-3 py-2.5 text-right">Lifetime</th>
                <th className="px-3 py-2.5 text-right">Tenure</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    No paying students in this period.
                  </td>
                </tr>
              ) : (
                data.students.map((row) => (
                  <tr key={row.userId} className="border-b border-slate-50 hover:bg-canvas-cool/40">
                    <td className="px-3 py-2.5">
                      {row.leadId ? (
                        <Link
                          href={`/customers/${row.leadId}`}
                          className="font-bold text-slate-800 hover:text-brand hover:underline"
                        >
                          {row.fullName}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-800">{row.fullName}</span>
                      )}
                      <div className="text-[11px] text-slate-400">{row.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 tabular-nums">
                      {row.firstPurchaseAt ? new Date(row.firstPurchaseAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.purchaseCount}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                      {formatInrFromPaise(row.lifetimePaidPaise)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">
                      {row.monthsWithUs.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
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
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Cohort retention"
          subtitle="New joiners this period, still active or paying at 3 / 6 / 12 months"
          accent="#8338EC"
        >
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Joined</th>
                  <th className="px-3 py-2.5 text-right">Cohort</th>
                  <th className="px-3 py-2.5 text-right">3 mo</th>
                  <th className="px-3 py-2.5 text-right">6 mo</th>
                  <th className="px-3 py-2.5 text-right">12 mo</th>
                  <th className="px-3 py-2.5 text-right">Avg lifetime</th>
                </tr>
              </thead>
              <tbody>
                {data.joiningMonths.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                      No new joiners in this period.
                    </td>
                  </tr>
                ) : (
                  data.joiningMonths.map((row) => (
                    <tr key={row.joinMonth} className="border-b border-slate-50 hover:bg-canvas-cool/40">
                      <td className="px-3 py-2.5 font-bold text-slate-800">{row.joinMonth}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row.cohortSize}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <RetentionCell count={row.returnedByMonth3} total={row.cohortSize} color="#10B981" />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <RetentionCell count={row.returnedByMonth6} total={row.cohortSize} color="#5C65CF" />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <RetentionCell count={row.returnedByMonth12} total={row.cohortSize} color="#8338EC" />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                        {formatInrFromPaise(Math.round(row.avgLifetimePaidPaise))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Refunds & failures"
          subtitle="Excluded from collections · offline refunds show count only"
          accent="#F43F5E"
        >
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {failTotal} payment issue{failTotal === 1 ? '' : 's'} this period
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FailCard
              label="Failed checkouts"
              count={data.failures.failedCheckoutsCount}
              paise={data.failures.failedCheckoutsPaise}
            />
            <FailCard
              label="Failed autopay"
              count={data.failures.failedChargesCount}
              paise={data.failures.failedChargesPaise}
            />
            <FailCard label="Offline refunds" count={data.failures.offlineRefundsCount} />
            <FailCard label="Failed payment events" count={data.failures.paymentFailedEventsCount} />
          </div>
        </SectionCard>
      </div>
    </CrmPageLayout>
  );
}

function RetentionCell({ count, total, color }: { count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="font-bold text-slate-800">
        {count}
        {total > 0 ? <span className="font-medium text-slate-400"> · {pct}%</span> : null}
      </span>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </span>
    </span>
  );
}

function FailCard({ label, count, paise }: { label: string; count: number; paise?: number }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white px-4 py-3">
      <div className="text-[10px] font-bold tracking-[0.12em] text-rose-400 uppercase">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-slate-800 tabular-nums">{count}</div>
      {paise != null ? <div className="text-xs font-medium text-slate-500">{formatInrFromPaise(paise)}</div> : null}
    </div>
  );
}
