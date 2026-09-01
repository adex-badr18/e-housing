import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExitNoticesForRole } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck, Home, Zap, Building2, ChevronRight,
  Clock, CheckCircle2, XCircle, Shield, History
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExitNotice } from '@/lib/mock-api/db';

export const metadata = { title: 'Exit Pipeline — OAU E-Housing' };

const MANAGEMENT_ROLES = [
  'SUPER_ADMIN', 'HOUSING_SECRETARY', 'ELECTRICAL_OFFICER', 'ESTATE_OFFICER',
] as const;

type ManagementRole = typeof MANAGEMENT_ROLES[number];

function StatusBadge({ status }: { status: 'PENDING' | 'PASSED' | 'FAILED' }) {
  if (status === 'PASSED') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-medium border">Passed</Badge>;
  if (status === 'FAILED') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-medium border">Failed</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-medium border">Pending</Badge>;
}

function PipelineMini({ notice }: { notice: ExitNotice }) {
  const stages = [
    { icon: Home, status: notice.housingInspectionStatus, label: 'H' },
    { icon: Zap, status: notice.electricalInspectionStatus, label: 'E' },
    { icon: Building2, status: notice.estateInspectionStatus, label: 'Est' },
  ];

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        return (
          <div key={i} className="flex items-center gap-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold',
              stage.status === 'PASSED' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
              stage.status === 'FAILED' ? 'bg-red-100 border-red-300 text-red-700' :
              'bg-muted border-border text-muted-foreground'
            )}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

export default async function ExitPipelinePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!MANAGEMENT_ROLES.includes(session.user.role as ManagementRole)) redirect('/staff');

  const notices = await getExitNoticesForRole(session.user.role);
  const users = mockDB.users;
  const housingUnits = mockDB.housingUnits;

  const active = notices.filter(n => !n.isCleared);
  const cleared = notices.filter(n => n.isCleared);

  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: 'All Exit Notices (Super Admin)',
    HOUSING_SECRETARY: 'Exit Pipeline — Stage 1: Housing Inspection Queue',
    ELECTRICAL_OFFICER: 'Exit Pipeline — Stage 2: Electrical Inspection Queue',
    ESTATE_OFFICER: 'Exit Pipeline — Stage 3: Estate Inspection Queue',
  };
  const roleLabel = roleLabelMap[session.user.role] ?? 'Exit Pipeline';

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
            <p className="text-sm text-muted-foreground mt-1">{roleLabel}</p>
          </div>
        </div>
        <Link href="/management/exit/history" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2 rounded-xl text-muted-foreground' })}>
          <History className="h-4 w-4" />
          View Full History
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total In Queue', value: notices.length, icon: ClipboardCheck, color: 'text-primary' },
          { label: 'Active', value: active.length, icon: Clock, color: 'text-amber-600' },
          { label: 'Cleared', value: cleared.length, icon: Shield, color: 'text-emerald-600' },
          { label: 'Awaiting My Stage', value: active.filter(n => {
            if (session.user.role === 'HOUSING_SECRETARY') return n.housingInspectionStatus === 'PENDING';
            if (session.user.role === 'ELECTRICAL_OFFICER') return n.electricalInspectionStatus === 'PENDING';
            if (session.user.role === 'ESTATE_OFFICER') return n.estateInspectionStatus === 'PENDING';
            return false;
          }).length, icon: CheckCircle2, color: 'text-blue-600' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <Icon className={cn('h-8 w-8', stat.color)} />
              <div>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active notices table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <h2 className="font-semibold text-sm">Active Notices ({active.length})</h2>
        </div>

        {active.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Queue is clear</p>
            <p className="text-sm mt-1">No exit notices require your attention right now.</p>
          </div>
        ) : (
          <div className="divide-y">
            {active.map(notice => {
              const staff = users.find(u => u.id === notice.userId);
              const unit = housingUnits.find(u => u.id === notice.housingUnitId);
              return (
                <Link
                  key={notice.id}
                  href={`/management/exit/${notice.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {staff ? `${staff.firstName} ${staff.lastName}` : notice.userId}
                      </p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                        {notice.reason.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Unit: {unit?.name ?? notice.housingUnitId} ·{' '}
                      Submitted {new Date(notice.submittedAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <PipelineMini notice={notice} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition ml-2" />
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
            <h2 className="font-semibold text-sm text-emerald-800">Cleared ({cleared.length})</h2>
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
                    <p className="font-semibold text-sm truncate">
                      {staff ? `${staff.firstName} ${staff.lastName}` : notice.userId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unit?.name} · Cleared {notice.clearedAt ? new Date(notice.clearedAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
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
