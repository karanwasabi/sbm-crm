import type { RenewalRow } from '@/types/crm';
import { formatInrFromPaise } from '@/lib/money';
import {
  accessStateLabel,
  bucketLabel,
  membershipProductLabel,
  renewalMemberStatusId,
  RENEWAL_STATUS_FILTERS,
} from '@/lib/renewal-display';

const TEXT_NUMFMT = '@';
const DATE_NUMFMT = 'yyyy-mm-dd hh:mm';

type ExportColumn = {
  header: string;
  key: string;
  width: number;
  kind: 'text' | 'date';
  value: (row: RenewalRow) => string | Date;
};

function parseExportDate(iso?: string | null): Date | string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed;
}

function statusLabel(row: RenewalRow): string {
  const status = renewalMemberStatusId(row);
  return RENEWAL_STATUS_FILTERS.find((option) => option.id === status)?.label ?? status;
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Member', key: 'member', width: 24, kind: 'text', value: (row) => row.memberName },
  { header: 'Status', key: 'status', width: 14, kind: 'text', value: statusLabel },
  { header: 'Product', key: 'product', width: 20, kind: 'text', value: membershipProductLabel },
  { header: 'Program', key: 'program', width: 22, kind: 'text', value: (row) => row.programName },
  { header: 'Cohort', key: 'cohort', width: 20, kind: 'text', value: (row) => row.cohortName },
  {
    header: 'Expires',
    key: 'expires',
    width: 20,
    kind: 'date',
    value: (row) => parseExportDate(row.accessUntil),
  },
  {
    header: 'Days until expiry',
    key: 'daysUntilExpiry',
    width: 16,
    kind: 'text',
    value: (row) => (row.daysUntilAccessEnd == null ? '' : String(row.daysUntilAccessEnd)),
  },
  {
    header: 'Access',
    key: 'access',
    width: 12,
    kind: 'text',
    value: (row) => accessStateLabel(row.accessState),
  },
  {
    header: 'Retention',
    key: 'retention',
    width: 16,
    kind: 'text',
    value: (row) => bucketLabel(row.retentionBucket),
  },
  {
    header: 'Cancelling',
    key: 'cancelling',
    width: 12,
    kind: 'text',
    value: (row) => (row.cancelAtPeriodEnd ? 'Yes' : 'No'),
  },
  {
    header: 'Subscription',
    key: 'subscription',
    width: 16,
    kind: 'text',
    value: (row) => row.subscriptionStatus,
  },
  {
    header: 'Monthly',
    key: 'monthly',
    width: 14,
    kind: 'text',
    value: (row) => formatInrFromPaise(row.monthlyTotalPaise),
  },
  {
    header: 'Lifetime paid',
    key: 'lifetimePaid',
    width: 16,
    kind: 'text',
    value: (row) => formatInrFromPaise(row.lifetimePaidPaise),
  },
  {
    header: 'Payment method',
    key: 'paymentMethod',
    width: 22,
    kind: 'text',
    value: (row) => row.paymentMethodSummary ?? '',
  },
];

function exportFilename(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `sbm-renewals-export-${date}-${time}.xlsx`;
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

export async function downloadRenewalsXlsx(rows: RenewalRow[]): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SBM CRM';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Renewals', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = EXPORT_COLUMNS.map((column) => ({
    header: column.header,
    key: column.key,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (const row of rows) {
    const values: Record<string, string | Date> = {};
    for (const column of EXPORT_COLUMNS) {
      values[column.key] = column.value(row);
    }
    sheet.addRow(values);
  }

  applyColumnFormats(sheet);

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: EXPORT_COLUMNS.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, exportFilename());
}
