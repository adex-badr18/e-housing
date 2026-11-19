import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getActiveExitNoticeForUser } from '@/lib/mock-api/endpoints/exit';
import { mockDB } from '@/lib/mock-api/db';
import { ExitNoticeReadOnlyView } from '@/components/features/exit/ExitNoticeReadOnlyView';
import {
  DoorOpen, Home, AlertCircle, History, MapPin,
  Phone, Clock, Info,
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
  const initiator = activeExitNotice?.initiatedByUserId
    ? mockDB.users.find(u => u.id === activeExitNotice.initiatedByUserId)
    : null;
  const initiatorName = initiator ? `${initiator.firstName} ${initiator.lastName}` : null;

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
            <p className="text-muted-foreground text-base mt-1">
              Track your exit clearance progress and grace period deadline.
            </p>
          </div>
        </div>

        <Link
          href="/staff/exit/history"
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2 rounded-xl text-muted-foreground' })}
        >
          <History className="h-4 w-4" />
          View Exit History
        </Link>
      </div>

      {/* No occupancy guard */}
      {!currentUnit ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center gap-3">
          <Home className="h-10 w-10 text-muted-foreground" />
          <h2 className="font-semibold text-lg">No Active Occupancy</h2>
          <p className="text-base text-muted-foreground max-w-sm">
            You do not currently have an active housing allocation. There is nothing to exit from.
          </p>
          <Link href="/staff" className={buttonVariants({ variant: 'outline' })}>
            Back to Dashboard
          </Link>
        </div>
      ) : activeExitNotice ? (
        /* Exit notice active — show tracker */
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-base text-primary">Exit Process Active</p>
              <p className="text-sm text-primary/80 mt-1">
                Your exit has been initiated by the Estate Office. Track your clearance progress
                and grace period deadline below. Your clearance certificate will be issued once all
                three stages pass.
              </p>
            </div>
          </div>
          <ExitNoticeReadOnlyView notice={activeExitNotice} initiatorName={initiatorName} />
        </div>
      ) : (
        /* No active notice — show visit-office card */
        <div className="space-y-4">
          {/* How-to card */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-5 border-b bg-muted/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <DoorOpen className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Wishing to Vacate?</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Currently occupying: <strong>{currentUnit.name}</strong>
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-base text-muted-foreground">
                Exit notices are no longer self-submitted. To begin your exit process, you must
                <strong> visit the Estate Office in person</strong>. An Estate Officer will open
                your occupancy record and initiate the exit on your behalf.
              </p>

              {/* Steps */}
              <ol className="space-y-3">
                {[
                  {
                    step: 1,
                    title: 'Visit the Estate Office',
                    desc: 'Bring a valid ID and inform an Estate Officer of your intention to vacate.',
                  },
                  {
                    step: 2,
                    title: 'Estate Officer initiates the exit',
                    desc: 'The officer will record your exit reason and open the 90-day clearance process.',
                  },
                  {
                    step: 3,
                    title: 'Complete Housing & Electrical clearances',
                    desc: 'Settle all outstanding payments and ensure electrical fittings are in good condition.',
                  },
                  {
                    step: 4,
                    title: 'Estate pre-vacation inspection',
                    desc: 'The Estate Officer will conduct a final walkthrough of the property.',
                  },
                  {
                    step: 5,
                    title: 'Clearance certificate issued',
                    desc: 'Once all stages pass, your clearance certificate will be available here.',
                  },
                ].map(({ step, title, desc }) => (
                  <li key={step} className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                      {step}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Estate Office contact */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Estate Office Location
                </p>
                <p className="text-sm text-blue-700">
                  OAU Main Campus, Housing Unit Building, Ground Floor
                </p>
                <p className="text-sm text-blue-700 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Open Monday – Friday, 8:00 AM – 4:00 PM
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  A <strong>90-day grace period</strong> will be automatically set from the date
                  the exit is initiated. Ensure all clearance stages are completed within this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
