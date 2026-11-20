'use client';

// =============================================================================
// StaffComplaintsTableClient — Staff-facing tabular view of their complaint tickets
// with URL-synced search, status filter, pagination, and detail inspection modal.
// =============================================================================

import { useState, useCallback, useTransition, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Eye,
  MessageSquare,
  Home,
  MapPin,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IncidentTicket, IncidentStatus } from '@/lib/mock-api/db';
import type { PaginatedMyIncidentTicketsResult } from '@/lib/mock-api/endpoints/audit';

export interface StaffComplaintsTableClientProps {
  initialData: PaginatedMyIncidentTicketsResult;
  initialSearch: string;
  initialStatus: string;
  initialPage: number;
  initialLimit: number;
}

const STATUS_CONFIG: Record<
  IncidentStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeCls: string;
    iconCls: string;
  }
> = {
  OPEN: {
    label: 'Open',
    icon: AlertCircle,
    badgeCls: 'bg-red-50 text-red-700 border-red-200',
    iconCls: 'text-red-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
    iconCls: 'text-amber-600',
  },
  RESOLVED: {
    label: 'Resolved',
    icon: CheckCircle2,
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconCls: 'text-emerald-600',
  },
};

export function StaffComplaintsTableClient({
  initialData,
  initialSearch,
  initialStatus,
  initialPage,
  initialLimit,
}: StaffComplaintsTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus || 'ALL');
  const [selectedTicket, setSelectedTicket] = useState<IncidentTicket | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const buildUrl = useCallback(
    (overrides: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = overrides.search !== undefined ? overrides.search : search;
      const st = overrides.status !== undefined ? overrides.status : status;
      const pg = overrides.page !== undefined ? overrides.page : initialPage;
      const lm = overrides.limit !== undefined ? overrides.limit : initialLimit;

      const params = new URLSearchParams();
      if (q.trim()) params.set('search', q.trim());
      if (st && st !== 'ALL') params.set('status', st);
      if (pg > 1) params.set('page', String(pg));
      if (lm !== 10) params.set('limit', String(lm));

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [search, status, initialPage, initialLimit, pathname]
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

  function handlePageChange(newPage: number) {
    navigate(buildUrl({ page: newPage }));
  }

  function handleLimitChange(val: string | null) {
    const newLimit = val ? Number(val) : 10;
    navigate(buildUrl({ limit: newLimit, page: 1 }));
  }

  const { tickets, total, page, totalPages, limit } = initialData;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search my tickets by ID, title, description, or unit..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10 text-sm bg-background"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:inline" />
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-10 text-xs w-[170px] bg-background font-medium">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-28 text-xs font-semibold uppercase tracking-wider">
                Ticket ID
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Title & Description
              </TableHead>
              <TableHead className="w-48 text-xs font-semibold uppercase tracking-wider">
                Housing Unit
              </TableHead>
              <TableHead className="w-32 text-xs font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="w-36 text-xs font-semibold uppercase tracking-wider">
                Submitted
              </TableHead>
              <TableHead className="w-24 text-xs font-semibold uppercase tracking-wider text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-36 text-center text-muted-foreground text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-1" />
                    <p className="font-semibold text-foreground">No complaints found</p>
                    <p className="text-xs text-muted-foreground">
                      {search || status !== 'ALL'
                        ? 'Try adjusting your search keywords or filter criteria.'
                        : "You haven't submitted any complaints yet."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => {
                const statusConfig =
                  STATUS_CONFIG[ticket.status as IncidentStatus] ?? STATUS_CONFIG.OPEN;
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="cursor-pointer hover:bg-muted/40 transition group"
                  >
                    {/* Ticket ID */}
                    <TableCell className="align-top py-3.5">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-1 rounded-md border border-border">
                        {ticket.id}
                      </span>
                    </TableCell>

                    {/* Title & Description Preview */}
                    <TableCell className="align-top py-3.5 max-w-sm">
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>

                    {/* Housing Unit */}
                    <TableCell className="align-top py-3.5">
                      {ticket.unitName ? (
                        <div>
                          <p className="font-semibold text-sm text-foreground leading-tight">
                            {ticket.unitName}
                          </p>
                          {(ticket.roadNumber || ticket.housingTypeName) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[ticket.roadNumber, ticket.housingTypeName]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Not currently allocated
                        </span>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="align-top py-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5 border gap-1',
                          statusConfig.badgeCls
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Submitted Date */}
                    <TableCell className="align-top py-3.5">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground block">
                          {ticket.createdAt
                            ? format(new Date(ticket.createdAt), 'dd MMM yyyy')
                            : '—'}
                        </span>
                        {ticket.createdAt && (
                          <span className="text-[11px] text-muted-foreground/80 block mt-0.5">
                            {format(new Date(ticket.createdAt), 'HH:mm')}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                      className="align-top py-3.5 text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedTicket(ticket)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
          <span className="font-semibold text-foreground">{total}</span> complaints
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <Select value={String(limit)} onValueChange={handleLimitChange}>
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

      {/* Ticket Details Modal (Read-Only) */}
      <Dialog
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      >
        <DialogContent className="w-[95vw] sm:w-[42vw] sm:max-w-[42vw] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-foreground bg-muted px-2.5 py-1 rounded-md border">
                {selectedTicket?.id}
              </span>
              {selectedTicket && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 border gap-1',
                    STATUS_CONFIG[selectedTicket.status as IncidentStatus]?.badgeCls
                  )}
                >
                  {STATUS_CONFIG[selectedTicket.status as IncidentStatus]?.label}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-oau-navy mt-2">
              {selectedTicket?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submitted on{' '}
              {selectedTicket?.createdAt
                ? format(new Date(selectedTicket.createdAt), 'dd MMMM yyyy, HH:mm')
                : '—'}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-5 pt-2 text-xs">
              {/* Housing Context Card */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Home className="h-3.5 w-3.5 text-primary" />
                  <span>Housing Context</span>
                </div>
                {selectedTicket.unitName || selectedTicket.housingTypeName || selectedTicket.roadNumber ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Housing Unit</span>
                      <span className="font-semibold text-foreground text-sm">
                        {selectedTicket.unitName ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Housing Type</span>
                      <span className="font-medium text-foreground">
                        {selectedTicket.housingTypeName ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Road Number</span>
                      <span className="font-medium text-foreground">
                        {selectedTicket.roadNumber ?? '—'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Not currently allocated (unhoused staff submission)
                  </p>
                )}
              </div>

              {/* Complaint Description */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Complaint / Incident Description
                </label>
                <div className="p-4 bg-muted/30 border rounded-xl text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Status & Last Updated (Read-Only) */}
              <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  <span className="block font-medium">Last Updated:</span>
                  <span>
                    {selectedTicket.updatedAt
                      ? format(
                          new Date(selectedTicket.updatedAt),
                          'dd MMM yyyy, HH:mm'
                        )
                      : '—'}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground italic">
                  Status changes are handled by the housing management office.
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

