import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getApplicationsForRoleAction } from '@/app/actions/applications';
import { AppStatusBadge } from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import {
  ClipboardList, ChevronRight, Inbox, ArrowRight,
  ClipboardCheck, Building2, Crown,
} from 'lucide-react';
import type { ApplicationStage, Role } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: 'Application Review Queue — OAU E-Housing',
  description: 'Review and process housing applications through the multi-stage pipeline.',
};

// ---------------------------------------------------------------------------
// Stage badges
// ---------------------------------------------------------------------------

const STAGE_CONFIG: Record<
  Exclude<ApplicationStage, 'COMPLETED'> | 'COMPLETED',
  { label: string; className: string; Icon: React.ElementType }
> = {
  HOUSING:   { label: 'Stage 1 — Housing',  className: 'bg-blue-100 text-blue-800 border-blue-200',     Icon: ClipboardCheck },
  ESTATE:    { label: 'Stage 2 — Estate',   className: 'bg-violet-100 text-violet-800 border-violet-200', Icon: Building2 },
  DVC:       { label: 'Stage 3 — DVC',      className: 'bg-amber-100 text-amber-800 border-amber-200',   Icon: Crown },
  COMPLETED: { label: 'Completed',           className: 'bg-emerald-100 text-emerald-800 border-emerald-200', Icon: ClipboardList },
};

function StageBadge({ stage }: { stage: ApplicationStage }) {
  const cfg = STAGE_CONFIG[stage];
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Role → page heading
// ---------------------------------------------------------------------------

const ROLE_HEADINGS: Partial<Record<Role, { title: string; subtitle: string }>> = {
  HOUSING_SECRETARY: {
    title:    'Application Review Queue — Stage 1',
    subtitle: 'New applications awaiting verification, scoring, and forwarding.',
  },
  ESTATE_OFFICER: {
    title:    'Application Review Queue — Stage 2',
    subtitle: 'Applications scored by Housing Secretary awaiting physical inspection.',
  },
  DVC_ADMIN: {
    title:    'Application Review Queue — Stage 3',
    subtitle: 'Applications cleared by Estate Officer awaiting your final decision.',
  },
  SUPER_ADMIN: {
    title:    'All Housing Applications',
    subtitle: 'Full overview of every application across all stages.',
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ManagementApplicationsPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  const allowedRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
      </div>
    );
  }

  const result = await getApplicationsForRoleAction();
  const apps: import('@/lib/mock-api/db').HousingApplication[] =
    result.success && result.data ? result.data : [];

  const heading = ROLE_HEADINGS[session.user.role] ?? {
    title:    'Applications',
    subtitle: 'Review housing applications.',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">{heading.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{heading.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-semibold">
          <ClipboardList className="h-4 w-4" />
          {apps.length} application{apps.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Empty state */}
      {apps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed bg-muted/20">
          <Inbox className="h-12 w-12 text-muted-foreground/40" />
          <div className="text-center">
            <p className="font-semibold text-muted-foreground">No applications in your queue</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Applications will appear here once they reach your review stage.
            </p>
          </div>
        </div>
      )}

      {/* Application table */}
      {apps.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Application ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Current Stage
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Submitted
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apps.map(app => (
                  <tr
                    key={app.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-semibold text-foreground">{app.id}</p>
                      {app.additionalNotes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                          {app.additionalNotes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StageBadge stage={app.currentStage} />
                    </td>
                    <td className="px-4 py-3.5">
                      <AppStatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {app.pointsBreakdown ? (
                        <span className="font-bold text-primary tabular-nums">
                          {app.pointsBreakdown.totalPoints}
                          <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Not scored</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">
                      {format(new Date(app.submittedAt), 'dd MMM yyyy')}
                      <br />
                      <span className="text-muted-foreground/60">{format(new Date(app.submittedAt), 'HH:mm')}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/management/applications/${app.id}`}
                        id={`review-app-${app.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group-hover:gap-2 transition-all"
                      >
                        Review
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
