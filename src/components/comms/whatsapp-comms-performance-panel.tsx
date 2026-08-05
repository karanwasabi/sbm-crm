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
import { formatCommsWhen, whatsAppSendStatusLabel, whatsAppSendStatusTone } from '@/lib/comms-display';
import type { WhatsAppCommsAnalytics } from '@/utils/api';

type WhatsAppCommsPerformancePanelProps = {
  analytics: WhatsAppCommsAnalytics;
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

export function WhatsAppCommsPerformancePanel({ analytics }: WhatsAppCommsPerformancePanelProps) {
  const { totals, templates, recentSends, recentIssues, webhookUrl, webhookEnabled } = analytics;

  return (
    <div className="flex flex-col gap-4">
      <Card padding="sm" className="p-4">
        <SectionHead
          title="Convonite webhooks"
          subtitle={
            webhookEnabled
              ? 'Webhook key verification is configured'
              : 'Set CONVONITE_WEBHOOK_KEY on the backend to match msg_status_listener'
          }
        />
        <code className="block rounded-xl bg-slate-50 px-3 py-2 text-xs break-all text-slate-700">{webhookUrl}</code>
        <p className="mt-2 text-xs text-slate-500">
          Message status updates (sent, delivered, read, failed) are posted to this URL. Delivery reconcile runs in the
          comms worker if webhooks lag.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Queued" value={totals.queued} />
        <StatCard label="Sent" value={totals.sent} />
        <StatCard label="Delivered" value={totals.delivered} />
        <StatCard label="Read" value={totals.read} />
        <StatCard label="Failed" value={totals.failed} />
        <StatCard label="Rejected" value={totals.rejected} />
        <StatCard label="Skipped" value={totals.skipped} />
      </div>

      <Card>
        <SectionHead title="By template" subtitle="Send volume and outcomes per template" />
        {templates.length === 0 ? (
          <p className="text-sm text-slate-500">No sends recorded yet.</p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>Template</DataTableHeaderCell>
              <DataTableHeaderCell>Category</DataTableHeaderCell>
              <DataTableHeaderCell>Sent</DataTableHeaderCell>
              <DataTableHeaderCell>Delivered</DataTableHeaderCell>
              <DataTableHeaderCell>Read</DataTableHeaderCell>
              <DataTableHeaderCell>Failed</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {templates.map((row) => (
                <DataTableRow key={row.templateId}>
                  <DataTableCell>
                    <span className="text-sm font-medium text-slate-800">{row.templateName}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Pill tone="neutral">{row.category}</Pill>
                  </DataTableCell>
                  <DataTableCell>{row.sentCount.toLocaleString('en-IN')}</DataTableCell>
                  <DataTableCell>{row.deliveredCount.toLocaleString('en-IN')}</DataTableCell>
                  <DataTableCell>{row.readCount.toLocaleString('en-IN')}</DataTableCell>
                  <DataTableCell>{row.failedCount.toLocaleString('en-IN')}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Card>
        <SectionHead title="Recent sends" subtitle="Last 30 WhatsApp sends from the CRM" />
        {recentSends.length === 0 ? (
          <p className="text-sm text-slate-500">No sends recorded yet.</p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>When</DataTableHeaderCell>
              <DataTableHeaderCell>Phone</DataTableHeaderCell>
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
                    <span className="text-sm font-medium text-slate-800">{send.recipientPhone}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs font-medium text-slate-600">{send.templateName || '—'}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Pill tone={whatsAppSendStatusTone(send.status)}>{whatsAppSendStatusLabel(send.status)}</Pill>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Card>
        <SectionHead title="Recent failures & skips" subtitle="Last 20 issues" />
        {recentIssues.length === 0 ? (
          <p className="text-sm text-slate-500">No failed or skipped sends.</p>
        ) : (
          <DataTable>
            <DataTableHead>
              <DataTableHeaderCell>When</DataTableHeaderCell>
              <DataTableHeaderCell>Phone</DataTableHeaderCell>
              <DataTableHeaderCell>Template</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
            </DataTableHead>
            <DataTableBody>
              {recentIssues.map((send) => (
                <DataTableRow key={send.id}>
                  <DataTableCell>
                    <span className="text-xs text-slate-600">{formatCommsWhen(send.sentAt ?? send.createdAt)}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-sm font-medium text-slate-800">{send.recipientPhone}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-xs font-medium text-slate-600">{send.templateName || '—'}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <Pill tone={whatsAppSendStatusTone(send.status)}>{whatsAppSendStatusLabel(send.status)}</Pill>
                    {send.skipReason ? <p className="mt-1 text-[11px] text-slate-500">{send.skipReason}</p> : null}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>
    </div>
  );
}
