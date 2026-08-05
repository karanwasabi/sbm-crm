'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { getPurgeAuditEventAction } from '@/app/(crm)/purge-audit/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PurgeAuditDetailSkeleton } from '@/components/loading/comms-page-skeletons';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { formatInclusiveAccessEndDate } from '@/lib/access-until-display';
import { formatDateTimeIST } from '@/lib/ist-datetime';
import { formatInrFromPaise } from '@/lib/money';
import type { PurgeAuditDetail, PurgeAuditListItem } from '@/utils/api';

type PurgeAuditPanelProps = {
  initialItems: PurgeAuditListItem[];
  total: number;
};

function outcomeTone(outcome: string) {
  switch (outcome) {
    case 'completed':
      return 'success' as const;
    case 'failed':
      return 'danger' as const;
    default:
      return 'warn' as const;
  }
}

function formatPaise(paise?: number) {
  if (!paise) return '—';
  return formatInrFromPaise(paise);
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">{title}</h3>
      <div className="rounded-xl border border-slate-100 bg-canvas-cool/60 p-3 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function PurgeAuditDetailDialog({
  detail,
  loading,
  open,
  onOpenChange,
}: {
  detail: PurgeAuditDetail | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {loading || !detail ? (
          <PurgeAuditDetailSkeleton />
        ) : (
          <>
            <DialogHeader className="gap-1 border-b border-slate-100 px-6 py-5 pr-12">
              <DialogTitle className="text-lg font-bold text-slate-900">{detail.email}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Purged {formatDateTimeIST(detail.purged_at)} by {detail.purged_by_name}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[min(75vh,640px)] space-y-4 overflow-y-auto px-6 py-5">
              <div className="flex flex-wrap gap-2">
                <Pill tone={outcomeTone(detail.outcome)}>{detail.outcome}</Pill>
                <Pill tone="neutral">{detail.environment}</Pill>
              </div>

              <DetailSection title="Reason">
                <p className="whitespace-pre-wrap">{detail.reason}</p>
                {detail.error_message ? <p className="mt-2 text-red-700">{detail.error_message}</p> : null}
              </DetailSection>

              <DetailSection title="Payment summary">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <p>
                    <span className="text-slate-500">Upfront</span>
                    <br />
                    <span className="font-semibold text-slate-900">{formatPaise(detail.total_upfront_paise)}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Recurring</span>
                    <br />
                    <span className="font-semibold text-slate-900">{formatPaise(detail.total_charged_paise)}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Total paid</span>
                    <br />
                    <span className="font-semibold text-slate-900">{formatPaise(detail.total_paid_paise)}</span>
                  </p>
                </div>
              </DetailSection>

              {detail.billing_snapshot.checkouts && detail.billing_snapshot.checkouts.length > 0 ? (
                <DetailSection title="Checkout sessions">
                  <div className="space-y-3">
                    {detail.billing_snapshot.checkouts.map((checkout) => (
                      <div
                        key={checkout.checkout_session_id}
                        className="rounded-lg border border-slate-100 bg-white p-3"
                      >
                        <p className="font-semibold text-slate-900">
                          {checkout.program_name ?? 'Program'} · {checkout.cohort_name ?? 'Cohort'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Upfront {formatPaise(checkout.upfront_total_paise)}
                          {checkout.paid_at ? ` · Paid ${formatDateTimeIST(checkout.paid_at)}` : ''}
                          {checkout.access_until
                            ? ` · Access until ${formatInclusiveAccessEndDate(checkout.access_until)}`
                            : ''}
                        </p>
                        {checkout.razorpay_subscription_id ? (
                          <p className="mt-1 text-xs break-all text-slate-500">
                            Sub {checkout.razorpay_subscription_id}
                          </p>
                        ) : null}
                        {checkout.razorpay_payment_id ? (
                          <p className="text-xs break-all text-slate-500">Payment {checkout.razorpay_payment_id}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {detail.billing_snapshot.recurring_charges && detail.billing_snapshot.recurring_charges.length > 0 ? (
                <DetailSection title="Recurring charges">
                  <div className="space-y-2">
                    {detail.billing_snapshot.recurring_charges.map((charge, index) => (
                      <div
                        key={`${charge.razorpay_payment_id ?? 'charge'}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{formatPaise(charge.amount_paise)}</p>
                          <p className="text-xs text-slate-500">
                            {charge.charged_at ? formatDateTimeIST(charge.charged_at) : '—'} · {charge.status}
                          </p>
                        </div>
                        {charge.razorpay_payment_id ? (
                          <code className="text-[11px] text-slate-500">{charge.razorpay_payment_id}</code>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {detail.razorpay_snapshot.subscriptions && detail.razorpay_snapshot.subscriptions.length > 0 ? (
                <DetailSection title="Razorpay">
                  <div className="space-y-2">
                    {detail.razorpay_snapshot.subscriptions.map((sub) => (
                      <div
                        key={sub.subscription_id}
                        className="rounded-lg border border-slate-100 bg-white p-3 text-xs"
                      >
                        <p className="font-medium break-all text-slate-800">{sub.subscription_id}</p>
                        <p className="mt-1 text-slate-500">
                          Status {sub.final_status}
                          {sub.customer_id ? ` · Customer ${sub.customer_id}` : ''}
                        </p>
                        {sub.tokens_revoked && sub.tokens_revoked.length > 0 ? (
                          <p className="mt-1 break-all text-slate-500">
                            Tokens revoked: {sub.tokens_revoked.join(', ')}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              <DetailSection title="Identifiers">
                <div className="space-y-1 text-xs break-all">
                  <p>Lead {detail.lead_id}</p>
                  {detail.user_id ? <p>User {detail.user_id}</p> : <p>No member user linked</p>}
                  <p>Audit {detail.id}</p>
                </div>
              </DetailSection>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PurgeAuditPanel({ initialItems, total }: PurgeAuditPanelProps) {
  const [detail, setDetail] = useState<PurgeAuditDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingDetail, startDetail] = useTransition();

  const openDetail = (item: PurgeAuditListItem) => {
    setDetail(null);
    setDetailError(null);
    setDetailOpen(true);
    startDetail(async () => {
      const result = await getPurgeAuditEventAction(item.id);
      if (result.error || !result.detail) {
        setDetailError(result.error ?? 'Failed to load purge event.');
        setDetailOpen(false);
        return;
      }
      setDetail(result.detail);
    });
  };

  return (
    <>
      <Card>
        <SectionHead
          title="Account purge history"
          subtitle={`${total} event${total === 1 ? '' : 's'} recorded · read-only audit for refunds and incident response`}
        />
        {detailError ? <p className="mb-3 text-sm text-red-700">{detailError}</p> : null}
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell>When</DataTableHeaderCell>
            <DataTableHeaderCell>Email</DataTableHeaderCell>
            <DataTableHeaderCell>Outcome</DataTableHeaderCell>
            <DataTableHeaderCell>Total paid</DataTableHeaderCell>
            <DataTableHeaderCell>By</DataTableHeaderCell>
            <DataTableHeaderCell>Reason</DataTableHeaderCell>
            <DataTableHeaderCell>Actions</DataTableHeaderCell>
          </DataTableHead>
          <DataTableBody>
            {initialItems.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                  No purge events yet.
                </DataTableCell>
              </DataTableRow>
            ) : (
              initialItems.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="whitespace-nowrap text-slate-600">
                    {formatDateTimeIST(item.purged_at)}
                  </DataTableCell>
                  <DataTableCell className="font-medium text-slate-900">{item.email}</DataTableCell>
                  <DataTableCell>
                    <Pill tone={outcomeTone(item.outcome)}>{item.outcome}</Pill>
                  </DataTableCell>
                  <DataTableCell>{formatPaise(item.total_paid_paise)}</DataTableCell>
                  <DataTableCell className="text-slate-600">{item.purged_by_name}</DataTableCell>
                  <DataTableCell className="max-w-[220px] truncate text-slate-600">{item.reason}</DataTableCell>
                  <DataTableCell className="text-right">
                    <Button variant="light" size="sm" disabled={loadingDetail} onClick={() => openDetail(item)}>
                      View
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </Card>

      <PurgeAuditDetailDialog detail={detail} loading={loadingDetail} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
