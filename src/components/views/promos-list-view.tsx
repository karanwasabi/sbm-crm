'use client';

import { useMemo } from 'react';
import { CrmTableLink } from '@/components/layout/crm/crm-table-link';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import {
  PromoOfferDisplay,
  PromoUsageCountCell,
  PromoUsageCountHeader,
  PromoWindowDisplay,
} from '@/components/promos/promo-display-cells';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { cn } from '@/lib/cn';
import { partitionPromoListItems } from '@/lib/promo-list';
import type { PromoListItem } from '@/utils/api';

type PromosListViewProps = {
  items: PromoListItem[];
};

function promoCount(value: number | null | undefined): number {
  return value ?? 0;
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

function PromoListTableColGroup() {
  return (
    <colgroup>
      <col style={{ width: '11%' }} />
      <col style={{ width: '13%' }} />
      <col style={{ width: '30%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '9%' }} />
      <col style={{ width: '18%' }} />
    </colgroup>
  );
}

function PromoListTableHead() {
  return (
    <DataTableHead>
      <DataTableHeaderCell>Code</DataTableHeaderCell>
      <DataTableHeaderCell>Offer</DataTableHeaderCell>
      <DataTableHeaderCell>Window (IST)</DataTableHeaderCell>
      <DataTableHeaderCell>Status</DataTableHeaderCell>
      <PromoUsageCountHeader>Applied (term)</PromoUsageCountHeader>
      <PromoUsageCountHeader>Redeemed (term)</PromoUsageCountHeader>
      <DataTableHeaderCell className="text-right"> </DataTableHeaderCell>
    </DataTableHead>
  );
}

function PromoListTable({ items, emptyMessage }: { items: PromoListItem[]; emptyMessage: string }) {
  return (
    <DataTable tableClassName="table-fixed">
      <PromoListTableColGroup />
      <PromoListTableHead />
      <DataTableBody>
        {items.length === 0 ? (
          <DataTableRow>
            <DataTableCell colSpan={7} className="py-6 text-center text-sm text-slate-500">
              {emptyMessage}
            </DataTableCell>
          </DataTableRow>
        ) : (
          items.map((item) => (
            <DataTableRow key={item.id}>
              <DataTableCell>
                <CrmTableLink
                  href={`/promos/${item.id}`}
                  className="font-semibold text-brand no-underline hover:underline"
                >
                  {item.code}
                </CrmTableLink>
              </DataTableCell>
              <DataTableCell>
                <PromoOfferDisplay discountType={item.discount_type} discountValue={item.discount_value} />
              </DataTableCell>
              <DataTableCell>
                <PromoWindowDisplay startsAt={item.starts_at} endsAt={item.ends_at} />
              </DataTableCell>
              <DataTableCell>
                <Pill tone={statusTone(item.status)}>{item.status}</Pill>
              </DataTableCell>
              <PromoUsageCountCell>{promoCount(item.applied_count)}</PromoUsageCountCell>
              <PromoUsageCountCell>{promoCount(item.redeemed_count)}</PromoUsageCountCell>
              <DataTableCell className="text-right">
                <CrmTableLink
                  href={`/promos/${item.id}`}
                  className="inline-flex items-center justify-center rounded-2xl border-b-[3px] border-b-slate-200 bg-white px-4 py-2.25 text-xs font-semibold text-brand no-underline shadow-sm hover:bg-slate-50"
                >
                  Edit
                </CrmTableLink>
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );
}

type PromoListSectionVariant = 'active' | 'upcoming' | 'inactive';

const sectionHeaderStyles: Record<PromoListSectionVariant, string> = {
  active: 'border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 via-white to-white',
  upcoming: 'border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 via-white to-white',
  inactive: 'border-l-4 border-slate-400 bg-gradient-to-r from-slate-100 via-white to-white',
};

function PromoListSection({
  title,
  subtitle,
  items,
  emptyMessage,
  variant,
}: {
  title: string;
  subtitle: string;
  items: PromoListItem[];
  emptyMessage: string;
  variant: PromoListSectionVariant;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className={cn('px-5 pt-3 pb-2.5', sectionHeaderStyles[variant])}>
        <SectionHead title={title} subtitle={subtitle} className="mb-1.5" />
      </div>
      <PromoListTable items={items} emptyMessage={emptyMessage} />
    </Card>
  );
}

export function PromosListView({ items }: PromosListViewProps) {
  const sections = useMemo(() => partitionPromoListItems(items), [items]);

  if (items.length === 0) {
    return (
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHead title="Promo codes" subtitle="Discount terms, usage, and audit history" />
        </div>
        <div className="py-8 text-center text-sm text-slate-500">No promo codes yet.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <PromoListSection
        title="Active"
        subtitle="Currently running promo codes."
        items={sections.active}
        emptyMessage="No active promo codes."
        variant="active"
      />
      <PromoListSection
        title="Upcoming"
        subtitle="Scheduled promos with a future start date."
        items={sections.upcoming}
        emptyMessage="No upcoming promo codes."
        variant="upcoming"
      />
      <PromoListSection
        title="Inactive"
        subtitle="Ended or deactivated promo codes."
        items={sections.inactive}
        emptyMessage="No inactive promo codes."
        variant="inactive"
      />
    </div>
  );
}
