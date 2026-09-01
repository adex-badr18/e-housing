import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getActiveHousingTypes } from '@/lib/mock-api/endpoints/housing';
import { getApplicationsForUser } from '@/lib/mock-api/endpoints/applications';
import { getStaffProfile } from '@/lib/mock-api/endpoints/profile';
import { ApplicationWizard } from '@/components/features/application-wizard/ApplicationWizard';
import { DataTableSkeleton } from '@/components/shared/DataTableSkeleton';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Apply for Housing | OAU E-Housing',
  description: 'Submit a new housing application through the guided wizard.',
};

async function WizardContent({ userId }: { userId: string }) {
  const [housingTypes, applications, profile] = await Promise.all([
    getActiveHousingTypes(),
    getApplicationsForUser(userId),
    getStaffProfile(userId),
  ]);

  const activeApplication = applications.find(
    (a) => ['PENDING', 'UNDER_REVIEW', 'QUEUED', 'QUIT_REQUESTED'].includes(a.status)
  );

  return (
    <ApplicationWizard
      housingTypes={housingTypes}
      profile={profile}
      activeApplication={activeApplication || null}
    />
  );
}

export default async function NewHousingApplicationPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STAFF') redirect('/staff');

  return (
    <div className="space-y-6 w-full max-w-5xl">
      <Link
        href="/staff/applications"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Applications
      </Link>

      <Suspense
        fallback={
          <div className="w-full space-y-6">
            <DataTableSkeleton columns={1} rows={4} />
          </div>
        }
      >
        <WizardContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}
