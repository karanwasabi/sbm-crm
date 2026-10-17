'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  CommsTemplatesSortableHeader,
  formatCommsTemplateDate,
} from '@/components/comms/comms-templates-sortable-header';
import type { CommsTemplateFilters } from '@/lib/comms-templates-query';
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

export function WhatsAppTemplatesTable({ templates, filters, templateHref }: WhatsAppTemplatesTableProps) {
  const router = useRouter();

  return (
    <Card padding="none" className="overflow-hidden">
      <DataTable tableClassName="min-w-[820px]">
        <DataTableHead>
          <DataTableHeaderCell>
            <CommsTemplatesSortableHeader label="Name" column="name" filters={filters} />
          </DataTableHeaderCell>
          <DataTableHeaderCell>Category</DataTableHeaderCell>
          <DataTableHeaderCell>Language</DataTableHeaderCell>
          <DataTableHeaderCell>Purpose</DataTableHeaderCell>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell>
            <CommsTemplatesSortableHeader label="Created" column="created_at" filters={filters} />
          </DataTableHeaderCell>
          <DataTableHeaderCell>
            <CommsTemplatesSortableHeader label="Edited" column="updated_at" filters={filters} />
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
                    title={template.name}
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
                  {formatCommsTemplateDate(template.createdAt)}
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap text-slate-500">
                  {formatCommsTemplateDate(template.updatedAt)}
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
