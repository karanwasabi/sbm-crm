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
import { ResponsiveList } from '@/components/crm/responsive-list';
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
  if (items.length === 0) {
    return <p className="px-5 py-6 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ResponsiveList
      mobile={
        <div className="flex flex-col gap-2 px-3 pb-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <CrmTableLink
                  href={`/promos/${item.id}`}
                  className="font-semibold text-brand no-underline hover:underline"
                >
                  {item.code}
                </CrmTableLink>
                <Pill tone={statusTone(item.status)}>{item.status}</Pill>
              </div>
              <div className="mt-2 text-[12px] text-slate-600">
                <PromoOfferDisplay discountType={item.discount_type} discountValue={item.discount_value} />
              </div>
              <div className="mt-1 text-[12px] text-slate-500">
                <PromoWindowDisplay startsAt={item.starts_at} endsAt={item.ends_at} />
              </div>
              <p className="mt-2 text-[12px] text-slate-500">
                Applied {promoCount(item.applied_count)} · Redeemed {promoCount(item.redeemed_count)}
              </p>
              <div className="mt-3">
                <CrmTableLink
                  href={`/promos/${item.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border-b-[3px] border-b-slate-200 bg-white px-4 py-2.25 text-xs font-semibold text-brand no-underline shadow-sm hover:bg-slate-50"
                >
                  Edit
                </CrmTableLink>
              </div>
            </div>
          ))}
        </div>
      }
      desktop={
        <DataTable tableClassName="table-fixed">
          <PromoListTableColGroup />
          <PromoListTableHead />
          <DataTableBody>
            {items.map((item) => (
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
            ))}
          </DataTableBody>
        </DataTable>
      }
    />
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
