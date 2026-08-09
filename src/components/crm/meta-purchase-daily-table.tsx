'use client';

import type { MetaPurchaseDailyRow } from '@/types/crm';

type MetaPurchaseDailyTableProps = {
  rows: MetaPurchaseDailyRow[];
  windowDays: number;
  total: number;
  error?: string | null;
};

export function MetaPurchaseDailyTable({ rows, windowDays, total, error }: MetaPurchaseDailyTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500">
        Meta-influenced purchases by IST day (last {windowDays}d). Total: {total.toLocaleString()}. CAPI sent = server
        Purchase events recorded in outbox.
      </p>
      {error ? <p className="text-xs font-medium text-danger-press">{error}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2">Day (IST)</th>
              <th className="px-3 py-2">Purchases</th>
              <th className="px-3 py-2">CAPI sent</th>
              <th className="px-3 py-2">CAPI pending/failed</th>
              <th className="px-3 py-2">Not in outbox</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  No meta-influenced purchases in this window.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.day} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.day}</td>
                  <td className="px-3 py-2 tabular-nums">{row.purchases}</td>
                  <td className="px-3 py-2 tabular-nums">{row.capiSent}</td>
                  <td className="px-3 py-2 tabular-nums">{row.capiPendingOrFailed}</td>
                  <td className="px-3 py-2 tabular-nums">{row.capiNotRecorded}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
