import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getExitNoticeById, getExitNoticeAuditLog } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import { ExitAuditLogTable } from '@/components/features/exit/ExitAuditLogTable';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, ScrollText } from 'lucide-react';
import type { Role } from '@/lib/mock-api/db';

export const metadata = { title: 'Exit Audit Log — OAU E-Housing' };

const ALLOWED_ROLES = ['ESTATE_OFFICER', 'DVC_ADMIN', 'SUPER_ADMIN'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

interface Props {
  params: Promise<{ exitId: string }>;
}

export default async function ExitAuditLogPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!ALLOWED_ROLES.includes(session.user.role as AllowedRole)) redirect('/management/exit');

  const { exitId } = await params;

  const notice = await getExitNoticeById(exitId);
  if (!notice) notFound();

  const logs = await getExitNoticeAuditLog(exitId, session.user.role);
  const staff = mockDB.findUserById(notice.userId);
  const users = mockDB.users;

  const staffName = staff ? `${staff.firstName} ${staff.lastName}` : notice.userId;

  // Build a quick name lookup from userId → full name for actor resolution
  const usersById: Record<string, string> = Object.fromEntries(
    users.map(u => [u.id, `${u.firstName} ${u.lastName}`])
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/management/exit" className="hover:text-foreground transition flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Exit Pipeline
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/management/exit/${exitId}`}
          className="hover:text-foreground transition truncate max-w-[160px]"
        >
          {staffName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Audit Log</span>
      </div>

      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ScrollText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Exit Audit Log</h1>
          <p className="text-base text-muted-foreground mt-1">
            Full event trail for <strong>{staffName}</strong>&apos;s exit notice —{' '}
            newest events shown first.
          </p>
        </div>
      </div>

      {/* Notice meta strip */}
      <div className="rounded-xl border bg-card px-5 py-3 flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Unit: </span>
          <span className="font-semibold">
            {mockDB.findUnitById(notice.housingUnitId)?.name ?? notice.housingUnitId}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="text-muted-foreground">Initiated: </span>
          <span className="font-semibold">
            {new Date(notice.submittedAt).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
        {notice.gracePeriodDeadline && (
          <>
            <div className="h-4 w-px bg-border" />
            <div>
              <span className="text-muted-foreground">Grace Deadline: </span>
              <span className="font-semibold">
                {new Date(notice.gracePeriodDeadline).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          </>
        )}
        <div className="h-4 w-px bg-border" />
        <div>
          <span className="text-muted-foreground">Status: </span>
          <span className={`font-semibold ${
            notice.isCleared ? 'text-emerald-600' :
            notice.isAdminTerminated ? 'text-slate-600' :
            'text-amber-600'
          }`}>
            {notice.isCleared ? 'Cleared' : notice.isAdminTerminated ? 'Closed' : 'In Progress'}
          </span>
        </div>
      </div>

      {/* Audit log table */}
      <ExitAuditLogTable logs={logs} usersById={usersById} />
    </div>
  );
}
