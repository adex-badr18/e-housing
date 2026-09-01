import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getActiveExitNoticeForUser } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import { ExitNoticeForm } from '@/components/features/exit/ExitNoticeForm';
import { ExitStatusTracker } from '@/components/features/exit/ExitStatusTracker';
import {
  DoorOpen, Home, AlertCircle, History,
} from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Housing Exit — OAU E-Housing' };

export default async function StaffExitPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STAFF') redirect('/staff');

  // Fetch the staff's active occupancy and any existing exit notice
  const occupancy = mockDB.findActiveOccupancyByUserId(session.user.id);
  const currentUnit = occupancy ? mockDB.findUnitById(occupancy.housingUnitId) : null;
  const activeExitNotice = await getActiveExitNoticeForUser(session.user.id);
  
  const hasPendingQuitRequest = activeExitNotice 
    ? mockDB.quitRequests.some(q => q.entityId === activeExitNotice.id && q.entityType === 'ExitNotice' && q.status === 'PENDING')
    : false;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <DoorOpen className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Housing Exit</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Initiate your departure from university housing and track your clearance progress.
            </p>
          </div>
        </div>
        
        <Link href="/staff/exit/history" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2 rounded-xl text-muted-foreground' })}>
          <History className="h-4 w-4" />
          View Exit History
        </Link>
      </div>

      {/* No occupancy guard */}
      {!currentUnit ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center gap-3">
          <Home className="h-10 w-10 text-muted-foreground" />
          <h2 className="font-semibold text-lg">No Active Occupancy</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            You do not currently have an active housing allocation. There is nothing to exit from.
          </p>
          <Link href="/staff" className={buttonVariants({ variant: 'outline' })}>
            Back to Dashboard
          </Link>
        </div>
      ) : activeExitNotice ? (
        /* Already submitted — show tracker */
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-primary">Exit Notice Active</p>
              <p className="text-xs text-primary/80 mt-1">
                Your exit notice has been submitted. Track your clearance progress below.
                The certificate will be available once all stages pass.
              </p>
            </div>
          </div>
          <ExitStatusTracker notice={activeExitNotice} hasPendingQuitRequest={hasPendingQuitRequest} />
        </div>
      ) : (
        /* No notice yet — show the submission form */
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold">Submit Exit Notice</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Currently occupying: <strong>{currentUnit.name}</strong>
            </p>
          </div>
          <div className="p-6">
            <ExitNoticeForm currentUnit={currentUnit} />
          </div>
        </div>
      )}
    </div>
  );
}
