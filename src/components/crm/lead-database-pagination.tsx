'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type LeadDatabasePaginationProps = {
  filters: LeadDatabaseFilters;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function LeadDatabasePagination({ filters, total, page, pageSize, totalPages }: LeadDatabasePaginationProps) {
  if (totalPages <= 1) return null;

  const prevHref = page > 1 ? buildLeadDatabaseHref(filters, { page: page - 1 }) : null;
  const nextHref = page < totalPages ? buildLeadDatabaseHref(filters, { page: page + 1 }) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} · {total.toLocaleString('en-IN')} matching
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

export function leadDatabaseRangeLabel(total: number, page: number, pageSize: number): string {
  if (total === 0) return 'Showing 0 of 0';
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `Showing ${start.toLocaleString('en-IN')}–${end.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')}`;
}
