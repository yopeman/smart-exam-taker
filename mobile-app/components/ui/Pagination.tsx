import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/theme/theme';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export function usePagination(items: any[], initialPageSize = 5) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goToPage = (p: number) =>
    setPage(Math.min(totalPages, Math.max(1, p)));

  return {
    page,
    pageSize,
    total,
    totalPages,
    paged,
    setPage: goToPage,
    setPageSize: (s: number) => {
      setPageSize(s);
      setPage(1);
    },
  };
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
  const { theme } = useTheme();

  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const pageButton = (
    label: string,
    target: number,
    selected = false
  ) => (
    <TouchableOpacity
      key={label}
      onPress={() => onPageChange(target)}
      disabled={selected}
      style={[
        styles.pageButton,
        {
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected
            ? theme.colors.primary
            : theme.colors.surface,
        },
      ]}
    >
      <Text
        style={[
          styles.pageButtonText,
          {
            color: selected ? '#FFFFFF' : theme.colors.text,
            fontSize: theme.typography.sizes.sm,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <Text
          style={[
            styles.infoText,
            { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs },
          ]}
        >
          Showing {start}–{end} of {total}
        </Text>
        <View style={styles.pageSizeRow}>
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => onPageSizeChange(opt)}
              disabled={opt === pageSize}
              style={[
                styles.pageSizeButton,
                {
                  borderColor:
                    opt === pageSize ? theme.colors.primary : theme.colors.border,
                  backgroundColor:
                    opt === pageSize ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.pageSizeText,
                  {
                    color: opt === pageSize ? '#FFFFFF' : theme.colors.textSecondary,
                    fontSize: theme.typography.sizes.xs,
                  },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.navRow}>
        {pageButton('«', 1, false)}
        {pageButton('‹', page - 1)}
        <Text
          style={[
            styles.pageInfo,
            { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm },
          ]}
        >
          Page {page} of {totalPages}
        </Text>
        {pageButton('›', page + 1)}
        {pageButton('»', totalPages, false)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoText: {
  },
  pageSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageSizeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 6,
  },
  pageSizeText: {
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  pageButtonText: {
    fontWeight: '600',
  },
  pageInfo: {
    marginHorizontal: 8,
    fontWeight: '500',
  },
});