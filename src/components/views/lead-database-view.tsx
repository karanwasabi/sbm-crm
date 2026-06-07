'use client';

import { Download, Send, Upload } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FilterBar } from '@/components/crm/filter-bar';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { StagePill } from '@/components/ui/stage-pill';
import { MOCK_ACTIVE_FILTERS, MOCK_LEADS } from '@/lib/mock/leads';

export function LeadDatabaseView() {
  const [activeStage, setActiveStage] = useState('all');

  const filtered = useMemo(
    () => (activeStage === 'all' ? MOCK_LEADS : MOCK_LEADS.filter((l) => l.stage === activeStage)),
    [activeStage]
  );

  return (
    <CrmPageLayout>
      <FilterBar activeStage={activeStage} onStageChange={setActiveStage} activeFilters={MOCK_ACTIVE_FILTERS} />

      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[13px] font-semibold text-slate-600">
          Showing <strong className="text-slate-800">{filtered.length}</strong> of {MOCK_LEADS.length} contacts ·{' '}
          <span className="ml-1.5">0 selected</span>
        </p>
        <div className="flex-1" />
        <Button variant="light" size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />}>
          Import CSV (Zoho)
        </Button>
        <Button variant="light" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
          Lookalike export (Meta)
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>
          Message segment
        </Button>
      </div>

      <Card padding="none">
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell className="w-9 pl-4.5">
              <input type="checkbox" className="h-3.5 w-3.5 accent-brand" />
            </DataTableHeaderCell>
            {['Name', 'Stage', 'Program', 'Batch', 'Geography', 'Tags', 'Added', ''].map((h) => (
              <DataTableHeaderCell key={h}>{h}</DataTableHeaderCell>
            ))}
          </DataTableHead>
          <DataTableBody>
            {filtered.map((lead) => (
              <DataTableRow key={lead.id}>
                <DataTableCell className="pl-4.5">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-brand" />
                </DataTableCell>
                <DataTableCell>
                  <div className="font-semibold text-slate-800">{lead.name}</div>
                  <div className="text-[11px] text-slate-500">{lead.email}</div>
                  {lead.dedup && <span className="text-[10px] font-bold text-danger-press">Possible duplicate</span>}
                  {!lead.enriched && <span className="text-[10px] font-bold text-motivation">Needs enrichment</span>}
                </DataTableCell>
                <DataTableCell>
                  <StagePill stage={lead.stage} />
                </DataTableCell>
                <DataTableCell className="font-semibold">{lead.interest}</DataTableCell>
                <DataTableCell>{lead.batch}</DataTableCell>
                <DataTableCell>{lead.location}</DataTableCell>
                <DataTableCell>
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag) => (
                      <Pill key={tag} tone="brand">
                        {tag}
                      </Pill>
                    ))}
                  </div>
                </DataTableCell>
                <DataTableCell>{lead.addedAt}</DataTableCell>
                <DataTableCell className="text-right">
                  <Link href={`/customers/${lead.id}`}>
                    <Button variant="light" size="sm">
                      View
                    </Button>
                  </Link>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </Card>
    </CrmPageLayout>
  );
}
