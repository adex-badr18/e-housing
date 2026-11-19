import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getExitNoticeById } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import { ClearancePipeline } from '@/components/features/exit/ClearancePipeline';
import { GracePeriodBanner } from '@/components/features/exit/GracePeriodBanner';
import { ExtendGracePeriodModal } from '@/components/features/exit/ExtendGracePeriodModal';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, User, Home, Calendar, FileText,
  ChevronRight, Shield, ScrollText, FileX2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/mock-api/db';

export const metadata = { title: 'Exit Notice Detail — OAU E-Housing' };

const ALLOWED_ROLES = [
  'SUPER_ADMIN', 'HOUSING_SECRETARY', 'ELECTRICAL_OFFICER',
  'ESTATE_OFFICER', 'DVC_ADMIN',
] as const;

type AllowedRole = typeof ALLOWED_ROLES[number];

const EXIT_REASON_LABELS: Record<string, string> = {
  RETIREMENT:        'Retirement',
  RESIGNATION:       'Resignation',
  RELOCATION:        'Personal Relocation',
  TRANSFER:          'Transfer to Another Institution',
  DEATH:             'Death of Occupant',
  ALLOCATION_CHANGE: 'Change of Allocation (Promotion)',
  OTHER:             'Other',
};

const EXTEND_ROLES: AllowedRole[] = ['ESTATE_OFFICER', 'SUPER_ADMIN'];
const AUDIT_ROLES: AllowedRole[] = ['ESTATE_OFFICER', 'DVC_ADMIN', 'SUPER_ADMIN'];

interface Props {
  params: Promise<{ exitId: string }>;
}

export default async function ExitNoticeDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!ALLOWED_ROLES.includes(session.user.role as AllowedRole)) redirect('/staff');

  const { exitId } = await params;
  const notice = await getExitNoticeById(exitId);
  if (!notice) notFound();

  const staff = mockDB.findUserById(notice.userId);
  const staffProfile = mockDB.findProfileByUserId(notice.userId);
  const unit = mockDB.findUnitById(notice.housingUnitId);
  const housingType = unit ? mockDB.housingTypes.find(t => t.id === unit.housingTypeId) : null;
  const users = mockDB.users;

  const userRole = session.user.role as AllowedRole;
  const canExtend = EXTEND_ROLES.includes(userRole) && !notice.isCleared && !notice.isAdminTerminated;
  const canViewAudit = AUDIT_ROLES.includes(userRole);
  const isDvcAdmin = userRole === 'DVC_ADMIN';

  const staffName = staff ? `${staff.firstName} ${staff.lastName}` : notice.userId;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/management/exit" className="hover:text-foreground transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit Pipeline
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">{staffName}</span>
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Exit Notice Detail</h1>
          <p className="text-base text-muted-foreground mt-1">
            {isDvcAdmin
              ? 'Read-only view — DVC Admin oversight'
              : 'Manage the 3-stage clearance pipeline for this exit notice.'}
          </p>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 flex-wrap">
          {canViewAudit && (
            <Link
              href={`/management/exit/${exitId}/audit`}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition"
            >
              <ScrollText className="h-4 w-4" />
              Audit Log
            </Link>
          )}
          {canExtend && notice.gracePeriodDeadline && (
            <ExtendGracePeriodModal
              exitNoticeId={notice.id}
              occupantName={staffName}
              currentDeadline={notice.gracePeriodDeadline}
              alreadyExtended={notice.gracePeriodExtended}
            />
          )}
          {notice.isCleared && (
            <Link
              href={`/management/exit/${exitId}/certificate`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
            >
              <Shield className="h-4 w-4" />
              View Certificate
            </Link>
          )}
        </div>
      </div>

      {/* Grace period banner — shown for all active notices */}
      {!notice.isCleared && !notice.isAdminTerminated && notice.gracePeriodDeadline && (
        <GracePeriodBanner
          deadline={notice.gracePeriodDeadline}
          extended={notice.gracePeriodExtended}
          extensionDays={notice.gracePeriodExtensionDays ?? undefined}
        />
      )}

      {/* Admin-terminated banner */}
      {notice.isAdminTerminated && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 flex items-start gap-3">
          <FileX2 className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">Exit Notice Administratively Closed</p>
            {notice.adminTerminatedReason && (
              <p className="text-sm text-slate-600 mt-0.5">Reason: <em>{notice.adminTerminatedReason}</em></p>
            )}
            {notice.adminTerminatedAt && (
              <p className="text-xs text-slate-500 mt-0.5">
                Closed on {new Date(notice.adminTerminatedAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Staff & property info card */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Staff &amp; Property Information
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Staff Member</p>
                <p className="font-semibold">{staffName}</p>
                {staff && <p className="text-xs text-muted-foreground">{staff.email}</p>}
              </div>
            </div>
            {staffProfile && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Department / Rank</p>
                  <p className="font-semibold">{staffProfile.department}</p>
                  <p className="text-xs text-muted-foreground">
                    {staffProfile.rank}
                    {staffProfile.salaryLevel ? ` · Level ${staffProfile.salaryLevel}` : ''}
                    {staffProfile.salaryStep ? ` (${staffProfile.salaryStep})` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Home className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Housing Unit</p>
                <p className="font-semibold">{unit?.name ?? notice.housingUnitId}</p>
                {housingType && <p className="text-xs text-muted-foreground">{housingType.name}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Initiated</p>
                <p className="font-semibold">
                  {new Date(notice.submittedAt).toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reason row */}
        <div className="mt-4 pt-4 border-t flex items-center gap-3 text-sm flex-wrap">
          <p className="text-muted-foreground">Exit Reason:</p>
          <Badge variant="outline" className="font-semibold">
            {EXIT_REASON_LABELS[notice.reason] ?? notice.reason}
          </Badge>
          {notice.customReason && (
            <span className="text-muted-foreground text-sm italic">— {notice.customReason}</span>
          )}
        </div>

        {notice.additionalNotes && (
          <div className="mt-3 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Notes: </span>
            {notice.additionalNotes}
          </div>
        )}
      </div>

      {/* Clearance Pipeline */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Clearance Pipeline
        </h2>
        <ClearancePipeline
          notice={notice}
          currentUserRole={session.user.role as Role}
          users={users}
        />
      </div>
    </div>
  );
}
