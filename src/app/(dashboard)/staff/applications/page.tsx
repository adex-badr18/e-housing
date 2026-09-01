import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getApplicationsForUserAction } from '@/app/actions/applications';
import { ApplicationHistoryTable } from '@/components/features/history/ApplicationHistoryTable';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export const metadata = {
  title: 'My Applications | OAU E-Housing',
  description: 'View and manage all your housing applications.',
};

export default async function StaffApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STAFF') redirect('/staff');

  const res = await getApplicationsForUserAction();
  const applications = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">My Applications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View, track, and manage all your housing applications.
          </p>
        </div>

        <Link
          href="/staff/applications/new"
          className={buttonVariants({ variant: 'default', className: 'gap-2 shadow-sm rounded-xl shrink-0' })}
        >
          <Plus className="h-4 w-4" />
          Apply for Housing
        </Link>
      </div>

      {/* Full-width Table Container */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm w-full">
        <ApplicationHistoryTable 
          applications={applications}
          detailBasePath="/staff/applications"
        />
      </div>
    </div>
  );
}
