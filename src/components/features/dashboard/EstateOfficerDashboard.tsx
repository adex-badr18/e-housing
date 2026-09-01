import {
  ClipboardList, Home, Building, AlertCircle,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { SnapshotTable } from '@/components/shared/SnapshotTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { getEstateDashboardData } from '@/lib/mock-api/endpoints/metrics';
import { cn } from '@/lib/utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function UnitStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    VACANT:           'bg-emerald-100 text-emerald-700 border-emerald-200',
    OCCUPIED:         'bg-blue-100 text-blue-700 border-blue-200',
    UNDER_MAINTENANCE:'bg-amber-100 text-amber-700 border-amber-200',
  };
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium border', map[status] ?? 'bg-muted text-muted-foreground')}>
      {status.replace('_', ' ')}
    </span>
  );
}

export async function EstateOfficerDashboard() {
  const data = await getEstateDashboardData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const estateQueueSnapshot = (data.estateQueueSnapshot as any[]).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inventorySnapshot = (data.inventorySnapshot as any[]).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const estateExitSnapshot = (data.estateExitSnapshot as any[]).filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Estate Review Queue"
          value={data.estateQueueCount}
          icon={ClipboardList}
          variant={data.estateQueueCount > 0 ? 'warning' : 'default'}
          description="Applications at Estate stage"
        />
        <MetricCard
          title="Total Housing Units"
          value={data.totalHousingUnits}
          icon={Home}
          description="Units in the estate inventory"
        />
        <MetricCard
          title="Vacant Units"
          value={data.vacantUnits}
          icon={Building}
          variant="success"
          description="Available for allocation"
        />
        <MetricCard
          title="Pending Estate Inspections"
          value={data.pendingEstateInspections}
          icon={AlertCircle}
          variant={data.pendingEstateInspections > 0 ? 'warning' : 'default'}
          description="Exit notices at final inspection stage"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Estate Review Queue */}
        <DashboardSection
          title="My Estate Review Queue"
          description="Applications forwarded by Housing Secretary"
          href="/management/applications"
        >
          <SnapshotTable
            rows={estateQueueSnapshot}
            getRowKey={r => r.id}
            getRowHref={r => `/management/applications/${r.id}`}
            emptyMessage="No applications in estate queue."
            columns={[
              {
                key: 'applicant',
                header: 'Applicant',
                render: r => (
                  <div>
                    <p className="font-medium text-xs">
                      {r.applicantUser ? `${r.applicantUser.firstName} ${r.applicantUser.lastName}` : r.userId}
                    </p>
                    <p className="text-muted-foreground text-xs">{r.applicantProfile?.department ?? '—'}</p>
                  </div>
                ),
              },
              {
                key: 'score',
                header: 'Score',
                render: r => (
                  <span className="text-sm font-bold text-oau-navy">
                    {r.pointsBreakdown?.totalPoints ?? '—'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: r => <StatusBadge status={r.status} />,
              },
              {
                key: 'submitted',
                header: 'Submitted',
                render: r => <span className="text-xs text-muted-foreground">{formatDate(r.submittedAt)}</span>,
              },
            ]}
          />
        </DashboardSection>

        {/* Pending Estate Exit Inspections */}
        <DashboardSection
          title="Pending Estate Inspections"
          description="Exit notices where housing & electrical inspections passed"
          href="/management/exit"
        >
          <SnapshotTable
            rows={estateExitSnapshot}
            getRowKey={r => r.id}
            getRowHref={r => `/management/exit/${r.id}`}
            emptyMessage="No estate exit inspections pending."
            columns={[
              {
                key: 'occupant',
                header: 'Occupant',
                render: r => (
                  <div>
                    <p className="font-medium text-xs">
                      {r.occupantUser ? `${r.occupantUser.firstName} ${r.occupantUser.lastName}` : r.userId}
                    </p>
                    <p className="text-muted-foreground text-xs">{r.housingUnit?.name ?? '—'}</p>
                  </div>
                ),
              },
              {
                key: 'reason',
                header: 'Reason',
                render: r => <Badge variant="outline" className="text-xs">{r.reason}</Badge>,
              },
              {
                key: 'submitted',
                header: 'Submitted',
                render: r => <span className="text-xs text-muted-foreground">{formatDate(r.submittedAt)}</span>,
              },
            ]}
          />
        </DashboardSection>
      </div>

      {/* Housing Inventory Snapshot */}
      <DashboardSection
        title="Housing Inventory Snapshot"
        description="Status overview of all housing units in the estate"
        href="/admin/inventory"
      >
        <SnapshotTable
          rows={inventorySnapshot}
          getRowKey={r => r.id}
          getRowHref={r => `/admin/inventory`}
          emptyMessage="No inventory data."
          columns={[
            {
              key: 'unit',
              header: 'Unit',
              render: r => <span className="font-medium text-xs">{r.name}</span>,
            },
            {
              key: 'type',
              header: 'Housing Type',
              render: r => <span className="text-xs text-muted-foreground">{r.housingType?.name ?? '—'}</span>,
            },

            {
              key: 'status',
              header: 'Status',
              render: r => <UnitStatusPill status={r.status} />,
            },
            {
              key: 'occupant',
              header: 'Occupant',
              render: r => (
                <span className="text-xs text-muted-foreground">
                  {r.occupantUser ? `${r.occupantUser.firstName} ${r.occupantUser.lastName}` : '—'}
                </span>
              ),
            },
          ]}
        />
      </DashboardSection>
    </div>
  );
}
