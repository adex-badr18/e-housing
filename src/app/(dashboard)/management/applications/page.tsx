import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getQuitRequestsAction } from '@/app/actions/applications';
import { History, ClipboardList } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { Role } from '@/lib/mock-api/db';
import { QuitRequestsPanel } from '@/components/features/application-review/QuitRequestsPanel';
import { ManagementApplicationsTableClient } from '@/components/features/application-review/ManagementApplicationsTableClient';

export const metadata = {
  title: 'Application Review Queue — OAU E-Housing',
  description: 'Review and process housing applications through the multi-stage pipeline.',
};

const ROLE_HEADINGS: Partial<Record<Role, { title: string; subtitle: string }>> = {
  HOUSING_SECRETARY: {
    title:    'Application Review Queue — Stage 1',
    subtitle: 'Verify staff details, compute scores, select proposed units, or review returned applications.',
  },
  ESTATE_OFFICER: {
    title:    'Application Review Queue — Stage 2',
    subtitle: 'Perform physical inspection, allocate vacant units, or collaborate on returned applications.',
  },
  DVC_ADMIN: {
    title:    'Application Review Queue — Stage 3',
    subtitle: 'Review applications forwarded by Estate Officer and give final approval, rejection, or return instructions.',
  },
  SUPER_ADMIN: {
    title:    'All Housing Applications',
    subtitle: 'Full management overview of every application across all stages.',
  },
};

export default async function ManagementApplicationsPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  const allowedRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
      </div>
    );
  }

  let quitRequests: import('@/lib/mock-api/endpoints/applications').EnrichedQuitRequest[] = [];
  const managementRoles = ['HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN', 'SUPER_ADMIN'] as const;
  if (managementRoles.includes(session.user.role as typeof managementRoles[number])) {
    const qResult = await getQuitRequestsAction();
    if (qResult.success && qResult.data) {
      quitRequests = qResult.data;
    }
  }

  const heading = ROLE_HEADINGS[session.user.role] ?? {
    title:    'Applications',
    subtitle: 'Review housing applications.',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">{heading.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{heading.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/management/applications/history" className={buttonVariants({ variant: 'outline', className: 'gap-2 rounded-xl text-muted-foreground' })}>
            <History className="h-4 w-4" />
            View Full History
          </Link>
        </div>
      </div>

      {/* Quit requests panel */}
      {quitRequests.length > 0 && (
        <div className="mb-6">
          <QuitRequestsPanel requests={quitRequests} />
        </div>
      )}

      {/* Interactive applications table */}
      <ManagementApplicationsTableClient userRole={session.user.role} />
    </div>
  );
}
