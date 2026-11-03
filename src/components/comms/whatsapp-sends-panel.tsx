'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHead } from '@/components/ui/section-head';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { ResponsiveList } from '@/components/crm/responsive-list';
import { Pill } from '@/components/ui/pill';
import { formatCommsWhen, whatsAppSendStatusLabel, whatsAppSendStatusTone } from '@/lib/comms-display';
import { listWhatsAppSendsAction } from '@/app/(crm)/communications/actions';
import type { WhatsAppSend } from '@/utils/api';

type WhatsAppSendsPanelProps = {
  initialSends: WhatsAppSend[];
  pageSize?: number;
};

export function WhatsAppSendsPanel({ initialSends, pageSize = 50 }: WhatsAppSendsPanelProps) {
  const [sends, setSends] = useState(initialSends);
  const [offset, setOffset] = useState(initialSends.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialSends.length >= pageSize);

  const loadMore = async () => {
    setLoading(true);
    try {
      const { sends: next } = await listWhatsAppSendsAction({ limit: pageSize, offset });
      setSends((current) => [...current, ...next]);
      setOffset((current) => current + next.length);
      setHasMore(next.length >= pageSize);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <SectionHead title="All sends" subtitle="Every WhatsApp send recorded by the CRM" />
      {sends.length === 0 ? (
        <p className="text-sm text-slate-500">No sends recorded yet.</p>
      ) : (
        <>
          <ResponsiveList
            mobile={
              <div className="flex flex-col gap-2">
                {sends.map((send) => (
                  <div key={send.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800">{send.recipientPhone}</p>
                      <Pill tone={whatsAppSendStatusTone(send.status)}>{whatsAppSendStatusLabel(send.status)}</Pill>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-600">{send.templateName || '—'}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatCommsWhen(send.sentAt ?? send.createdAt)}</p>
                    {send.skipReason ? <p className="mt-1 text-[11px] text-slate-500">{send.skipReason}</p> : null}
                    <div className="mt-2">
                      {send.leadId ? (
                        <Link
                          href={`/customers/${send.leadId}`}
                          className="text-xs font-semibold text-brand hover:underline"
                        >
                          View lead
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No lead</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            }
            desktop={
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderCell>When</DataTableHeaderCell>
                  <DataTableHeaderCell>Phone</DataTableHeaderCell>
                  <DataTableHeaderCell>Template</DataTableHeaderCell>
                  <DataTableHeaderCell>Lead</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                </DataTableHead>
                <DataTableBody>
                  {sends.map((send) => (
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
                        {send.leadId ? (
                          <Link
                            href={`/customers/${send.leadId}`}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            View lead
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <Pill tone={whatsAppSendStatusTone(send.status)}>{whatsAppSendStatusLabel(send.status)}</Pill>
                        {send.skipReason ? <p className="mt-1 text-[11px] text-slate-500">{send.skipReason}</p> : null}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            }
          />
          {hasMore ? (
            <div className="mt-4 flex justify-center">
              <Button
                variant="light"
                className="min-h-11"
                loading={loading}
                loadingLabel="Loading…"
                onClick={() => void loadMore()}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
