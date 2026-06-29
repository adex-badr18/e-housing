import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDashboard } from '@/components/features/dashboard/AdminDashboard';
import { HousingSecretaryDashboard } from '@/components/features/dashboard/HousingSecretaryDashboard';
import { EstateOfficerDashboard } from '@/components/features/dashboard/EstateOfficerDashboard';
import { DvcAdminDashboard } from '@/components/features/dashboard/DvcAdminDashboard';
import { ElectricalOfficerDashboard } from '@/components/features/dashboard/ElectricalOfficerDashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role;

  // Polymorphic orchestration layer based on user role
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Super Admin Portal</h1>
            <p className="text-muted-foreground mt-1">Overview of system metrics, activities, and audit logs.</p>
          </div>
          <AdminDashboard />
        </div>
      );

    case 'HOUSING_SECRETARY':
      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Housing Secretary Portal</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session.user.name}. Manage applications and housing exit clearances.</p>
          </div>
          <HousingSecretaryDashboard />
        </div>
      );

    case 'ESTATE_OFFICER':
      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Estate Officer Portal</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session.user.name}. Monitor housing inventory and execute estate clearances.</p>
          </div>
          <EstateOfficerDashboard />
        </div>
      );

    case 'DVC_ADMIN':
      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-oau-navy">DVC Administration Portal</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session.user.name}. Review finalized scores and issue allocations.</p>
          </div>
          <DvcAdminDashboard />
        </div>
      );

    case 'ELECTRICAL_OFFICER':
      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Electrical Department Portal</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session.user.name}. Manage electrical safety inspections for exits.</p>
          </div>
          <ElectricalOfficerDashboard />
        </div>
      );

    case 'STAFF':
      redirect('/staff');

    default:
      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {session.user.name}.</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-t-[3px] border-t-oau-gold shadow-sm">
              <CardHeader>
                <CardTitle className="text-oau-navy">Welcome back</CardTitle>
                <CardDescription>System Overview</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You are logged in as <strong className="text-oau-navy">{(role as string)?.replace('_', ' ')}</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
  }
}
