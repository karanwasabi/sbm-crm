'use client';

import Link from 'next/link';
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
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { formatDateTimeIST } from '@/lib/ist-datetime';
import { formatPromoDiscount, promoDiscountTypeLabel } from '@/lib/promo-discount';
import type { PromoListItem } from '@/utils/api';

type PromosListViewProps = {
  items: PromoListItem[];
};

function discountLabel(item: PromoListItem): string {
  return formatPromoDiscount(item.discount_type, item.discount_value ?? null);
}

function statusTone(status: PromoListItem['status']) {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'scheduled':
      return 'warn' as const;
    default:
      return 'neutral' as const;
  }
}

export function PromosListView({ items }: PromosListViewProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 px-5 py-4">
        <SectionHead title="Promo codes" subtitle="Discount terms, usage, and audit history" />
      </div>
      <DataTable>
        <DataTableHead>
          <DataTableHeaderCell>Code</DataTableHeaderCell>
          <DataTableHeaderCell>Offer</DataTableHeaderCell>
          <DataTableHeaderCell>Window (IST)</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell>Applied</DataTableHeaderCell>
          <DataTableHeaderCell>Redeemed</DataTableHeaderCell>
          <DataTableHeaderCell className="text-right"> </DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {items.length === 0 ? (
            <DataTableRow>
              <DataTableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                No promo codes yet.
              </DataTableCell>
            </DataTableRow>
          ) : (
            items.map((item) => (
              <DataTableRow key={item.id}>
                <DataTableCell>
                  <Link href={`/promos/${item.id}`} className="font-semibold text-brand no-underline hover:underline">
                    {item.code}
                  </Link>
                </DataTableCell>
                <DataTableCell>
                  <div>{discountLabel(item)}</div>
                  {item.discount_type ? (
                    <div className="text-[11px] text-slate-400">{promoDiscountTypeLabel(item.discount_type)}</div>
                  ) : null}
                </DataTableCell>
                <DataTableCell className="text-xs text-slate-600">
                  <div>{formatDateTimeIST(item.starts_at)}</div>
                  <div className="text-slate-400">
                    {item.ends_at ? `→ ${formatDateTimeIST(item.ends_at)}` : '→ Open-ended'}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <Pill tone={statusTone(item.status)}>{item.status}</Pill>
                </DataTableCell>
                <DataTableCell>{item.applied_count}</DataTableCell>
                <DataTableCell>{item.redeemed_count}</DataTableCell>
                <DataTableCell className="text-right">
                  <Link href={`/promos/${item.id}`}>
                    <Button variant="light" size="sm">
                      Edit
                    </Button>
                  </Link>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
