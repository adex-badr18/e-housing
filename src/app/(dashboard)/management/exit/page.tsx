import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExitNoticesForRole } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck, Home, Zap, Building2, ChevronRight,
  Clock, CheckCircle2, XCircle, Shield, History,
  CalendarClock, AlertTriangle,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExitNotice, Role } from '@/lib/mock-api/db';

export const metadata = { title: 'Exit Pipeline — OAU E-Housing' };

const ALLOWED_ROLES = [
  'SUPER_ADMIN', 'HOUSING_SECRETARY', 'ELECTRICAL_OFFICER',
  'ESTATE_OFFICER', 'DVC_ADMIN',
] as const;

type AllowedRole = typeof ALLOWED_ROLES[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysRemaining(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: 'PENDING' | 'PASSED' | 'FAILED' }) {
  if (status === 'PASSED') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-medium border">Passed</Badge>;
  if (status === 'FAILED') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-medium border">Failed</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-medium border">Pending</Badge>;
}

function PipelineMini({ notice }: { notice: ExitNotice }) {
  // Canonical fields with deprecated alias fallbacks
  const housingStatus = notice.housingPaymentStatus ?? notice.housingInspectionStatus ?? 'PENDING';
  const electricalStatus = notice.electricalFittingStatus ?? notice.electricalInspectionStatus ?? 'PENDING';
  const estateStatus = notice.estateInspectionStatus ?? 'PENDING';

  const stages = [
    { icon: Home, status: housingStatus, label: 'H' },
    { icon: Zap, status: electricalStatus, label: 'E' },
    { icon: Building2, status: estateStatus, label: 'Est' },
  ];

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        return (
          <div key={i} className="flex items-center gap-1">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center border',
              stage.status === 'PASSED' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
              stage.status === 'FAILED' ? 'bg-red-100 border-red-300 text-red-700' :
              'bg-muted border-border text-muted-foreground'
            )}>
              <Icon className="h-3 w-3" />
            </div>
            {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

function GracePeriodChip({ deadline }: { deadline: string | null | undefined }) {
  const days = getDaysRemaining(deadline);
  if (days === null) return null;

  const isExpired = days <= 0;
  const isCritical = !isExpired && days < 10;
  const isWarning = !isExpired && days >= 10 && days <= 30;

  return (
    <div className={cn(
      'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border',
      isExpired ? 'bg-red-100 text-red-700 border-red-300' :
      isCritical ? 'bg-red-50 text-red-600 border-red-200' :
      isWarning ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-blue-50 text-blue-700 border-blue-200'
    )}>
      {isExpired ? <AlertTriangle className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
      {isExpired ? `${Math.abs(days)}d over` : `${days}d left`}
    </div>
  );
}

// Role labels per role
const ROLE_LABEL_MAP: Record<string, string> = {
  SUPER_ADMIN: 'All Exit Notices (Super Admin)',
  HOUSING_SECRETARY: 'Exit Pipeline — Housing Payment Clearance Queue',
  ELECTRICAL_OFFICER: 'Exit Pipeline — Electrical Fittings Clearance Queue',
  ESTATE_OFFICER: 'Exit Pipeline — Pre-Vacation Inspection Queue',
  DVC_ADMIN: 'Exit Pipeline — Full Overview (DVC Admin)',
};

// "Awaiting my stage" filter per role (parallel stages — pending counts if this role's stage is pending)
function awaitingMyStage(notice: ExitNotice, role: string): boolean {
  const housingStatus = notice.housingPaymentStatus ?? notice.housingInspectionStatus ?? 'PENDING';
  const electricalStatus = notice.electricalFittingStatus ?? notice.electricalInspectionStatus ?? 'PENDING';
  if (role === 'HOUSING_SECRETARY') return housingStatus === 'PENDING';
  if (role === 'ELECTRICAL_OFFICER') return electricalStatus === 'PENDING';
  if (role === 'ESTATE_OFFICER') return notice.estateInspectionStatus === 'PENDING';
  return false;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ExitPipelinePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!ALLOWED_ROLES.includes(session.user.role as AllowedRole)) redirect('/staff');

  const notices = await getExitNoticesForRole(session.user.role);
  const users = mockDB.users;
  const housingUnits = mockDB.housingUnits;

  // Sort active notices by grace period deadline (most urgent first, expired at top)
  const active = notices
    .filter(n => !n.isCleared && !n.isAdminTerminated)
    .sort((a, b) => {
      const dA = getDaysRemaining(a.gracePeriodDeadline) ?? 9999;
      const dB = getDaysRemaining(b.gracePeriodDeadline) ?? 9999;
      return dA - dB;
    });
  const cleared = notices.filter(n => n.isCleared);

  const roleLabel = ROLE_LABEL_MAP[session.user.role] ?? 'Exit Pipeline';
  const isDvcAdmin = session.user.role === 'DVC_ADMIN';

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Exit Clearance Pipeline</h1>
            <p className="text-base text-muted-foreground mt-1">{roleLabel}</p>
          </div>
        </div>
        <Link
          href="/management/exit/history"
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2 rounded-xl text-muted-foreground' })}
        >
          <History className="h-4 w-4" />
          View Full History
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total in Queue', value: notices.length, icon: ClipboardCheck, color: 'text-primary' },
          { label: 'Active', value: active.length, icon: Clock, color: 'text-amber-600' },
          { label: 'Cleared', value: cleared.length, icon: Shield, color: 'text-emerald-600' },
          {
            label: isDvcAdmin ? 'Expired Grace Periods' : 'Awaiting My Stage',
            value: isDvcAdmin
              ? active.filter(n => (getDaysRemaining(n.gracePeriodDeadline) ?? 1) <= 0).length
              : active.filter(n => awaitingMyStage(n, session.user.role)).length,
            icon: isDvcAdmin ? AlertTriangle : CheckCircle2,
            color: isDvcAdmin ? 'text-red-500' : 'text-blue-600',
          },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <Icon className={cn('h-8 w-8', stat.color)} />
              <div>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active notices table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <h2 className="font-semibold text-base">Active Notices ({active.length})</h2>
          <span className="ml-auto text-xs text-muted-foreground">Sorted by grace period urgency</span>
        </div>

        {active.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Queue is clear</p>
            <p className="text-base mt-1">No active exit notices require attention right now.</p>
          </div>
        ) : (
          <div className="divide-y">
            {active.map(notice => {
              const staff = users.find(u => u.id === notice.userId);
              const unit = housingUnits.find(u => u.id === notice.housingUnitId);
              const days = getDaysRemaining(notice.gracePeriodDeadline);
              const isOverdue = days !== null && days <= 0;

              return (
                <Link
                  key={notice.id}
                  href={`/management/exit/${notice.id}`}
                  className={cn(
                    'flex items-center gap-4 p-4 hover:bg-muted/30 transition group',
                    isOverdue && 'bg-red-50/50'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-base truncate">
                        {staff ? `${staff.firstName} ${staff.lastName}` : notice.userId}
                      </p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                        {notice.reason.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-sm text-muted-foreground">
                        {unit?.name ?? notice.housingUnitId} · Initiated{' '}
                        {new Date(notice.submittedAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                      <GracePeriodChip deadline={notice.gracePeriodDeadline} />
                    </div>
                  </div>
                  <PipelineMini notice={notice} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition ml-2 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Cleared notices */}
      {cleared.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b bg-emerald-50 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-base text-emerald-800">Cleared ({cleared.length})</h2>
          </div>
          <div className="divide-y">
            {cleared.map(notice => {
              const staff = users.find(u => u.id === notice.userId);
              const unit = housingUnits.find(u => u.id === notice.housingUnitId);
              return (
                <Link
                  key={notice.id}
                  href={`/management/exit/${notice.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition group opacity-70 hover:opacity-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">
                      {staff ? `${staff.firstName} ${staff.lastName}` : notice.userId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {unit?.name} · Cleared{' '}
                      {notice.clearedAt ? new Date(notice.clearedAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      }) : '—'}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">
                    <Shield className="h-3 w-3 mr-1" /> Cleared
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
