'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, ArrowRight, SlidersHorizontal, Home, Zap, Building2 } from 'lucide-react';
import type { ExitNotice, User } from '@/lib/mock-api/db';

type ExitStatusFilter = 'ALL' | 'IN_PROGRESS' | 'CLEARED' | 'WITHDRAWN';

const PAGE_SIZE = 10;

function PipelineMini({ notice }: { notice: ExitNotice }) {
  const stages = [
    { status: notice.housingInspectionStatus, Icon: Home },
    { status: notice.electricalInspectionStatus, Icon: Zap },
    { status: notice.estateInspectionStatus, Icon: Building2 },
  ];
  return (
    <div className="flex items-center gap-0.5">
      {stages.map(({ status, Icon }, i) => (
        <div key={i} className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center border text-xs',
          status === 'PASSED' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
          status === 'FAILED' ? 'bg-red-100 border-red-300 text-red-700' :
          'bg-muted border-border text-muted-foreground'
        )}>
          <Icon className="h-3 w-3" />
        </div>
      ))}
    </div>
  );
}

function NoticeStatusBadge({ notice }: { notice: ExitNotice }) {
  if (notice.isCleared) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">Cleared</span>;
  if (notice.isWithdrawn) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-200 text-slate-800 border-slate-300">Withdrawn</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">In Progress</span>;
}

interface ExitHistoryTableProps {
  notices: ExitNotice[];
  detailBasePath: string;
  userMap?: Record<string, User>;
}

export function ExitHistoryTable({ notices, detailBasePath, userMap }: ExitHistoryTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExitStatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...notices];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.id.toLowerCase().includes(q) ||
        n.reason.toLowerCase().includes(q) ||
        (userMap?.[n.userId] &&
          `${userMap[n.userId].firstName} ${userMap[n.userId].lastName}`.toLowerCase().includes(q))
      );
    }
    if (statusFilter === 'CLEARED') list = list.filter(n => n.isCleared);
    else if (statusFilter === 'WITHDRAWN') list = list.filter(n => n.isWithdrawn && !n.isCleared);
    else if (statusFilter === 'IN_PROGRESS') list = list.filter(n => !n.isCleared && !n.isWithdrawn);
    return list;
  }, [notices, search, statusFilter, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleFilter(v: ExitStatusFilter) { setStatusFilter(v); setPage(1); }

  const statusOptions: { value: ExitStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'CLEARED', label: 'Cleared' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, reason, or name…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border bg-background hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {statusFilter !== 'ALL' && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-bold">1</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="p-4 rounded-xl border bg-muted/30 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">Status:</span>
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</span>
        {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
      </div>

      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed bg-muted/10 text-center">
          <Search className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No exit notices found</p>
          <p className="text-xs text-muted-foreground/60">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Notice ID</th>
                  {userMap && <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Applicant</th>}
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Reason</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Pipeline</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Submitted</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map(notice => {
                  const applicant = userMap?.[notice.userId];
                  return (
                    <tr key={notice.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-xs font-semibold">{notice.id}</p>
                      </td>
                      {userMap && (
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-sm">
                            {applicant ? `${applicant.firstName} ${applicant.lastName}` : <span className="text-muted-foreground italic">Unknown</span>}
                          </p>
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        <span className="text-xs capitalize">{notice.reason.toLowerCase().replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3.5"><NoticeStatusBadge notice={notice} /></td>
                      <td className="px-4 py-3.5"><PipelineMini notice={notice} /></td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {format(new Date(notice.submittedAt), 'dd MMM yyyy')}
                        <br />
                        <span className="text-muted-foreground/60">{format(new Date(notice.submittedAt), 'HH:mm')}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`${detailBasePath}/${notice.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group-hover:gap-2 transition-all"
                        >
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                  p === currentPage ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
