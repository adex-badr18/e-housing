import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getPaginatedOccupancies,
  getOccupancyStats,
} from '@/lib/mock-api/endpoints/occupancies';
import { getAllHousingTypes } from '@/lib/mock-api/endpoints/housing';
import { OccupanciesTableClient } from '@/components/features/occupancies/OccupanciesTableClient';
import type { OccupancyStatus } from '@/lib/mock-api/db';
import { Users2, CheckCircle2, LogOut, Building2 } from 'lucide-react';

export const metadata = {
  title: 'Housing Occupancies — OAU E-Housing',
  description: 'View and manage all housing occupancy records.',
};

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'] as const;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    housingType?: string;
    page?: string;
    limit?: string;
  }>;
}

async function OccupanciesContent({ searchParams }: PageProps) {
  const sp = await searchParams;

  const search = sp.search ?? '';
  const status = (sp.status as OccupancyStatus) || '';
  const housingTypeId = sp.housingType ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const limit = [10, 20, 50].includes(parseInt(sp.limit ?? '10', 10))
    ? parseInt(sp.limit ?? '10', 10)
    : 10;

  const [result, stats, housingTypes] = await Promise.all([
    getPaginatedOccupancies({ search, status, housingTypeId, page, limit }),
    getOccupancyStats(),
    getAllHousingTypes(),
  ]);

  const statCards = [
    {
      label: 'Total Occupancies',
      value: stats.total,
      sub: 'all time',
      icon: Users2,
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Active',
      value: stats.active,
      sub: 'currently housed',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Exited',
      value: stats.exited,
      sub: 'vacated units',
      icon: LogOut,
      color: 'text-rose-700',
      bg: 'bg-rose-50 border-rose-200',
    },
    {
      label: 'BQ Slots',
      value: stats.bqCount,
      sub: 'in occupied units',
      icon: Building2,
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-600/20">
          <Users2 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[rgb(27,34,50)]">
            Housing Occupancies
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Full registry of housing allocations — search, filter, and manage occupancy records.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${color}`} />
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <OccupanciesTableClient
        initialData={result}
        housingTypes={housingTypes}
        initialSearch={search}
        initialStatus={status}
        initialHousingTypeId={housingTypeId}
        initialPage={page}
        initialLimit={limit}
      />
    </div>
  );
}

export default async function OccupanciesPage(props: PageProps) {
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
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-12 bg-gray-200 rounded-xl w-72" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      }
    >
      <OccupanciesContent {...props} />
    </Suspense>
  );
}
