import type { Lead } from '@/types/crm';

const CSV_COLUMNS = [
  { header: 'First Name', value: (lead: Lead) => lead.firstName },
  { header: 'Last Name', value: (lead: Lead) => lead.lastName },
  { header: 'Email', value: (lead: Lead) => lead.email },
  { header: 'Phone', value: (lead: Lead) => lead.phone },
  { header: 'Stage', value: (lead: Lead) => lead.stage },
  { header: 'Marketing Status', value: (lead: Lead) => lead.marketingContactStatus },
  { header: 'Program', value: (lead: Lead) => lead.interest },
  { header: 'Batch', value: (lead: Lead) => lead.batch },
  { header: 'Geography', value: (lead: Lead) => lead.location },
  { header: 'Source', value: (lead: Lead) => lead.sourceLabel },
  { header: 'Tags', value: (lead: Lead) => lead.tags.join('; ') },
  { header: 'Medium', value: (lead: Lead) => lead.medium },
  { header: 'Added', value: (lead: Lead) => lead.addedAt },
  { header: 'Updated', value: (lead: Lead) => lead.updatedAt },
] as const;

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(leads: Lead[]): string {
  const headerRow = CSV_COLUMNS.map((column) => escapeCsvField(column.header)).join(',');
  const dataRows = leads.map((lead) =>
    CSV_COLUMNS.map((column) => escapeCsvField(String(column.value(lead) ?? ''))).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

function exportFilename(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `sbm-leads-export-${date}-${time}.csv`;
}

export function downloadLeadsCsv(leads: Lead[]): void {
  const csv = buildCsv(leads);
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = exportFilename();
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
