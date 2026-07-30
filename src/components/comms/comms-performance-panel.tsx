import Link from 'next/link';
import { commsAutomationHref } from '@/lib/comms-channel';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { emailSendStatusLabel, emailSendStatusTone, formatCommsWhen } from '@/lib/comms-display';
import {
  TRIGGER_LABELS,
  automationStatusLabel,
  automationStatusPillTone,
  type AutomationStatus,
} from '@/lib/automation-types';
import type { CommsAnalytics } from '@/utils/api';

type CommsPerformancePanelProps = {
  analytics: CommsAnalytics;
};

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
      <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-800 tabular-nums">{value.toLocaleString('en-IN')}</p>
      {hint ? <p className="mt-0.5 text-[11px] font-medium text-slate-400">{hint}</p> : null}
    </div>
  );
}

function formatRate(value?: number) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

export function CommsPerformancePanel({ analytics }: CommsPerformancePanelProps) {
  const { totals, templates, automations, recentSends, recentIssues, webhookUrl, webhookEnabled } = analytics;

  return (
    <div className="flex flex-col gap-4">
      <Card padding="sm" className="p-4">
        <SectionHead
          title="Resend webhooks"
          subtitle={
            webhookEnabled
              ? 'Signature verification is configured'
              : 'Set RESEND_WEBHOOK_SECRET on the backend after creating the webhook in Resend'
          }
        />
        <code className="block rounded-xl bg-slate-50 px-3 py-2 text-xs break-all text-slate-700">{webhookUrl}</code>
        <p className="mt-2 text-xs text-slate-500">
          Subscribe to email.sent, email.delivered, email.bounced, email.suppressed, email.opened, email.clicked, and
          email.complained in the Resend dashboard. Delivery stats sync automatically from webhooks and background
          reconcile every few minutes.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Sent" value={totals.sent} />
        <StatCard label="Delivered" value={totals.delivered} hint="Webhooks + sync" />
        <StatCard label="Suppressed" value={totals.suppressed} hint="Not a bounce" />
        <StatCard label="Bounced" value={totals.bounced} />
        <StatCard label="Clicked" value={totals.clicked} />
        <StatCard label="Pending" value={totals.pending} hint="Syncing soon" />
        <StatCard label="Stale pending" value={totals.stalePending} hint="Check Resend" />
        <StatCard label="Opened" value={totals.opened} hint="Marketing only" />
        <StatCard label="Failed / skipped" value={totals.failed + totals.skipped} />
      </div>

      <Card>
        <SectionHead title="Recent sends" subtitle="Last 30 emails from the CRM" />
        {recentSends.length === 0 ? (
          <p className="text-sm text-slate-500">No sends recorded yet.</p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>When</DataTableHeaderCell>
              <DataTableHeaderCell>Recipient</DataTableHeaderCell>
              <DataTableHeaderCell>Subject</DataTableHeaderCell>
              <DataTableHeaderCell>Template</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {recentSends.map((send) => (
                <DataTableRow key={send.id}>
                  <DataTableCell>
                    <span className="text-xs text-slate-600">{formatCommsWhen(send.sentAt ?? send.createdAt)}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-sm font-medium text-slate-800">{send.recipientEmail}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="line-clamp-1 text-sm text-slate-700">{send.subjectRendered || '—'}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-600">{send.templateName || '—'}</span>
                      <Pill tone={send.classification === 'marketing' ? 'brand' : 'neutral'}>
                        {send.classification === 'marketing' ? 'Marketing' : 'Transactional'}
                      </Pill>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <Pill tone={emailSendStatusTone(send.status)}>{emailSendStatusLabel(send.status)}</Pill>
                    {send.skipReason ? <p className="mt-1 text-[11px] text-slate-500">{send.skipReason}</p> : null}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Card>
        <SectionHead title="Automations" subtitle="Live enrollment counts per workflow" />
        {automations.length === 0 ? (
          <p className="text-sm text-slate-500">No automations yet.</p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Workflow</DataTableHeaderCell>
              <DataTableHeaderCell>Trigger</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Active</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Waiting</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Completed</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Failed</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Total</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {automations.map((row) => (
                <DataTableRow key={row.automationId}>
                  <DataTableCell>
                    <Link
                      href={commsAutomationHref(row.automationId)}
                      className="text-sm font-semibold text-slate-800 hover:text-brand"
                    >
                      {row.name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs text-slate-600">
                      {TRIGGER_LABELS[row.triggerType as keyof typeof TRIGGER_LABELS] ?? row.triggerType}
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <Pill tone={automationStatusPillTone(row.status as AutomationStatus)}>
                      {automationStatusLabel(row.status as AutomationStatus)}
                    </Pill>
                  </DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{row.activeCount}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{row.waitingCount}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{row.completedCount}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{row.failedCount}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{row.totalEnrollments}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Card>
        <SectionHead title="By template" subtitle="Delivery and engagement per template" />
        {templates.length === 0 ? (
          <p className="text-sm text-slate-500">No sends recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                  <th className="px-2 py-2">Template</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2 text-right">Sent</th>
                  <th className="px-2 py-2 text-right">Delivered</th>
                  <th className="px-2 py-2 text-right">Pending</th>
                  <th className="px-2 py-2 text-right">Suppressed</th>
                  <th className="px-2 py-2 text-right">Opened</th>
                  <th className="px-2 py-2 text-right">Clicked</th>
                  <th className="px-2 py-2 text-right">Bounced</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((row) => (
                  <tr
                    key={`${row.templateId ?? 'none'}-${row.templateName}-${row.classification}`}
                    className="border-b border-slate-50"
                  >
                    <td className="px-2 py-2.5 font-semibold text-slate-800">{row.templateName}</td>
                    <td className="px-2 py-2.5">
                      <Pill tone={row.classification === 'marketing' ? 'brand' : 'neutral'}>
                        {row.classification === 'marketing' ? 'Marketing' : 'Transactional'}
                      </Pill>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.sentCount}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.deliveredCount}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.pendingCount}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.suppressedCount}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {row.classification === 'marketing' ? (
                        <>
                          {row.openedCount}
                          <span className="ml-1 text-xs text-slate-400">({formatRate(row.openRate)})</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {row.clickedCount}
                      <span className="ml-1 text-xs text-slate-400">({formatRate(row.clickRate)})</span>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.bouncedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <SectionHead title="Recent failures & skips" subtitle="Last 20 blocked or failed sends" />
        {recentIssues.length === 0 ? (
          <p className="text-sm text-slate-500">No failed or skipped sends.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentIssues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={issue.status === 'failed' ? 'danger' : 'warn'}>
                    {issue.status === 'failed' ? 'Failed' : 'Skipped'}
                  </Pill>
                  <span className="text-sm font-semibold text-slate-800">
                    {issue.subjectRendered || issue.templateName}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {issue.recipientEmail}
                  {issue.skipReason ? ` · ${issue.skipReason}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
