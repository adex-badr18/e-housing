import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getExitNoticeById } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import { ClearancePipeline } from '@/components/features/exit/ClearancePipeline';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, User, Home, Calendar, FileText,
  ChevronRight, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Exit Notice Detail — OAU E-Housing' };

const MANAGEMENT_ROLES = [
  'SUPER_ADMIN', 'HOUSING_SECRETARY', 'ELECTRICAL_OFFICER', 'ESTATE_OFFICER',
] as const;

type ManagementRole = typeof MANAGEMENT_ROLES[number];

interface Props {
  params: Promise<{ exitId: string }>;
}

export default async function ExitNoticeDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!MANAGEMENT_ROLES.includes(session.user.role as ManagementRole)) redirect('/staff');

  const { exitId } = await params;
  const notice = await getExitNoticeById(exitId);
  if (!notice) notFound();

  const staff = mockDB.findUserById(notice.userId);
  const staffProfile = mockDB.findProfileByUserId(notice.userId);
  const unit = mockDB.findUnitById(notice.housingUnitId);
  const housingType = unit ? mockDB.housingTypes.find(t => t.id === unit.housingTypeId) : null;
  const users = mockDB.users;

  const reasonLabels: Record<string, string> = {
    RETIREMENT: 'Retirement',
    RESIGNATION: 'Resignation',
    RELOCATION: 'Relocation',
    TRANSFER: 'Transfer',
    DEATH: 'Death of Occupant',
    OTHER: 'Other',
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/management/exit" className="hover:text-foreground transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit Pipeline
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">
          {staff ? `${staff.firstName} ${staff.lastName}` : exitId}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Exit Notice Detail</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the 3-stage clearance inspection for this exit notice.
          </p>
        </div>
        {notice.isCleared && (
          <Link
            href={`/management/exit/${exitId}/certificate`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm shrink-0"
          >
            <Shield className="h-4 w-4" />
            View Certificate
          </Link>
        )}
      </div>

      {/* Applicant info card */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Staff & Property Information
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Staff Member</p>
                <p className="font-semibold">
                  {staff ? `${staff.firstName} ${staff.lastName}` : notice.userId}
                </p>
                {staff && <p className="text-xs text-muted-foreground">{staff.email}</p>}
              </div>
            </div>
            {staffProfile && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Department / Rank</p>
                  <p className="font-semibold">{staffProfile.department}</p>
                  <p className="text-xs text-muted-foreground">{staffProfile.rank} · {staffProfile.salaryGradeLevel}</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Home className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Housing Unit</p>
                <p className="font-semibold">{unit?.name ?? notice.housingUnitId}</p>
                {housingType && <p className="text-xs text-muted-foreground">{housingType.name}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
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
        <div className={cn(
          'mt-4 pt-4 border-t flex items-center gap-3 text-sm',
        )}>
          <p className="text-muted-foreground text-xs">Exit Reason:</p>
          <Badge variant="outline" className="capitalize font-semibold">
            {reasonLabels[notice.reason] ?? notice.reason}
          </Badge>
          {notice.customReason && (
            <span className="text-muted-foreground text-xs italic">— {notice.customReason}</span>
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
        <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Clearance Pipeline
        </h2>
        <ClearancePipeline
          notice={notice}
          currentUserRole={session.user.role}
          users={users}
        />
      </div>
    </div>
  );
}
