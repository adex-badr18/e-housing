import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllExitNoticesAction } from '@/app/actions/exit';
import { ExitHistoryTable } from '@/components/features/history/ExitHistoryTable';
import { mockDB } from '@/lib/mock-api/db';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'All Exit Notices | OAU E-Housing',
  description: 'View the full history of all exit notices.',
};

export default async function ManagementExitHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  
  const adminRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'ELECTRICAL_OFFICER', 'DVC_ADMIN'] as const;
  if (!adminRoles.includes(session.user.role as typeof adminRoles[number])) {
    redirect('/staff');
  }

  const res = await getAllExitNoticesAction();
  const notices = res.success && res.data ? res.data : [];

  // Build user map for the table
  const userMap = mockDB.users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, typeof mockDB.users[0]>);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/management/exit"
          className="w-10 h-10 rounded-full border bg-card flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">All Exit Notices (History)</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View all exit notices across the system, including withdrawn and cleared ones.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <ExitHistoryTable 
          notices={notices}
          detailBasePath="/management/exit/history"
          userMap={userMap}
        />
      </div>
    </div>
  );
}
