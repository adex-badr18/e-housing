'use client';

// =============================================================================
// ExitPipelineTableClient — Server-side Queried Exit Pipeline Table
// =============================================================================
// Features:
//   - URL-driven server-side search (debounced), role-aware filters, & pagination
//   - Entire columns: Staff/Occupant, Housing Unit, Exit Reason, Initiated & Grace Period, Pipeline Stages, Status, Navigation
//   - Status dropdown (including Awaiting My Stage, Overdue, Active, Cleared, Closed)
//   - Reason dropdown (Retirement, Resignation, Relocation, Transfer, Death, Allocation Change, Other)
//   - Visual mini-stepper displaying parallel Stage A & B plus gated Stage C
//   - GracePeriodChip showing urgency / overdue countdown
//   - Row-click navigation directly to /management/exit/[exitId]
// =============================================================================

import { useState, useCallback, useTransition, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  Loader2,
  CalendarClock,
  AlertTriangle,
  Home,
  Zap,
  Building2,
  Clock,
  Shield,
  FileX2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/mock-api/db';
import type { PaginatedExitNoticesResult, EnrichedExitNoticeRow } from '@/lib/mock-api/endpoints/exit';

export interface ExitPipelineTableClientProps {
  initialData: PaginatedExitNoticesResult;
  viewerRole: Role;
  initialSearch: string;
  initialStatus: string;
  initialReason: string;
  initialPage: number;
  initialLimit: number;
}

const EXIT_REASON_LABELS: Record<string, string> = {
  RETIREMENT: 'Retirement',
  DEATH: 'Death of Occupant',
  RESIGNATION: 'Resignation',
  RELOCATION: 'Personal Relocation',
  TRANSFER: 'Transfer',
  ALLOCATION_CHANGE: 'Allocation Change',
  OTHER: 'Other',
};

function GracePeriodChip({ days }: { days: number | null }) {
  if (days === null) return null;

  const isExpired = days <= 0;
  const isCritical = !isExpired && days < 10;
  const isWarning = !isExpired && days >= 10 && days <= 30;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
        isExpired
          ? 'bg-red-100 text-red-700 border-red-300'
          : isCritical
          ? 'bg-orange-100 text-orange-700 border-orange-300'
          : isWarning
          ? 'bg-amber-100 text-amber-700 border-amber-300'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      )}
    >
      {isExpired ? <AlertTriangle className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
      {isExpired ? `${Math.abs(days)}d over` : `${days}d left`}
    </span>
  );
}

function PipelineMini({ row }: { row: EnrichedExitNoticeRow }) {
  const { notice } = row;
  const hStatus = notice.housingPaymentStatus ?? notice.housingInspectionStatus ?? 'PENDING';
  const eStatus = notice.electricalFittingStatus ?? notice.electricalInspectionStatus ?? 'PENDING';
  const estStatus = notice.estateInspectionStatus ?? 'PENDING';

  const stages = [
    { label: 'H', status: hStatus, icon: Home },
    { label: 'E', status: eStatus, icon: Zap },
    { label: 'Est', status: estStatus, icon: Building2 },
  ];

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isPassed = stage.status === 'PASSED';
        const isFailed = stage.status === 'FAILED';

        return (
          <div key={idx} className="flex items-center gap-1">
            <div
              title={`${stage.label}: ${stage.status}`}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold',
                isPassed
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : isFailed
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              <Icon className="h-3 w-3" />
            </div>
            {idx < stages.length - 1 && (
              <span className="text-[10px] text-muted-foreground/60">•</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ExitPipelineTableClient({
  initialData,
  viewerRole,
  initialSearch,
  initialStatus,
  initialReason,
  initialPage,
  initialLimit,
}: ExitPipelineTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus || 'ALL');
  const [reason, setReason] = useState(initialReason || 'ALL');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const buildUrl = useCallback(
    (overrides: {
      search?: string;
      status?: string;
      reason?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = overrides.search !== undefined ? overrides.search : search;
      const st = overrides.status !== undefined ? overrides.status : status;
      const rs = overrides.reason !== undefined ? overrides.reason : reason;
      const pg = overrides.page !== undefined ? overrides.page : initialPage;
      const lm = overrides.limit !== undefined ? overrides.limit : initialLimit;

      const params = new URLSearchParams();
      if (q.trim()) params.set('search', q.trim());
      if (st && st !== 'ALL') params.set('status', st);
      if (rs && rs !== 'ALL') params.set('reason', rs);
      if (pg > 1) params.set('page', String(pg));
      if (lm !== 10) params.set('limit', String(lm));

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [search, status, reason, initialPage, initialLimit, pathname]
  );

  const navigate = useCallback(
    (url: string) => {
      startTransition(() => {
        router.push(url);
      });
    },
    [router]
  );

  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate(buildUrl({ search: val, page: 1 }));
    }, 350);
  }

  function handleStatusChange(val: string | null) {
    const nextVal = val ?? 'ALL';
    setStatus(nextVal);
    navigate(buildUrl({ status: nextVal, page: 1 }));
  }

  function handleReasonChange(val: string | null) {
    const nextVal = val ?? 'ALL';
    setReason(nextVal);
    navigate(buildUrl({ reason: nextVal, page: 1 }));
  }

  function handlePageChange(newPage: number) {
    navigate(buildUrl({ page: newPage }));
  }

  function handleLimitChange(val: string | null) {
    const newLimit = val ? Number(val) : 10;
    navigate(buildUrl({ limit: newLimit, page: 1 }));
  }

  const { notices, total, page, totalPages, limit } = initialData;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const isRoleFilterApplicable =
    viewerRole === 'HOUSING_SECRETARY' ||
    viewerRole === 'ELECTRICAL_OFFICER' ||
    viewerRole === 'ESTATE_OFFICER';

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Unified Mode Toggle: Active Queue vs All Exit Notices */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => handleStatusChange('ACTIVE')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
              status === 'ACTIVE' || status === 'AWAITING_MY_STAGE'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Active Queue
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('ALL')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
              status === 'ALL'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All Exit Notices (History)
          </button>
        </div>

        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by staff name, ID, unit, reason..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9 h-10 text-sm bg-background"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:inline" />
            {/* Status Filter Dropdown */}
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-10 text-xs w-[170px] bg-background font-medium">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active (In Progress)</SelectItem>
                {isRoleFilterApplicable && (
                  <SelectItem value="AWAITING_MY_STAGE">Awaiting My Stage</SelectItem>
                )}
                <SelectItem value="OVERDUE">Grace Period Overdue</SelectItem>
                <SelectItem value="CLEARED">Cleared</SelectItem>
                <SelectItem value="CLOSED">Closed / Terminated</SelectItem>
              </SelectContent>
            </Select>

            {/* Reason Filter Dropdown */}
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger className="h-10 text-xs w-[180px] bg-background font-medium">
                <SelectValue placeholder="Filter Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Exit Reasons</SelectItem>
                <SelectItem value="ALLOCATION_CHANGE">Allocation Change</SelectItem>
                <SelectItem value="RETIREMENT">Retirement</SelectItem>
                <SelectItem value="RESIGNATION">Resignation</SelectItem>
                <SelectItem value="RELOCATION">Personal Relocation</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="DEATH">Death of Occupant</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Entire Columns Table Container */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Staff / Occupant
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Housing Unit
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Exit Reason
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Initiated & Grace Period
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Pipeline Stages
              </TableHead>
              <TableHead className="w-28 text-xs font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-36 text-center text-muted-foreground text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Clock className="h-8 w-8 text-muted-foreground/40 mb-1" />
                    <p className="font-semibold text-foreground">No exit notices found</p>
                    <p className="text-xs text-muted-foreground">
                      Try modifying your search query or adjusting the filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              notices.map(row => {
                const { notice, staffUser, staffProfile, unit, housingType, daysRemaining } = row;
                const staffName = staffUser
                  ? `${staffUser.firstName} ${staffUser.lastName}`
                  : notice.userId;
                const unitName = unit ? unit.name : notice.housingUnitId;
                const reasonLabel =
                  EXIT_REASON_LABELS[notice.reason] ??
                  notice.reason.toLowerCase().replace(/_/g, ' ');

                const isCleared = notice.isCleared;
                const isTerminated = notice.isAdminTerminated || notice.isWithdrawn;
                const isOverdue =
                  !isCleared && !isTerminated && daysRemaining !== null && daysRemaining <= 0;

                return (
                  <TableRow
                    key={notice.id}
                    onClick={() => router.push(`/management/exit/${notice.id}`)}
                    className={cn(
                      'cursor-pointer hover:bg-muted/40 transition group',
                      isOverdue && 'bg-red-50/40 hover:bg-red-50/70'
                    )}
                  >
                    {/* Staff / Occupant */}
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {staffName}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          {staffProfile?.staffId && (
                            <span className="font-mono">{staffProfile.staffId}</span>
                          )}
                          {staffProfile?.department && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[140px]">
                                {staffProfile.department}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Housing Unit */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">{unitName}</p>
                        <p className="text-xs text-muted-foreground">
                          {housingType?.name ?? 'Standard Housing'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Exit Reason */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5',
                          notice.reason === 'ALLOCATION_CHANGE'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : notice.reason === 'RETIREMENT'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-muted/60 text-muted-foreground border-border'
                        )}
                      >
                        {reasonLabel}
                      </Badge>
                      {notice.customReason && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[150px]">
                          {notice.customReason}
                        </p>
                      )}
                    </TableCell>

                    {/* Initiated & Grace Period */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notice.submittedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {!isCleared && !isTerminated && (
                          <GracePeriodChip days={daysRemaining} />
                        )}
                      </div>
                    </TableCell>

                    {/* Pipeline Stages Mini Stepper */}
                    <TableCell>
                      <PipelineMini row={row} />
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {isCleared ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs gap-1 font-semibold">
                          <Shield className="h-3 w-3" /> Cleared
                        </Badge>
                      ) : isTerminated ? (
                        <Badge className="bg-slate-100 text-slate-700 border-slate-300 border text-xs gap-1 font-semibold">
                          <FileX2 className="h-3 w-3" /> Closed
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-xs gap-1 font-semibold">
                          <Clock className="h-3 w-3" /> In Progress
                        </Badge>
                      )}
                    </TableCell>

                    {/* Chevron Link */}
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div>
          Showing <span className="font-semibold text-foreground">{startItem}</span> to{' '}
          <span className="font-semibold text-foreground">{endItem}</span> of{' '}
          <span className="font-semibold text-foreground">{total}</span> records
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <Select
              value={String(limit)}
              onValueChange={handleLimitChange}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={page <= 1 || isPending}
            >
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isPending}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages || isPending}
            >
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
