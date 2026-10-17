'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { cn } from '@/lib/cn';
import {
  buildCommsTemplatesHref,
  nextCommsTemplateSort,
  parseCommsTemplateSort,
  type CommsTemplateFilters,
  type CommsTemplateSortColumn,
} from '@/lib/comms-templates-query';
import {
  whatsAppTemplateCategoryLabel,
  whatsAppTemplateStatusLabel,
  whatsAppTemplateStatusTone,
} from '@/lib/whatsapp-template-types';
import type { WhatsAppTemplate } from '@/utils/api';

type WhatsAppTemplatesTableProps = {
  templates: WhatsAppTemplate[];
  filters: CommsTemplateFilters;
  templateHref: (templateId: string) => string;
};

function formatTemplateDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SortableHeader({
  label,
  column,
  filters,
}: {
  label: string;
  column: CommsTemplateSortColumn;
  filters: CommsTemplateFilters;
}) {
  const active = parseCommsTemplateSort(filters.sort);
  const isActive = active.column === column;
  const Icon = !isActive ? ArrowUpDown : active.order === 'asc' ? ArrowUp : ArrowDown;
  const href = buildCommsTemplatesHref(filters, { sort: nextCommsTemplateSort(filters.sort, column) });

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 no-underline transition-colors hover:text-brand',
        isActive ? 'text-brand' : 'text-slate-500'
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </Link>
  );
}

export function WhatsAppTemplatesTable({ templates, filters, templateHref }: WhatsAppTemplatesTableProps) {
  const router = useRouter();

  return (
    <Card padding="none" className="overflow-hidden">
      <DataTable>
        <DataTableHead>
          <DataTableHeaderCell>
            <SortableHeader label="Name" column="name" filters={filters} />
          </DataTableHeaderCell>
          <DataTableHeaderCell>Category</DataTableHeaderCell>
          <DataTableHeaderCell>Language</DataTableHeaderCell>
          <DataTableHeaderCell>Purpose</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell>
            <SortableHeader label="Created" column="created_at" filters={filters} />
          </DataTableHeaderCell>
          <DataTableHeaderCell>
            <SortableHeader label="Edited" column="updated_at" filters={filters} />
          </DataTableHeaderCell>
        </DataTableHead>
        <DataTableBody>
          {templates.map((template) => {
            const href = templateHref(template.id);
            return (
              <DataTableRow key={template.id} className="hover:bg-canvas-cool/60" onClick={() => router.push(href)}>
                <DataTableCell className="max-w-[18rem]">
                  <Link
                    href={href}
                    className="block truncate font-semibold text-slate-800 no-underline hover:text-brand"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {template.name}
                  </Link>
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap text-slate-600">
                  {whatsAppTemplateCategoryLabel(template.category)}
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap text-slate-600">{template.language}</DataTableCell>
                <DataTableCell>
                  <Pill tone="neutral">{template.purpose === 'broadcast' ? 'Broadcast' : 'Individual'}</Pill>
                </DataTableCell>
                <DataTableCell>
                  <Pill tone={whatsAppTemplateStatusTone(template.status)}>
                    {whatsAppTemplateStatusLabel(template.status)}
                  </Pill>
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap text-slate-500">
                  {formatTemplateDate(template.createdAt)}
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap text-slate-500">
                  {formatTemplateDate(template.updatedAt)}
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
