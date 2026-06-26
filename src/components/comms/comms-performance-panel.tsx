import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
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
  const { totals, templates, recentIssues, webhookUrl, webhookEnabled } = analytics;

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
          Subscribe to email.sent, email.delivered, email.bounced, email.opened, and email.clicked in the Resend
          dashboard.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Sent" value={totals.sent} />
        <StatCard label="Delivered" value={totals.delivered} />
        <StatCard label="Opened" value={totals.opened} hint="Marketing only" />
        <StatCard label="Clicked" value={totals.clicked} />
        <StatCard label="Bounced" value={totals.bounced} />
        <StatCard label="Failed / skipped" value={totals.failed + totals.skipped} />
      </div>

      <Card>
        <SectionHead title="By template" subtitle="Delivery and engagement per template" />
        {templates.length === 0 ? (
          <p className="text-sm text-slate-500">No sends recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                  <th className="px-2 py-2">Template</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2 text-right">Sent</th>
                  <th className="px-2 py-2 text-right">Delivered</th>
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
