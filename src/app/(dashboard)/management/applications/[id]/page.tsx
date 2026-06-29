import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getApplicationWithProfile } from '@/lib/mock-api/endpoints/applications';
import { mockDB } from '@/lib/mock-api/db';
import { ReviewPipeline } from '@/components/features/application-review/ReviewPipeline';
import { AppStatusBadge } from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import type { Role } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: 'Application Review — OAU E-Housing',
  description: 'Multi-stage review panel for a housing application.',
};

// ---------------------------------------------------------------------------
// Role access guard
// ---------------------------------------------------------------------------

const ALLOWED_ROLES: Role[] = [
  'SUPER_ADMIN',
  'HOUSING_SECRETARY',
  'ESTATE_OFFICER',
  'DVC_ADMIN',
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) redirect('/login');

  if (!ALLOWED_ROLES.includes(session.user.role as Role)) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to access the review pipeline.
        </p>
        <Link href="/management" className="text-sm text-primary hover:underline">
          ← Return to Management Portal
        </Link>
      </div>
    );
  }

  // Fetch the application + applicant profile
  const detail = await getApplicationWithProfile(id);
  if (!detail) notFound();

  const { application, reviews, applicantUser, applicantProfile } = detail;

  // Build reviewer name map for attribution
  const reviewerIds = [...new Set(reviews.map(r => r.reviewerId))];
  const reviewerNames: Record<string, string> = {};
  for (const uid of reviewerIds) {
    const u = mockDB.findUserById(uid);
    if (u) reviewerNames[uid] = `${u.firstName} ${u.lastName}`;
  }

  return (
    <div className="w-full space-y-6">
      {/* Back link */}
      <Link
        href="/management/applications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Application Queue
      </Link>

      {/* Page header */}
      <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-bold text-oau-navy tracking-tight">
                Housing Application
              </h1>
              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {application.id}
              </span>
            </div>
            {applicantUser && (
              <p className="text-sm text-muted-foreground">
                Applicant:{' '}
                <strong className="text-foreground">
                  {applicantUser.firstName} {applicantUser.lastName}
                </strong>
                {applicantProfile && (
                  <span className="ml-2">
                    · {applicantProfile.rank} · {applicantProfile.salaryGradeLevel}
                  </span>
                )}
              </p>
            )}
          </div>
          <AppStatusBadge status={application.status} />
        </div>

        {/* Meta strip */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Submitted {format(new Date(application.submittedAt), 'dd MMM yyyy, HH:mm')}
          </span>
          {application.updatedAt && application.updatedAt !== application.submittedAt && (
            <span>· Last updated {format(new Date(application.updatedAt), 'dd MMM yyyy, HH:mm')}</span>
          )}
          {applicantProfile && (
            <span>
              · {applicantProfile.department}, {applicantProfile.faculty}
            </span>
          )}
        </div>

        {/* Preferred housing types */}
        {application.preferredHousingTypeIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground">Preferences:</span>
            {application.preferredHousingTypeIds.map(htId => {
              const ht = mockDB.housingTypes.find(h => h.id === htId);
              return ht ? (
                <span
                  key={htId}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary border text-foreground"
                >
                  {ht.name}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* ── REVIEW PIPELINE ── */}
      <ReviewPipeline
        application={application}
        reviews={reviews}
        applicantUser={applicantUser}
        applicantProfile={applicantProfile}
        sessionRole={session.user.role as Role}
        reviewerNames={reviewerNames}
      />
    </div>
  );
}
