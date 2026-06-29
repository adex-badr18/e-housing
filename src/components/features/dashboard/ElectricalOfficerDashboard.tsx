import {
  ShieldAlert, ShieldCheck, ClipboardList,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { SnapshotTable } from '@/components/shared/SnapshotTable';
import { Badge } from '@/components/ui/badge';
import { getElectricalDashboardData } from '@/lib/mock-api/endpoints/metrics';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export async function ElectricalOfficerDashboard() {
  const data = await getElectricalDashboardData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myQueueSnapshot = (data.myQueueSnapshot as any[]).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentlyPassedSnapshot = (data.recentlyPassedSnapshot as any[]).filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Awaiting Electrical Inspection"
          value={data.awaitingCount}
          icon={ClipboardList}
          variant={data.awaitingCount > 0 ? 'warning' : 'default'}
          description="Exit notices awaiting electrical safety clearance"
        />
        <MetricCard
          title="Passed Inspections (7d)"
          value={data.passedThisWeek}
          icon={ShieldCheck}
          variant="success"
          description="Units cleared in past 7 days"
        />
        <MetricCard
          title="Failed / Re-inspect Queue"
          value={data.failedCount}
          icon={ShieldAlert}
          variant={data.failedCount > 0 ? 'danger' : 'default'}
          description="Failed safety check needing rectification"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Inspection Queue */}
        <DashboardSection
          title="My Electrical Inspection Queue"
          description="Exit clearances that have passed housing inspection and require electrical verification"
          href="/management/exit"
        >
          <SnapshotTable
            rows={myQueueSnapshot}
            getRowKey={r => r.id}
            getRowHref={r => `/management/exit/${r.id}`}
            emptyMessage="No pending electrical inspections."
            columns={[
              {
                key: 'occupant',
                header: 'Occupant',
                render: r => (
                  <div>
                    <p className="font-medium text-xs font-semibold">
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
                key: 'housingCleared',
                header: 'Housing Cleared Date',
                render: r => (
                  <span className="text-xs text-muted-foreground">
                    {r.housingInspectionDate ? formatDate(r.housingInspectionDate) : '—'}
                  </span>
                ),
              },
              {
                key: 'submitted',
                header: 'Submitted',
                render: r => <span className="text-xs text-muted-foreground">{formatDate(r.submittedAt)}</span>,
              },
            ]}
          />
        </DashboardSection>

        {/* Recently Passed */}
        <DashboardSection
          title="Recently Verified / Passed"
          description="Exit clearances that passed your electrical inspections"
          href="/management/exit"
        >
          <SnapshotTable
            rows={recentlyPassedSnapshot}
            getRowKey={r => r.id}
            getRowHref={r => `/management/exit/${r.id}`}
            emptyMessage="No recently passed inspections."
            columns={[
              {
                key: 'occupant',
                header: 'Occupant',
                render: r => (
                  <div>
                    <p className="font-medium text-xs font-semibold">
                      {r.occupantUser ? `${r.occupantUser.firstName} ${r.occupantUser.lastName}` : r.userId}
                    </p>
                    <p className="text-muted-foreground text-xs">{r.housingUnit?.name ?? '—'}</p>
                  </div>
                ),
              },
              {
                key: 'verifiedDate',
                header: 'Verified Date',
                render: r => (
                  <span className="text-xs text-muted-foreground">
                    {r.electricalInspectionDate ? formatDate(r.electricalInspectionDate) : '—'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: () => (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    PASSED
                  </span>
                ),
              },
            ]}
          />
        </DashboardSection>
      </div>
    </div>
  );
}
