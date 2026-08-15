import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildRenewalsHref, type RenewalFilters } from '@/lib/renewal-query';

type RenewalsPaginationProps = {
  filters: RenewalFilters;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function RenewalsPagination({ filters, total, page, pageSize, totalPages }: RenewalsPaginationProps) {
  if (totalPages <= 1) return null;

  const prevHref = page > 1 ? buildRenewalsHref(filters, { page: page - 1 }) : null;
  const nextHref = page < totalPages ? buildRenewalsHref(filters, { page: page + 1 }) : null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
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
