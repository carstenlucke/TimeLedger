import React, { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export interface SortableColumnConfig<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  getValue?: (item: T) => string | number | null | undefined;
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
        {columns.map((column) => (
          <th
            key={String(column.key)}
            onClick={column.sortable !== false ? () => onSort(column.key) : undefined}
            style={column.sortable !== false ? { cursor: 'pointer', userSelect: 'none' } : undefined}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {column.label}
              {column.sortable !== false && sortConfig.key === column.key && (
                <span style={{ fontSize: '0.8em' }}>
                  {sortConfig.direction === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function useSortableData<T>(
  items: T[],
  defaultSort?: { key: keyof T; direction: SortDirection }
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
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

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
