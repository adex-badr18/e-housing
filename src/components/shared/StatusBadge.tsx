import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { UnitStatus, HousingCategory, ApplicationStatus, BQStatus } from '@/lib/mock-api/db';

// ─── Unit Status ───────────────────────────────────────────────────────────────

const unitStatusConfig: Record<UnitStatus, { label: string; className: string }> = {
  VACANT: {
    label: 'Vacant',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  OCCUPIED: {
    label: 'Occupied',
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  },
  UNDER_MAINTENANCE: {
    label: 'Maintenance',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  const config = unitStatusConfig[status];
  return (
    <Badge className={cn('border font-medium text-xs px-2 py-0.5', config.className)}>
      {config.label}
    </Badge>
  );
}

// ─── Housing Category ──────────────────────────────────────────────────────────

const categoryConfig: Record<HousingCategory, { label: string; className: string }> = {
  SENIOR: {
    label: 'Senior',
    className: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400',
  },
  JUNIOR: {
    label: 'Junior',
    className: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400',
  },
};

export function CategoryBadge({ category }: { category: HousingCategory }) {
  const config = categoryConfig[category];
  return (
    <Badge className={cn('border font-medium text-xs px-2 py-0.5', config.className)}>
      {config.label}
    </Badge>
  );
}

// ─── Application Status ────────────────────────────────────────────────────────

const appStatusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  QUEUED: {
    label: 'Queued',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  QUIT_REQUESTED: {
    label: 'Quit Requested',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-slate-200 text-slate-800 border-slate-300',
  },
  TERMINATED: {
    label: 'Terminated',
    className: 'bg-red-200 text-red-900 border-red-300',
  },
};

export function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  const config = appStatusConfig[status];
  return (
    <Badge className={cn('border font-medium text-xs px-2 py-0.5', config.className)}>
      {config.label}
    </Badge>
  );
}

export { AppStatusBadge as StatusBadge };


// ─── BQ Status ────────────────────────────────────────────────────────────────

const bqStatusConfig: Record<BQStatus, { label: string; className: string }> = {
  VACANT: {
    label: 'Vacant',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  OCCUPIED: {
    label: 'Occupied',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
};

export function BQStatusBadge({ status }: { status: BQStatus }) {
  const config = bqStatusConfig[status];
  return (
    <Badge className={cn('border font-medium text-xs px-2 py-0.5', config.className)}>
      {config.label}
    </Badge>
  );
}

// ─── Active / Inactive ────────────────────────────────────────────────────────

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={cn(
        'border font-medium text-xs px-2 py-0.5',
        isActive
          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
