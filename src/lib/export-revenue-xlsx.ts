import { formatInrFromPaise } from '@/lib/money';
import {
  classLabel,
  planLabel,
  sourceLabel,
  type RevenueAnalytics,
  type RevenueStudentRow,
} from '@/lib/revenue-analytics';

function filenameFor(since: string, until: string): string {
  const s = since.slice(0, 10);
  const u = until.slice(0, 10);
  return `sbm-revenue-${s}-to-${u}.xlsx`;
}

async function triggerDownload(buffer: ArrayBuffer, name: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadRevenueXlsx(data: RevenueAnalytics, students: RevenueStudentRow[]): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SBM CRM';
  workbook.created = new Date();

  const split = workbook.addWorksheet('Collections by type');
  split.columns = [
    { header: 'Type', key: 'class', width: 14 },
    { header: 'Plan', key: 'plan', width: 10 },
    { header: 'Students', key: 'students', width: 12 },
    { header: 'Payments', key: 'payments', width: 12 },
    { header: 'Base', key: 'base', width: 14 },
    { header: 'GST', key: 'gst', width: 14 },
    { header: 'Discount', key: 'discount', width: 14 },
    { header: 'Stars', key: 'stars', width: 14 },
    { header: 'Total', key: 'total', width: 14 },
  ];
  for (const row of data.split) {
    split.addRow({
      class: classLabel(row.class),
      plan: planLabel(row.plan),
      students: row.amounts.studentCount,
      payments: row.amounts.paymentCount,
      base: formatInrFromPaise(row.amounts.basePaise),
      gst: formatInrFromPaise(row.amounts.gstPaise),
      discount: formatInrFromPaise(row.amounts.discountPaise),
      stars: formatInrFromPaise(row.amounts.starsPaise),
      total: formatInrFromPaise(row.amounts.totalPaise),
    });
  }

  const sources = workbook.addWorksheet('New student sources');
  sources.columns = [
    { header: 'Source', key: 'source', width: 18 },
    { header: 'Students', key: 'students', width: 12 },
    { header: 'Payments', key: 'payments', width: 12 },
    { header: 'Base', key: 'base', width: 14 },
    { header: 'GST', key: 'gst', width: 14 },
    { header: 'Discount', key: 'discount', width: 14 },
    { header: 'Stars', key: 'stars', width: 14 },
    { header: 'Total', key: 'total', width: 14 },
  ];
  for (const row of data.newbieSources) {
    sources.addRow({
      source: sourceLabel(row.source),
      students: row.amounts.studentCount,
      payments: row.amounts.paymentCount,
      base: formatInrFromPaise(row.amounts.basePaise),
      gst: formatInrFromPaise(row.amounts.gstPaise),
      discount: formatInrFromPaise(row.amounts.discountPaise),
      stars: formatInrFromPaise(row.amounts.starsPaise),
      total: formatInrFromPaise(row.amounts.totalPaise),
    });
  }

  const studentsSheet = workbook.addWorksheet('Paying students');
  studentsSheet.columns = [
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Joined', key: 'first', width: 22 },
    { header: 'Purchases', key: 'purchases', width: 12 },
    { header: 'Lifetime', key: 'lifetime', width: 16 },
    { header: 'Tenure (months)', key: 'months', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Lead ID', key: 'leadId', width: 38 },
  ];
  for (const row of students) {
    studentsSheet.addRow({
      name: row.fullName,
      email: row.email,
      first: row.firstPurchaseAt,
      purchases: row.purchaseCount,
      lifetime: formatInrFromPaise(row.lifetimePaidPaise),
      months: Number(row.monthsWithUs.toFixed(1)),
      status: row.status,
      leadId: row.leadId ?? '',
    });
  }

  const joining = workbook.addWorksheet('Cohort retention');
  joining.columns = [
    { header: 'Joined', key: 'month', width: 14 },
    { header: 'Cohort size', key: 'size', width: 12 },
    { header: 'Retained 3 mo', key: 'm3', width: 14 },
    { header: 'Retained 6 mo', key: 'm6', width: 14 },
    { header: 'Retained 12 mo', key: 'm12', width: 14 },
    { header: 'Avg lifetime', key: 'avg', width: 18 },
  ];
  for (const row of data.joiningMonths) {
    joining.addRow({
      month: row.joinMonth,
      size: row.cohortSize,
      m3: row.returnedByMonth3,
      m6: row.returnedByMonth6,
      m12: row.returnedByMonth12,
      avg: formatInrFromPaise(Math.round(row.avgLifetimePaidPaise)),
    });
  }

  const fails = workbook.addWorksheet('Refunds & failures');
  fails.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Count', key: 'count', width: 12 },
    { header: 'Amount', key: 'amount', width: 16 },
  ];
  fails.addRow({
    metric: 'Failed checkouts',
    count: data.failures.failedCheckoutsCount,
    amount: formatInrFromPaise(data.failures.failedCheckoutsPaise),
  });
  fails.addRow({
    metric: 'Failed autopay',
    count: data.failures.failedChargesCount,
    amount: formatInrFromPaise(data.failures.failedChargesPaise),
  });
  fails.addRow({
    metric: 'Offline refunds',
    count: data.failures.offlineRefundsCount,
    amount: '',
  });
  fails.addRow({
    metric: 'Failed payment events',
    count: data.failures.paymentFailedEventsCount,
    amount: '',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  await triggerDownload(buffer as ArrayBuffer, filenameFor(data.since, data.until));
}
