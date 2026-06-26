import { Skeleton } from '@/components/ui/skeleton';

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function DataTableSkeleton({ columns = 5, rows = 6 }: DataTableSkeletonProps) {
  return (
    <div className="w-full space-y-3 animate-in fade-in duration-300">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      {/* Table skeleton */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-muted/50 border-b border-border grid gap-3 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24 rounded-md" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 px-4 py-4 border-b border-border last:border-0 even:bg-muted/20"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-4 rounded-md" style={{ width: `${60 + ((r + c) % 3) * 15}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
