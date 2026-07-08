import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type CrmReportManifestEntry = {
  id: string;
  title: string;
  fileName: string;
  generatedOn: string;
  batchLabel?: string;
  dateRangeLabel?: string;
};

type ReportManifest = {
  reports: CrmReportManifestEntry[];
};

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const MANIFEST_PATH = path.join(REPORTS_DIR, 'manifest.json');

function isSafeHtmlFileName(fileName: string): boolean {
  return /^[a-zA-Z0-9._-]+\.html$/.test(fileName);
}

export function reportFilePath(fileName: string): string {
  if (!isSafeHtmlFileName(fileName)) {
    throw new Error('Invalid report file name.');
  }
  return path.join(REPORTS_DIR, fileName);
}

export async function loadReportManifest(): Promise<CrmReportManifestEntry[]> {
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Partial<ReportManifest>;
  const reports = Array.isArray(parsed.reports) ? parsed.reports : [];
  return reports
    .filter((report): report is CrmReportManifestEntry =>
      Boolean(
        report &&
        typeof report.id === 'string' &&
        typeof report.title === 'string' &&
        typeof report.fileName === 'string' &&
        typeof report.generatedOn === 'string'
      )
    )
    .filter((report) => isSafeHtmlFileName(report.fileName));
}

export async function getReportById(reportId: string): Promise<CrmReportManifestEntry | null> {
  const reports = await loadReportManifest();
  return reports.find((report) => report.id === reportId) ?? null;
}
