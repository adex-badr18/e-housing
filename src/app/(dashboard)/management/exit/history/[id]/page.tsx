import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getExitNoticeWithProfileAction } from '@/app/actions/exit';
import { ExitStatusTracker } from '@/components/features/exit/ExitStatusTracker';
import { AdminTerminateButton } from '@/components/features/application-review/AdminTerminateButton';
import Link from 'next/link';
import { ArrowLeft, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { mockDB } from '@/lib/mock-api/db';

export const metadata = { title: 'Exit Notice Detail | Management' };

export default async function ManagementExitHistoryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  
  const adminRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'ELECTRICAL_OFFICER', 'DVC_ADMIN'] as const;
  if (!adminRoles.includes(session.user.role as typeof adminRoles[number])) {
    redirect('/staff');
  }

  const res = await getExitNoticeWithProfileAction(params.id);
  if (!res.success || !res.data) notFound();

  const { notice, applicantUser, applicantProfile, unit } = res.data;
  
  const hasPendingQuitRequest = mockDB.quitRequests.some(
    q => q.entityId === notice.id && q.entityType === 'ExitNotice' && q.status === 'PENDING'
  );

  const canTerminate = !notice.isCleared && !notice.isWithdrawn;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/management/exit/history"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exit History
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Exit Notice Details</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Submitted on {format(new Date(notice.submittedAt), 'dd MMMM yyyy, HH:mm')}
            </p>
          </div>
          
          {canTerminate && (
            <AdminTerminateButton entityId={notice.id} entityType="ExitNotice" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-2xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Applicant</h3>
            <p className="text-sm mt-0.5">
              {applicantUser ? `${applicantUser.firstName} ${applicantUser.lastName}` : 'Unknown'}
            </p>
            {applicantProfile && (
              <p className="text-xs text-muted-foreground mt-1">
                {applicantProfile.rank} • {applicantProfile.department}
              </p>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Housing Unit</h3>
            <p className="text-sm mt-0.5">
              {unit ? unit.name : 'Unknown Unit'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {notice.housingUnitId}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6">
        <ExitStatusTracker notice={notice} hasPendingQuitRequest={hasPendingQuitRequest} />
      </div>
    </div>
  );
}
