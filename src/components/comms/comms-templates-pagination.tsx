import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildCommsTemplatesHref,
  clampCommsTemplatePage,
  commsTemplateTotalPages,
  type CommsTemplateFilters,
} from '@/lib/comms-templates-query';

type CommsTemplatesPaginationProps = {
  filters: CommsTemplateFilters;
  total: number;
};

export function CommsTemplatesPagination({ filters, total }: CommsTemplatesPaginationProps) {
  const pageSize = filters.pageSize;
  const totalPages = commsTemplateTotalPages(total, pageSize);
  const page = clampCommsTemplatePage(filters.page, total, pageSize);
  if (totalPages <= 1) return null;

  const prevHref = page > 1 ? buildCommsTemplatesHref(filters, { page: page - 1 }) : null;
  const nextHref = page < totalPages ? buildCommsTemplatesHref(filters, { page: page + 1 }) : null;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        {from}–{to} of {total.toLocaleString('en-IN')} matching
      </p>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand no-underline shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-2xl border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        )}
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand no-underline shadow-sm hover:bg-slate-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-2xl border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
