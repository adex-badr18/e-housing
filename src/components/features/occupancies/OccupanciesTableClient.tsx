'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { HousingType, OccupancyStatus } from '@/lib/mock-api/db';
import type { PaginatedOccupanciesResult, OccupancyRow } from '@/lib/mock-api/endpoints/occupancies';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
  Loader2,
  Users2,
  CheckCircle2,
  LogOut as LogOutIcon,
} from 'lucide-react';

interface OccupanciesTableClientProps {
  initialData: PaginatedOccupanciesResult;
  housingTypes: HousingType[];
  initialSearch: string;
  initialStatus: OccupancyStatus | '';
  initialHousingTypeId: string;
  initialPage: number;
  initialLimit: number;
}

function OccupancyStatusBadge({ status }: { status: OccupancyStatus }) {
  if (status === 'ACTIVE') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border font-medium text-xs px-2 py-0.5 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-100 text-rose-800 border-rose-200 border font-medium text-xs px-2 py-0.5 gap-1">
      <LogOutIcon className="h-3 w-3" />
      Exited
    </Badge>
  );
}

function TenancyBadge({ signed }: { signed: boolean | null | undefined }) {
  if (signed == null) {
    return (
      <Badge className="bg-slate-100 text-slate-600 border-slate-200 border font-medium text-xs px-2 py-0.5">
        No Agreement
      </Badge>
    );
  }
  if (signed) {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 border font-medium text-xs px-2 py-0.5">
        Signed
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 border font-medium text-xs px-2 py-0.5">
      Pending Signature
    </Badge>
  );
}

export function OccupanciesTableClient({
  initialData,
  housingTypes,
  initialSearch,
  initialStatus,
  initialHousingTypeId,
  initialPage,
  initialLimit,
}: OccupanciesTableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<OccupancyStatus | ''>(initialStatus);
  const [housingTypeId, setHousingTypeId] = useState(initialHousingTypeId);

  // Debounce timer ref stored outside state to avoid re-renders
  const debounceRef = { current: null as ReturnType<typeof setTimeout> | null };

  const buildUrl = useCallback(
    (overrides: {
      search?: string;
      status?: OccupancyStatus | '';
      housingType?: string;
      page?: number;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      const s = overrides.search ?? search;
      const st = overrides.status ?? status;
      const ht = overrides.housingType ?? housingTypeId;
      const p = overrides.page ?? initialPage;
      const l = overrides.limit ?? initialLimit;
      if (s) params.set('search', s);
      if (st) params.set('status', st);
      if (ht) params.set('housingType', ht);
      params.set('page', String(p));
      params.set('limit', String(l));
      return `/management/occupancies?${params.toString()}`;
    },
    [search, status, housingTypeId, initialPage, initialLimit]
  );

  const navigate = useCallback(
    (url: string) => {
      startTransition(() => router.push(url));
    },
    [router]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate(buildUrl({ search: value, page: 1 }));
    }, 400);
  };

  const handleStatus = (value: string | null) => {
    if (!value) return;
    const v = value === 'ALL' ? '' : (value as OccupancyStatus);
    setStatus(v);
    navigate(buildUrl({ status: v, page: 1 }));
  };

  const handleHousingType = (value: string | null) => {
    if (!value) return;
    const v = value === 'ALL' ? '' : value;
    setHousingTypeId(v);
    navigate(buildUrl({ housingType: v, page: 1 }));
  };

  const handlePage = (page: number) => {
    navigate(buildUrl({ page }));
  };

  const handleLimit = (value: string | null) => {
    if (!value) return;
    navigate(buildUrl({ limit: parseInt(value, 10), page: 1 }));
  };

  const { data, total, page, totalPages, limit } = initialData;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            id="occupancy-search"
            placeholder="Search by name, staff ID, department, unit..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={status || 'ALL'} onValueChange={handleStatus}>
          <SelectTrigger id="occupancy-status-filter" className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXITED">Exited</SelectItem>
          </SelectContent>
        </Select>

        {/* Housing Type Filter */}
        <Select value={housingTypeId || 'ALL'} onValueChange={handleHousingType}>
          <SelectTrigger id="occupancy-type-filter" className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All Housing Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Housing Types</SelectItem>
            {housingTypes.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isPending && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Occupant
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Housing Unit
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Housing Type
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Check-in Date
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Tenancy Agreement
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Users2 className="h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium">No occupancies found</p>
                    <p className="text-xs">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row: OccupancyRow) => (
                <OccupancyTableRow key={row.occupancy.id} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Rows per page:</span>
          <Select value={String(limit)} onValueChange={handleLimit}>
            <SelectTrigger className="h-7 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>
            {total === 0 ? '0' : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}`} of {total}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            id="occupancy-page-first"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handlePage(1)}
            disabled={page <= 1 || isPending}
            aria-label="First page"
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            id="occupancy-page-prev"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1 || isPending}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            id="occupancy-page-next"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages || isPending}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            id="occupancy-page-last"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handlePage(totalPages)}
            disabled={page >= totalPages || isPending}
            aria-label="Last page"
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

function OccupancyTableRow({ row }: { row: OccupancyRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => router.push(`/management/occupancies/${row.occupancy.id}`));
  };

  const fullName = row.user
    ? `${row.user.firstName} ${row.user.lastName}`
    : 'Unknown Occupant';
  const staffId = row.profile?.staffId ?? '—';
  const department = row.profile?.department ?? '—';
  const unitDisplay = row.unit
    ? [row.unit.name, row.unit.houseNumber, row.unit.roadNumber].filter(Boolean).join(' · ')
    : '—';
  const checkIn = row.occupancy.checkInDate
    ? format(new Date(row.occupancy.checkInDate), 'dd MMM yyyy')
    : '—';

  return (
    <tr
      className={cn(
        'hover:bg-blue-50/40 transition-colors duration-150 cursor-pointer group',
        isPending && 'opacity-60'
      )}
      onClick={handleClick}
    >
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900 text-xs">{fullName}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{staffId} · {department}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-gray-800">{row.unit?.name ?? '—'}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {[row.unit?.houseNumber, row.unit?.roadNumber].filter(Boolean).join(', ') || '—'}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-gray-700">{row.housingType?.name ?? '—'}</p>
        {row.housingType && (
          <p className="text-[11px] text-gray-400 mt-0.5">
            {row.housingType.numberOfBedrooms}BR · {row.housingType.buildingType === 'BUNGALOW' ? 'Bungalow' : 'Storey'}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-700">{checkIn}</td>
      <td className="px-4 py-3">
        <TenancyBadge signed={row.tenancyAgreement?.signed} />
      </td>
      <td className="px-4 py-3">
        <OccupancyStatusBadge status={row.occupancy.status} />
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center justify-end gap-1 text-blue-600 text-xs font-medium group-hover:gap-2 transition-all">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>View <ChevronRight className="h-4 w-4" /></>
          )}
        </span>
      </td>
    </tr>
  );
}
