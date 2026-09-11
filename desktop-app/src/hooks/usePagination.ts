import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], defaultPageSize = 5) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const changePage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    paged,
    setPage: changePage,
    setPageSize: changePageSize,
  };
}