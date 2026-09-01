import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExitNoticesForUserAction } from '@/app/actions/exit';
import { ExitHistoryTable } from '@/components/features/history/ExitHistoryTable';
import { ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export const metadata = {
  title: 'My Exit History | OAU E-Housing',
  description: 'View all your past and present housing exit notices.',
};

export default async function StaffExitHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STAFF') redirect('/staff');

  const res = await getExitNoticesForUserAction();
  const notices = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/staff/exit"
            className="w-10 h-10 rounded-full border bg-card flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Exit Notice History</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              View your past and present housing exit notices.
            </p>
          </div>
        </div>
        
        <Link href="/staff/exit" className={buttonVariants({ variant: 'destructive', className: 'gap-2' })}>
          <LogOut className="h-4 w-4" />
          Exit Housing
        </Link>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <ExitHistoryTable 
          notices={notices}
          detailBasePath="/staff/exit/history"
        />
      </div>
    </div>
  );
}
