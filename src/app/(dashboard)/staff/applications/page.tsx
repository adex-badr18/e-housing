import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getActiveHousingTypes } from '@/lib/mock-api/endpoints/housing';
import { getApplicationsForUser } from '@/lib/mock-api/endpoints/applications';
import { getStaffProfile } from '@/lib/mock-api/endpoints/profile';
import { ApplicationWizard } from '@/components/features/application-wizard/ApplicationWizard';
import { DataTableSkeleton } from '@/components/shared/DataTableSkeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Apply for Housing | OAU E-Housing',
  description: 'Submit a housing application through the guided wizard.',
};

async function WizardContent({ userId }: { userId: string }) {
  const [housingTypes, applications, profile] = await Promise.all([
    getActiveHousingTypes(),
    getApplicationsForUser(userId),
    getStaffProfile(userId),
  ]);

  const hasExistingApplication = applications.some(
    (a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW'
  );

  return (
    <ApplicationWizard
      housingTypes={housingTypes}
      profile={profile}
      hasExistingApplication={hasExistingApplication}
    />
  );
}

export default async function StaffApplicationsPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  if (session.user.role !== 'STAFF') {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-3">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">Only staff members can access this page.</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="w-full space-y-6">
          <DataTableSkeleton columns={1} rows={4} />
        </div>
      }
    >
      <WizardContent userId={session.user.id} />
    </Suspense>
  );
}
