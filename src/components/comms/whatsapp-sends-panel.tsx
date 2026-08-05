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
          {hasMore ? (
            <div className="mt-4 flex justify-center">
              <Button variant="light" loading={loading} loadingLabel="Loading…" onClick={() => void loadMore()}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
