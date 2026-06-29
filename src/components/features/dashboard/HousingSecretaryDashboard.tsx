import {
  ClipboardList, DoorOpen, AlertCircle, ClipboardCheck,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { SnapshotTable } from '@/components/shared/SnapshotTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { getHousingSecretaryDashboardData } from '@/lib/mock-api/endpoints/metrics';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function InspectionBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    PASSED:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    FAILED:  'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? ''}`}>
      {status}
    </span>
  );
}

export async function HousingSecretaryDashboard() {
  const data = await getHousingSecretaryDashboardData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queueSnapshot = (data.queueSnapshot as any[]).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exitSnapshot = (data.exitSnapshot as any[]).filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="My Review Queue"
          value={data.myQueueCount}
          icon={ClipboardList}
          variant={data.myQueueCount > 0 ? 'warning' : 'default'}
          description="Applications at Housing stage"
        />
        <MetricCard
          title="Forwarded to Estate"
          value={data.forwardedCount}
          icon={ClipboardCheck}
          variant="success"
          description="Past Housing Secretary review"
        />
        <MetricCard
          title="Active Exit Notices"
          value={data.activeExitCount}
          icon={DoorOpen}
          description="Open exit clearance pipelines"
        />
        <MetricCard
          title="Pending Housing Inspections"
          value={data.pendingHousingInspections}
          icon={AlertCircle}
          variant={data.pendingHousingInspections > 0 ? 'warning' : 'default'}
          description="Exits awaiting my inspection"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Review Queue */}
        <DashboardSection
          title="My Review Queue"
          description="Housing-stage applications awaiting scoring"
          href="/management/applications"
        >
          <SnapshotTable
            rows={queueSnapshot}
            getRowKey={r => r.id}
            getRowHref={r => `/management/applications/${r.id}`}
            emptyMessage="No applications in queue."
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
                key: 'grade',
                header: 'Grade Level',
                render: r => (
                  <span className="text-xs text-muted-foreground">{r.applicantProfile?.salaryGradeLevel ?? '—'}</span>
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

        {/* Exit Inspection Queue */}
        <DashboardSection
          title="Pending Housing Inspections"
          description="Exit notices awaiting housing secretary inspection"
          href="/management/exit"
        >
          <SnapshotTable
            rows={exitSnapshot}
            getRowKey={r => r.id}
            getRowHref={r => `/management/exit/${r.id}`}
            emptyMessage="No pending exit inspections."
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
                render: r => (
                  <Badge variant="outline" className="text-xs">{r.reason}</Badge>
                ),
              },
              {
                key: 'housing',
                header: 'Housing',
                render: r => <InspectionBadge status={r.housingInspectionStatus} />,
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

      {/* Recent Activity */}
      <DashboardSection
        title="My Recent Activity"
        description="Audit events attributed to your account"
        href="/admin/audit"
      >
        <SnapshotTable
          rows={data.recentActivity}
          getRowKey={r => r.id}
          getRowHref={() => '/admin/audit'}
          emptyMessage="No recent activity."
          columns={[
            {
              key: 'timestamp',
              header: 'Date & Time',
              render: r => (
                <span className="text-xs font-mono text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              ),
            },
            {
              key: 'action',
              header: 'Action',
              render: r => <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{r.action}</code>,
            },
            {
              key: 'entity',
              header: 'Entity',
              render: r => (
                <div>
                  <span className="text-xs font-medium">{r.entityType}</span>
                  <span className="text-xs text-muted-foreground ml-1 font-mono">#{r.entityId.split('-').pop()}</span>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: r => (
                <span className={`text-xs font-medium ${r.status === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {r.status}
                </span>
              ),
            },
          ]}
        />
      </DashboardSection>
    </div>
  );
}
