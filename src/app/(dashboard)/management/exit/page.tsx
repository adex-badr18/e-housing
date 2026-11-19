import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExitNoticesForRole } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import Link from 'next/link';
import {
  ClipboardCheck, Clock, CheckCircle2, Shield, History, AlertTriangle,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExitNotice } from '@/lib/mock-api/db';
import { ExitPipelineTableClient } from '@/components/features/exit/ExitPipelineTableClient';

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

  // Build user map for the table
  const userMap = mockDB.users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, typeof mockDB.users[0]>);

  // Statistics
  const active = notices.filter(n => !n.isCleared && !n.isAdminTerminated && !n.isWithdrawn);
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
            <div key={stat.label} className="rounded-xl border bg-card p-4 flex items-center gap-3 shadow-sm">
              <Icon className={cn('h-8 w-8', stat.color)} />
              <div>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exit Clearance Pipeline Table */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <ExitPipelineTableClient
          notices={notices}
          detailBasePath="/management/exit"
          userMap={userMap}
        />
      </div>
    </div>
  );
}
