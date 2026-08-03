import { readFile } from 'node:fs/promises';
import { NextResponse, type NextRequest } from 'next/server';
import { hasProduct, isMarketingOnly, PRODUCT_CRM } from '@/lib/access';
import { getReportById, reportFilePath } from '@/lib/reports';
import { getMyAccess } from '@/utils/api';
import { createClient } from '@/utils/supabase/server';

async function ensureAuthorized() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, reason: 'login' };
  }

  try {
    const access = await getMyAccess();
    if (!hasProduct(access.products, PRODUCT_CRM)) {
      return { ok: false as const, reason: 'unauthorized' };
    }
    if (isMarketingOnly(access.roles)) {
      return { ok: false as const, reason: 'unauthorized' };
    }
  } catch {
    return { ok: false as const, reason: 'unauthorized' };
  }

  return { ok: true as const };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const auth = await ensureAuthorized();
  if (!auth.ok) {
    const location = auth.reason === 'login' ? '/login' : '/unauthorized';
    return NextResponse.redirect(new URL(location, request.url));
  }

  const { reportId } = await params;
  const report = await getReportById(reportId);
  if (!report) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  try {
    const html = await readFile(reportFilePath(report.fileName), 'utf8');
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Report file is missing.' }, { status: 404 });
  }
}
