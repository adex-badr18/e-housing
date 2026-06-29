import {
  ClipboardList, CheckSquare, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { SnapshotTable } from '@/components/shared/SnapshotTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getDvcDashboardData } from '@/lib/mock-api/endpoints/metrics';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export async function DvcAdminDashboard() {
  const data = await getDvcDashboardData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dvcQueueSnapshot = (data.dvcQueueSnapshot as any[]).filter(Boolean);

  const totalPipeline = Object.values(data.pipelineCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="DVC Approval Queue"
          value={data.dvcQueueCount}
          icon={CheckSquare}
          variant={data.dvcQueueCount > 0 ? 'warning' : 'default'}
          description="Applications awaiting my final decision"
        />
        <MetricCard
          title="Total Applications"
          value={data.totalApplications}
          icon={ClipboardList}
          description="Total submissions in system"
        />
        <MetricCard
          title="Approved Applications"
          value={data.approvedCount}
          icon={CheckCircle}
          variant="success"
          description="Cleared and allocated"
        />
        <MetricCard
          title="Rejected Applications"
          value={data.rejectedCount}
          icon={AlertTriangle}
          variant="danger"
          description="Unsuccessful or ineligible"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* DVC Review Queue */}
        <div className="lg:col-span-2">
          <DashboardSection
            title="Awaiting Final Decision"
            description="Applications ready for DVC Admin review and final allocation issuance"
            href="/management/applications"
          >
            <SnapshotTable
              rows={dvcQueueSnapshot}
              getRowKey={r => r.id}
              getRowHref={r => `/management/applications/${r.id}`}
              emptyMessage="No applications in DVC approval queue."
              columns={[
                {
                  key: 'applicant',
                  header: 'Applicant',
                  render: r => (
                    <div>
                      <p className="font-medium text-xs font-semibold">
                        {r.applicantUser ? `${r.applicantUser.firstName} ${r.applicantUser.lastName}` : r.userId}
                      </p>
                      <p className="text-muted-foreground text-xs">{r.applicantProfile?.rank ?? '—'}</p>
                    </div>
                  ),
                },
                {
                  key: 'points',
                  header: 'Scored Points',
                  render: r => (
                    <span className="text-sm font-bold text-oau-navy">
                      {r.pointsBreakdown?.totalPoints ?? '—'} pts
                    </span>
                  ),
                },
                {
                  key: 'estateOfficer',
                  header: 'Estate Verifier',
                  render: r => (
                    <span className="text-xs text-muted-foreground">
                      {r.estateReviewer ? `${r.estateReviewer.firstName} ${r.estateReviewer.lastName}` : 'Estate Officer'}
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
        </div>

        {/* Application Pipeline Status */}
        <div>
          <DashboardSection
            title="Application Pipeline"
            description="Overview of current state distribution"
          >
            <div className="rounded-xl border border-border/60 p-6 bg-white shadow-sm flex flex-col gap-4">
              {Object.entries(data.pipelineCounts).map(([stage, count]) => {
                const percentage = totalPipeline > 0 ? Math.round((count / totalPipeline) * 100) : 0;
                let progressBg = 'bg-oau-navy';
                if (stage === 'REJECTED') progressBg = 'bg-red-500';
                if (stage === 'COMPLETED') progressBg = 'bg-emerald-500';

                return (
                  <div key={stage} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-oau-navy font-semibold">{stage.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressBg} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardSection>
        </div>
      </div>
    </div>
  );
}
