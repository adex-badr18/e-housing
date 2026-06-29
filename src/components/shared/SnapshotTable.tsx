import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface SnapshotColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface SnapshotTableProps<T> {
  columns: SnapshotColumn<T>[];
  rows: T[];
  /** A function that returns the href for a row; if provided, rows become clickable links */
  getRowHref?: (row: T) => string;
  /** Empty state message */
  emptyMessage?: string;
  /** Key extractor for React keys */
  getRowKey: (row: T) => string;
}

/**
 * SnapshotTable — a compact, read-only dashboard preview table (max ~5 rows).
 * When getRowHref is provided, each row is a clickable link.
 */
export function SnapshotTable<T>({
  columns,
  rows,
  getRowHref,
  emptyMessage = 'No records to display.',
  getRowKey,
}: SnapshotTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 flex items-center justify-center h-24">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border/60">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground tracking-wide',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const href = getRowHref?.(row);
            const rowClass = cn(
              'border-b border-border/40 last:border-0 transition-colors',
              href ? 'hover:bg-oau-navy/5 cursor-pointer' : 'hover:bg-muted/20'
            );

            const cells = columns.map(col => (
              <td
                key={col.key}
                className={cn('px-4 py-3 align-middle', col.className)}
              >
                {col.render(row)}
              </td>
            ));

            if (href) {
              return (
                <tr key={getRowKey(row)} className={rowClass}>
                  {/* First cell wraps in Link, rest are regular td */}
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 align-middle', col.className)}
                    >
                      {cIdx === 0 ? (
                        <Link href={href} className="block w-full h-full">
                          {col.render(row)}
                        </Link>
                      ) : (
                        <Link href={href} className="block w-full h-full">
                          {col.render(row)}
                        </Link>
                      )}
                    </td>
                  ))}
                </tr>
              );
            }

            return (
              <tr key={getRowKey(row)} className={rowClass}>
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
