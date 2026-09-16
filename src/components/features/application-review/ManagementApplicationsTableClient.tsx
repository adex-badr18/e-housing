'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ClipboardList, ChevronRight, Inbox, ArrowRight,
  ClipboardCheck, Building2, Crown, Search,
  RefreshCw, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppStatusBadge } from '@/components/shared/StatusBadge';
import { getPaginatedApplicationsAction } from '@/app/actions/applications';
import type { ApplicationStage, Role, HousingApplication, HousingUnit, User as UserType, StaffProfile } from '@/lib/mock-api/db';

const STAGE_CONFIG: Record<
  Exclude<ApplicationStage, 'COMPLETED'> | 'COMPLETED',
  { label: string; className: string; Icon: React.ElementType }
> = {
  HOUSING:   { label: 'Stage 1 — Housing',  className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', Icon: ClipboardCheck },
  ESTATE:    { label: 'Stage 2 — Estate',   className: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800', Icon: Building2 },
  DVC:       { label: 'Stage 3 — DVC',      className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', Icon: Crown },
  COMPLETED: { label: 'Completed',           className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', Icon: ClipboardList },
};

function StageBadge({ stage }: { stage: ApplicationStage }) {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.HOUSING;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

interface EnrichedApplication extends HousingApplication {
  applicantUser?: UserType | null;
  applicantProfile?: StaffProfile | null;
  allocatedUnit?: HousingUnit | null;
}

interface ManagementApplicationsTableClientProps {
  userRole: Role;
}

export function ManagementApplicationsTableClient({ userRole }: ManagementApplicationsTableClientProps) {
  const router = useRouter();

  const [queueMode, setQueueMode] = useState<'MY_QUEUE' | 'ALL_APPLICATIONS'>('MY_QUEUE');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [apps, setApps] = useState<EnrichedApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    const res = await getPaginatedApplicationsAction({
      queueMode,
      stageFilter,
      statusFilter,
      searchQuery,
      page,
      limit: 10,
    });

    if (res.success && 'data' in res) {
      setApps((res.data || []) as EnrichedApplication[]);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } else {
      setApps([]);
      setTotal(0);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [queueMode, stageFilter, statusFilter, page]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-sm">
        {/* Queue Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setQueueMode('MY_QUEUE');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              queueMode === 'MY_QUEUE'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Action Queue
          </button>
          <button
            type="button"
            onClick={() => {
              setQueueMode('ALL_APPLICATIONS');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              queueMode === 'ALL_APPLICATIONS'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Applications
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search applicant, staff ID, app ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={e => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs bg-background border rounded-xl text-foreground"
          >
            <option value="ALL">All Stages</option>
            <option value="HOUSING">Stage 1 — Housing</option>
            <option value="ESTATE">Stage 2 — Estate</option>
            <option value="DVC">Stage 3 — DVC</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs bg-background border rounded-xl text-foreground"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="QUEUED">QUEUED</option>
            <option value="RETURNED">RETURNED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchApplications}
            disabled={loading}
            className="h-9 w-9 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading applications...</span>
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-muted-foreground">No applications found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try adjusting your search terms or filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Application & Applicant
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Current Stage
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Allocated / Proposed Unit
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Submitted
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apps.map(app => {
                  const applicantName = app.applicantUser
                    ? `${app.applicantUser.firstName} ${app.applicantUser.lastName}`
                    : 'Staff Applicant';
                  const staffId = app.applicantProfile?.staffId || '';
                  const dept = app.applicantProfile?.department || '';

                  return (
                    <tr
                      key={app.id}
                      onClick={() => router.push(`/management/applications/${app.id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {applicantName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                              {applicantName}
                              {staffId && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {staffId}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{app.id}</span>
                              {dept && <span>• {dept}</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StageBadge stage={app.currentStage} />
                      </td>
                      <td className="px-4 py-3.5">
                        <AppStatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {app.pointsBreakdown ? (
                          <span className="font-bold text-primary tabular-nums">
                            {app.pointsBreakdown.totalPoints}
                            <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">Not scored</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {app.allocatedUnit ? (
                          <div className="text-xs">
                            <p className="font-semibold text-foreground">{app.allocatedUnit.name}</p>
                            <p className="text-muted-foreground text-[11px]">{app.allocatedUnit.houseNumber}, {app.allocatedUnit.roadNumber}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {format(new Date(app.submittedAt), 'dd MMM yyyy')}
                        <br />
                        <span className="text-muted-foreground/60">{format(new Date(app.submittedAt), 'HH:mm')}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <Link
                          href={`/management/applications/${app.id}`}
                          id={`review-app-${app.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline group-hover:gap-1.5 transition-all"
                        >
                          View / Review
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{apps.length}</span> of{' '}
              <span className="font-semibold text-foreground">{total}</span> applications
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 px-3 text-xs gap-1 rounded-lg"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>

              <span className="font-medium text-foreground px-2">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 px-3 text-xs gap-1 rounded-lg"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
