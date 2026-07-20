import type { CohortMember } from '@/types/crm';

const TEXT_NUMFMT = '@';
const DATE_NUMFMT = 'yyyy-mm-dd hh:mm';

type ExportColumn = {
  header: string;
  key: string;
  width: number;
  kind: 'text' | 'date';
  value: (member: CohortMember) => string | Date;
};

function memberStatusLabel(member: CohortMember): string {
  if (member.subscriptionState === 'transferred') return 'Transferred';
  if (member.subscriptionState === 'lapsed') return 'Lapsed';
  if (member.memberKind === 'returnee') return 'Returnee';
  if (member.memberKind === 'renewal') return 'Renewal';
  if (member.lifecycleStage?.trim() === 'newbie') return 'Newbie';
  return 'Member';
}

function countryDisplay(member: CohortMember): string {
  return member.countryName.trim() || member.countryCode.trim();
}

function timezoneDisplay(member: CohortMember): string {
  return member.timezoneLabel.trim() || member.timezoneId.trim();
}

function parseExportDate(iso: string): Date | string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed;
}

function formatMetric(value: number | null | undefined): string {
  if (value == null || value <= 0) return '';
  return value.toFixed(1);
}

const BASE_EXPORT_COLUMNS: ExportColumn[] = [
  { header: 'Name', key: 'name', width: 24, kind: 'text', value: (m) => m.memberName },
  { header: 'Email', key: 'email', width: 28, kind: 'text', value: (m) => m.email },
  { header: 'WhatsApp', key: 'whatsapp', width: 18, kind: 'text', value: (m) => m.whatsapp },
  { header: 'City', key: 'city', width: 18, kind: 'text', value: (m) => m.city },
  { header: 'Country', key: 'country', width: 18, kind: 'text', value: countryDisplay },
  { header: 'Timezone', key: 'timezone', width: 28, kind: 'text', value: timezoneDisplay },
  { header: 'Status', key: 'status', width: 14, kind: 'text', value: memberStatusLabel },
  { header: 'Coach', key: 'coach', width: 20, kind: 'text', value: (m) => m.coachName?.trim() ?? '' },
  { header: 'Enrolled', key: 'enrolledAt', width: 20, kind: 'date', value: (m) => parseExportDate(m.enrolledAt) },
  {
    header: 'Onboarding',
    key: 'onboarding',
    width: 14,
    kind: 'text',
    value: (m) => (m.onboardingCompletedAt ? 'Complete' : 'Incomplete'),
  },
  {
    header: 'Subscription',
    key: 'subscription',
    width: 14,
    kind: 'text',
    value: (m) => m.subscriptionState,
  },
];

const BODY_METRIC_EXPORT_COLUMNS: ExportColumn[] = [
  {
    header: 'Initial weight (kg)',
    key: 'initialWeightKg',
    width: 18,
    kind: 'text',
    value: (m) => formatMetric(m.initialWeightKg),
  },
  {
    header: 'Height (cm)',
    key: 'heightCm',
    width: 14,
    kind: 'text',
    value: (m) => formatMetric(m.heightCm),
  },
  {
    header: 'BMI',
    key: 'bmi',
    width: 10,
    kind: 'text',
    value: (m) => formatMetric(m.bmi),
  },
];

function exportColumns(includeBodyMetrics: boolean): ExportColumn[] {
  if (!includeBodyMetrics) {
    return BASE_EXPORT_COLUMNS;
  }
  return [...BASE_EXPORT_COLUMNS, ...BODY_METRIC_EXPORT_COLUMNS];
}

function exportFilename(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `sbm-cohort-members-export-${date}-${time}.xlsx`;
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

function applyColumnFormats(sheet: import('exceljs').Worksheet, columns: ExportColumn[]): void {
  columns.forEach((column, index) => {
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

export async function downloadCohortMembersXlsx(
  members: CohortMember[],
  options?: { includeBodyMetrics?: boolean }
): Promise<void> {
  const columns = exportColumns(Boolean(options?.includeBodyMetrics));
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SBM CRM';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Members', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (const member of members) {
    const row: Record<string, string | Date> = {};
    for (const column of columns) {
      row[column.key] = column.value(member);
    }
    sheet.addRow(row);
  }

  applyColumnFormats(sheet, columns);

  if (members.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: members.length + 1, column: columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, exportFilename());
}
