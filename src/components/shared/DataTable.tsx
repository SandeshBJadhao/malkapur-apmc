'use client';

import React, { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  /** Unique key to identify column */
  key: string;
  headerMr: string;
  headerEn: string;
  /** Render function for each cell */
  render: (row: T, index: number) => ReactNode;
  /** Optional: CSS class applied to both <th> and <td> */
  className?: string;
  /** If true, text is right-aligned in header + cells */
  alignRight?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyMr?: string;
  emptyEn?: string;
  /** Extra class on outer wrapper div */
  className?: string;
  /** Extra row-level class — receives the row + index */
  rowClassName?: (row: T, index: number) => string;
}

/**
 * Reusable DataTable built on top of shadcn Table primitives.
 * Provides standard green-tinted headers, hover states, zebra rows, and an empty state.
 */
export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMr = 'माहिती उपलब्ध नाही.',
  emptyEn = 'No data available.',
  className,
  rowClassName,
}: DataTableProps<T>) {
  const { t } = useLanguage();

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-emerald-50/65 border-b border-emerald-100/80">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'font-bold text-emerald-950 text-[13px] py-4',
                    col.alignRight && 'text-right',
                    col.className
                  )}
                >
                  {t(col.headerMr, col.headerEn)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <TableRow
                  key={getRowKey(row, idx)}
                  className={cn(
                    'border-b border-gray-100 transition-colors',
                    'odd:bg-white even:bg-gray-50/20 hover:bg-emerald-50/20',
                    rowClassName?.(row, idx)
                  )}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        'py-4',
                        col.alignRight && 'text-right',
                        col.className
                      )}
                    >
                      {col.render(row, idx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-14 text-gray-400 font-medium"
                >
                  {t(emptyMr, emptyEn)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
