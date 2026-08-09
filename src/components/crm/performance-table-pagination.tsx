'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PerformanceTablePaginationProps = {
  page: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  totalRows: number;
  onPageChange: (page: number) => void;
};

export function PerformanceTablePagination({
  page,
  totalPages,
  pageStart,
  pageEnd,
  totalRows,
  onPageChange,
}: PerformanceTablePaginationProps) {
  if (totalRows === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
      <p className="text-sm text-slate-500">
        {totalRows <= 1
          ? `${totalRows.toLocaleString('en-IN')} row`
          : `Showing ${pageStart.toLocaleString('en-IN')}–${pageEnd.toLocaleString('en-IN')} of ${totalRows.toLocaleString('en-IN')}`}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-xs font-medium text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
