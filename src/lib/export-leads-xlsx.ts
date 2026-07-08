import type { Lead } from '@/types/crm';
import { tagSlugToLabel } from '@/lib/lead-tags';

const TEXT_NUMFMT = '@';
const DATE_NUMFMT = 'yyyy-mm-dd hh:mm';

type ExportColumn = {
  header: string;
  key: string;
  width: number;
  kind: 'text' | 'date';
  value: (lead: Lead) => string | Date;
};

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'First Name', key: 'firstName', width: 18, kind: 'text', value: (lead) => lead.firstName },
  { header: 'Last Name', key: 'lastName', width: 18, kind: 'text', value: (lead) => lead.lastName },
  { header: 'Email', key: 'email', width: 28, kind: 'text', value: (lead) => lead.email },
  { header: 'Phone', key: 'phone', width: 18, kind: 'text', value: (lead) => lead.phone },
  { header: 'Stage', key: 'stage', width: 14, kind: 'text', value: (lead) => lead.stage },
  {
    header: 'Marketing Status',
    key: 'marketingStatus',
    width: 18,
    kind: 'text',
    value: (lead) => lead.marketingContactStatus,
  },
  { header: 'Program', key: 'program', width: 20, kind: 'text', value: (lead) => lead.interest },
  { header: 'Batch', key: 'batch', width: 16, kind: 'text', value: (lead) => lead.batch },
  { header: 'Geography', key: 'geography', width: 22, kind: 'text', value: (lead) => lead.location },
  { header: 'Source', key: 'source', width: 20, kind: 'text', value: (lead) => lead.sourceLabel },
  { header: 'Tags', key: 'tags', width: 36, kind: 'text', value: (lead) => lead.tags.map(tagSlugToLabel).join('; ') },
  { header: 'Medium', key: 'medium', width: 12, kind: 'text', value: (lead) => lead.medium },
  { header: 'Added', key: 'addedAt', width: 20, kind: 'date', value: (lead) => parseExportDate(lead.addedAt) },
  { header: 'Updated', key: 'updatedAt', width: 20, kind: 'date', value: (lead) => parseExportDate(lead.updatedAt) },
];

function parseExportDate(iso: string): Date | string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed;
}

function exportFilename(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `sbm-leads-export-${date}-${time}.xlsx`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function applyColumnFormats(sheet: import('exceljs').Worksheet): void {
  EXPORT_COLUMNS.forEach((column, index) => {
    const excelColumn = sheet.getColumn(index + 1);
    excelColumn.width = column.width;
    const numFmt = column.kind === 'date' ? DATE_NUMFMT : TEXT_NUMFMT;
    excelColumn.numFmt = numFmt;

    excelColumn.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }
      cell.numFmt = numFmt;
      if (column.kind === 'text' && cell.value != null && cell.value !== '') {
        cell.value = String(cell.value);
      }
    });
  });
}

export async function downloadLeadsXlsx(leads: Lead[]): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SBM CRM';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Leads', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = EXPORT_COLUMNS.map((column) => ({
    header: column.header,
    key: column.key,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (const lead of leads) {
    const row: Record<string, string | Date> = {};
    for (const column of EXPORT_COLUMNS) {
      row[column.key] = column.value(lead);
    }
    sheet.addRow(row);
  }

  applyColumnFormats(sheet);

  if (leads.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: leads.length + 1, column: EXPORT_COLUMNS.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, exportFilename());
}
