import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllHousingTypes, getAllHousingUnits } from '@/lib/mock-api/endpoints/housing';
import { HousingManagementClient } from '@/components/features/housing-management/HousingManagementClient';
import { DataTableSkeleton } from '@/components/shared/DataTableSkeleton';

export const metadata = {
  title: 'Housing Configuration & Inventory | OAU E-Housing',
  description: 'Manage housing types and physical unit inventory.',
};

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER'] as const;

async function HousingInventoryContent() {
  const [housingTypes, housingUnits] = await Promise.all([
    getAllHousingTypes(),
    getAllHousingUnits(),
  ]);

  return (
    <HousingManagementClient
      housingTypes={housingTypes}
      housingUnits={housingUnits}
    />
  );
}

export default async function AdminInventoryPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  if (!ALLOWED_ROLES.includes(session.user.role as typeof ALLOWED_ROLES[number])) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-3">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<DataTableSkeleton columns={8} rows={5} />}>
      <HousingInventoryContent />
    </Suspense>
  );
}
