'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type PerformanceSortDirection = 'asc' | 'desc';

export type UsePerformanceTableStateOptions<TRow, TSortKey extends string> = {
  rows: TRow[];
  pageSize?: number;
  defaultSortKey: TSortKey;
  defaultSortDirection?: PerformanceSortDirection;
  getSortValue: (row: TRow, key: TSortKey) => string | number;
  filterRow: (row: TRow, search: string) => boolean;
};

export function usePerformanceTableState<TRow, TSortKey extends string>({
  rows,
  pageSize = 10,
  defaultSortKey,
  defaultSortDirection = 'desc',
  getSortValue,
  filterRow,
}: UsePerformanceTableStateOptions<TRow, TSortKey>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<TSortKey>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<PerformanceSortDirection>(defaultSortDirection);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDirection, rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((row) => filterRow(row, query));
  }, [rows, search, filterRow]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const left = getSortValue(a, sortKey);
      const right = getSortValue(b, sortKey);
      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left;
      }
      const comparison = String(left).localeCompare(String(right), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredRows, sortKey, sortDirection, getSortValue]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = sortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, sortedRows.length);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = useCallback(
    (key: TSortKey) => {
      if (sortKey === key) {
        setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        return;
      }
      setSortKey(key);
      setSortDirection('desc');
    },
    [sortKey]
  );

  return {
    search,
    setSearch,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    toggleSort,
    page: currentPage,
    setPage,
    pageSize,
    totalRows: sortedRows.length,
    totalPages,
    pageStart,
    pageEnd,
    pageRows,
  };
}
