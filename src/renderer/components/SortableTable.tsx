import React, { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface SortableColumnConfig<T> {
  key: keyof T;
  label: React.ReactNode;
  sortable?: boolean;
  getValue?: (item: T) => string | number | null | undefined;
  headerStyle?: React.CSSProperties;
  headerClassName?: string;
}

interface SortableHeaderProps<T> {
  columns: SortableColumnConfig<T>[];
  sortConfig: SortConfig<T>;
  onSort: (key: keyof T) => void;
}

export function SortableHeader<T>({ columns, sortConfig, onSort }: SortableHeaderProps<T>) {
  return (
    <thead>
      <tr>
        {columns.map((column) => {
          const isSortable = column.sortable !== false;
          let style: React.CSSProperties | undefined = column.headerStyle
            ? { ...column.headerStyle }
            : undefined;

          if (isSortable) {
            style = { ...(style ?? {}), cursor: 'pointer', userSelect: 'none' };
          }

          return (
            <th
              key={String(column.key)}
              onClick={isSortable ? () => onSort(column.key) : undefined}
              style={style}
              className={column.headerClassName}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {column.label}
                {isSortable && sortConfig.key === column.key && (
                  <span style={{ fontSize: '0.8em' }}>
                    {sortConfig.direction === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function useSortableData<T>(
  items: T[],
  defaultSort?: { key: keyof T; direction: SortDirection },
  getSortValue?: (item: T, key: keyof T) => string | number | null | undefined
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: defaultSort?.key ?? null,
    direction: defaultSort?.direction ?? 'asc',
  });

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortedItems = React.useMemo(() => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      const aValue = getSortValue ? getSortValue(a, sortConfig.key!) : a[sortConfig.key!];
      const bValue = getSortValue ? getSortValue(b, sortConfig.key!) : b[sortConfig.key!];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [items, sortConfig]);

  return { sortedItems, sortConfig, handleSort };
}
