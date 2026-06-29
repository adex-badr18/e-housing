import {
  Users, Home, Building, ClipboardList, AlertTriangle,
  CheckCircle2, Wrench, UserCheck, Activity, MessageSquareDot, FileText,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { SnapshotTable } from '@/components/shared/SnapshotTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { getAdminMetrics } from '@/lib/mock-api/endpoints/metrics';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export async function AdminDashboard() {
  const data = await getAdminMetrics();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentApplications = (data.recentApplications as any[]).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentAuditLogs = (data.recentAuditLogs as any[]).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentIncidents = (data.recentIncidents as any[]).filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={data.totalUsers}
          icon={Users}
          description={`${data.activeStaff} active staff members`}
        />
        <MetricCard
          title="Total Housing Units"
          value={data.totalHousingUnits}
          icon={Home}
          description={`${data.totalHousingTypes} active housing types`}
        />
        <MetricCard
          title="Vacant Units"
          value={data.vacantUnits}
          icon={Building}
          variant="success"
          description="Ready for new allocation"
        />
        <MetricCard
          title="Open Tickets"
          value={data.openTickets}
          icon={MessageSquareDot}
          variant={data.openTickets > 0 ? 'warning' : 'default'}
          description="Helpdesk incidents awaiting resolution"
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Applications"
          value={data.totalApplications}
          icon={ClipboardList}
          description="All-time submissions"
        />
        <MetricCard
          title="Pending Review"
          value={data.pendingApplications}
          icon={FileText}
          variant={data.pendingApplications > 0 ? 'warning' : 'default'}
          description="Awaiting Housing Secretary"
        />
        <MetricCard
          title="Under Maintenance"
          value={data.underMaintenanceUnits}
          icon={Wrench}
          variant={data.underMaintenanceUnits > 0 ? 'danger' : 'default'}
          description="Units currently offline"
        />
        <MetricCard
          title="Active Exit Notices"
          value={data.activeExitNotices}
          icon={AlertTriangle}
          variant={data.activeExitNotices > 0 ? 'warning' : 'default'}
          description="Exits in the clearance pipeline"
        />
      </div>

      {/* Snapshot sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Applications */}
        <DashboardSection
          title="Recent Applications"
          description="Latest housing applications submitted to the system"
          href="/admin/applications"
        >
          <SnapshotTable
            rows={recentApplications}
            getRowKey={r => r.id}
            getRowHref={r => `/admin/applications/${r.id}`}
            emptyMessage="No applications found."
            columns={[
              {
                key: 'applicant',
                header: 'Applicant',
                render: r => (
                  <div>
                    <p className="font-medium text-xs">
                      {r.applicantUser ? `${r.applicantUser.firstName} ${r.applicantUser.lastName}` : r.userId}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {r.applicantProfile?.rank ?? '—'}
                    </p>
                  </div>
                ),
              },
              {
                key: 'stage',
                header: 'Stage',
                render: r => (
                  <Badge variant="outline" className="text-xs font-mono">
                    {r.currentStage}
                  </Badge>
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

        {/* Open Helpdesk Tickets */}
        <DashboardSection
          title="Open Helpdesk Tickets"
          description="Recent incident reports from staff"
          href="/admin/helpdesk"
        >
          <SnapshotTable
            rows={recentIncidents}
            getRowKey={r => r.id}
            getRowHref={() => '/admin/helpdesk'}
            emptyMessage="No open tickets."
            columns={[
              {
                key: 'title',
                header: 'Title',
                render: r => (
                  <p className="font-medium text-xs line-clamp-1">{r.title}</p>
                ),
              },
              {
                key: 'reporter',
                header: 'Reported By',
                render: r => (
                  <span className="text-xs text-muted-foreground">
                    {r.reporterUser ? `${r.reporterUser.firstName} ${r.reporterUser.lastName}` : r.userId}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: r => {
                  const map: Record<string, string> = {
                    OPEN: 'bg-red-100 text-red-700',
                    IN_PROGRESS: 'bg-amber-100 text-amber-700',
                    RESOLVED: 'bg-emerald-100 text-emerald-700',
                  };
                  return (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[r.status] ?? ''}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  );
                },
              },
            ]}
          />
        </DashboardSection>
      </div>

      {/* Recent Audit Events */}
      <DashboardSection
        title="Recent System Activity"
        description="Latest audit trail entries across all actors"
        href="/admin/audit"
      >
        <SnapshotTable
          rows={recentAuditLogs}
          getRowKey={r => r.id}
          getRowHref={() => '/admin/audit'}
          emptyMessage="No audit events recorded."
          columns={[
            {
              key: 'timestamp',
              header: 'Timestamp',
              render: r => (
                <span className="text-xs font-mono text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              ),
            },
            {
              key: 'actor',
              header: 'Actor',
              render: r => (
                <div>
                  <p className="text-xs font-medium">
                    {r.actorUser ? `${r.actorUser.firstName} ${r.actorUser.lastName}` : r.actorId}
                  </p>
                  {r.actorUser && (
                    <p className="text-xs text-muted-foreground">{r.actorUser.role.replace(/_/g, ' ')}</p>
                  )}
                </div>
              ),
            },
            {
              key: 'action',
              header: 'Action',
              render: r => (
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{r.action}</code>
              ),
            },
            {
              key: 'entity',
              header: 'Entity',
              render: r => <span className="text-xs text-muted-foreground">{r.entityType}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: r => (
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.status === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {r.status}
                </span>
              ),
            },
          ]}
        />
      </DashboardSection>

      {/* User breakdown */}
      <DashboardSection title="User Role Breakdown" description="Distribution of system users by role">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(data.usersByRole).map(([role, count]) => (
            <div key={role} className="rounded-xl border border-border/60 p-4 bg-muted/10 text-center">
              <p className="text-2xl font-bold text-oau-navy">{count as number}</p>
              <p className="text-xs text-muted-foreground mt-1">{role.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
