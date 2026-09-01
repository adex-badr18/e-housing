import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { mockDB } from '@/lib/mock-api/db';
import { ExitStatusTracker } from '@/components/features/exit/ExitStatusTracker';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export const metadata = { title: 'Exit Notice Details | OAU E-Housing' };

export default async function StaffExitHistoryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STAFF') redirect('/staff');

  const notice = mockDB.exitNotices.find(e => e.id === params.id && e.userId === session.user.id);
  if (!notice) notFound();

  const unit = mockDB.findUnitById(notice.housingUnitId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/staff/exit/history"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Exit Notice Details</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review your exit notice progression.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{unit ? unit.name : 'Unknown Unit'}</h2>
            <p className="text-muted-foreground text-sm">Housing Unit ID: {notice.housingUnitId}</p>
          </div>
        </div>
      </div>

      <ExitStatusTracker notice={notice} />
    </div>
  );
}
