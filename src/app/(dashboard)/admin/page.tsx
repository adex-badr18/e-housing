import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAdminMetrics } from '@/lib/mock-api/endpoints/metrics';
import { MetricCard } from '@/components/shared/MetricCard';
import { Home, Users, Building, ClipboardList } from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Double check authorization
  if (session.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
      </div>
    );
  }

  const metrics = await getAdminMetrics();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of system metrics and user management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          description="Active users on the system"
        />
        <MetricCard
          title="Total Housing Units"
          value={metrics.totalHousingUnits}
          icon={Home}
          description="Total units defined in inventory"
        />
        <MetricCard
          title="Vacant Units"
          value={metrics.vacantUnits}
          icon={Building}
          description="Available for allocation"
        />
        <MetricCard
          title="Total Applications"
          value={metrics.totalApplications}
          icon={ClipboardList}
          description="All time applications"
        />
      </div>
    </div>
  );
}
