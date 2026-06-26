import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getManagementMetrics } from '@/lib/mock-api/endpoints/metrics';
import { MetricCard } from '@/components/shared/MetricCard';
import { Home, ClipboardList, CheckSquare, Clock, AlertTriangle } from 'lucide-react';

export default async function ManagementDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const managementRoles = ['HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN', 'ELECTRICAL_OFFICER'];
  
  if (!managementRoles.includes(session.user.role)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
      </div>
    );
  }

  const metrics = await getManagementMetrics();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Management Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}. Here is an overview of the housing system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Housing Units"
          value={metrics.totalHousingUnits}
          icon={Home}
          description="Total units in inventory"
        />
        <MetricCard
          title="Vacant Units"
          value={metrics.vacantUnits}
          icon={CheckSquare}
          description="Available for allocation"
        />
        <MetricCard
          title="Pending Applications"
          value={metrics.pendingApplications}
          icon={Clock}
          description="Awaiting review/scoring"
        />
        <MetricCard
          title="Pending Exit Inspections"
          value={metrics.pendingHousingInspections + metrics.pendingElectricalInspections + metrics.pendingEstateInspections}
          icon={AlertTriangle}
          description="Exit notices awaiting inspection"
        />
      </div>
    </div>
  );
}
