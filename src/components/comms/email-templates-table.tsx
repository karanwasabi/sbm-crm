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
import { ResponsiveList } from '@/components/crm/responsive-list';
import {
  CommsTemplatesSortableHeader,
  formatCommsTemplateDate,
} from '@/components/comms/comms-templates-sortable-header';
import type { CommsTemplateFilters } from '@/lib/comms-templates-query';
import type { EmailTemplate } from '@/utils/api';

type EmailTemplatesTableProps = {
  templates: EmailTemplate[];
  filters: CommsTemplateFilters;
  templateHref: (templateId: string) => string;
};

export function EmailTemplatesTable({ templates, filters, templateHref }: EmailTemplatesTableProps) {
  const router = useRouter();

  return (
    <Card padding="none" className="overflow-hidden">
      <ResponsiveList
        mobile={
          <div className="flex flex-col gap-2 p-3">
            {templates.map((template) => {
              const href = templateHref(template.id);
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => router.push(href)}
                  className="rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{template.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{template.subject || 'No subject yet'}</p>
                    </div>
                    <Pill
                      tone={
                        template.status === 'active' ? 'success' : template.status === 'archived' ? 'neutral' : 'warn'
                      }
                    >
                      {template.status === 'active'
                        ? 'Active'
                        : template.status === 'archived'
                          ? 'Archived'
                          : 'Unpublished'}
                    </Pill>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Pill tone={template.classification === 'marketing' ? 'brand' : 'neutral'}>
                      {template.classification === 'marketing' ? 'Marketing' : 'Transactional'}
                    </Pill>
                    <span className="text-[11px] text-slate-400">
                      Edited {formatCommsTemplateDate(template.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        }
        desktop={
          <DataTable tableClassName="table-fixed min-w-[720px]">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <DataTableHead>
              <DataTableHeaderCell>
                <CommsTemplatesSortableHeader label="Template" column="name" filters={filters} />
              </DataTableHeaderCell>
              <DataTableHeaderCell>Type</DataTableHeaderCell>
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
                    <DataTableCell className="align-top">
                      <Link
                        href={href}
                        className="block min-w-0 no-underline"
                        onClick={(event) => event.stopPropagation()}
                        title={[template.name, template.subject].filter(Boolean).join(' — ')}
                      >
                        <p className="truncate text-[13px] font-semibold text-slate-800 hover:text-brand">
                          {template.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          {template.subject || 'No subject yet'}
                        </p>
                      </Link>
                    </DataTableCell>
                    <DataTableCell className="align-middle whitespace-nowrap">
                      <Pill tone={template.classification === 'marketing' ? 'brand' : 'neutral'}>
                        {template.classification === 'marketing' ? 'Marketing' : 'Transactional'}
                      </Pill>
                    </DataTableCell>
                    <DataTableCell className="align-middle whitespace-nowrap">
                      <Pill
                        tone={
                          template.status === 'active' ? 'success' : template.status === 'archived' ? 'neutral' : 'warn'
                        }
                      >
                        {template.status === 'active'
                          ? 'Active'
                          : template.status === 'archived'
                            ? 'Archived'
                            : 'Unpublished'}
                      </Pill>
                    </DataTableCell>
                    <DataTableCell className="align-middle whitespace-nowrap text-slate-500">
                      {formatCommsTemplateDate(template.createdAt)}
                    </DataTableCell>
                    <DataTableCell className="align-middle whitespace-nowrap text-slate-500">
                      {formatCommsTemplateDate(template.updatedAt)}
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        }
      />
    </Card>
  );
}
