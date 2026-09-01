import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { mockDB } from '@/lib/mock-api/db';
import { ReviewPipeline } from '@/components/features/application-review/ReviewPipeline';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export const metadata = { title: 'Application Details | OAU E-Housing' };

export default async function StaffApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STAFF') redirect('/staff');

  const application = mockDB.housingApplications.find(a => a.id === params.id && a.userId === session.user.id);
  if (!application) notFound();

  const reviews = mockDB.getReviewsForApplication(application.id);
  const applicantUser = mockDB.findUserById(application.userId) ?? null;
  const applicantProfile = applicantUser ? mockDB.staffProfiles.find(p => p.userId === applicantUser.id) ?? null : null;
  
  const reviewerNames: Record<string, string> = {};
  for (const r of reviews) {
    if (!reviewerNames[r.reviewerId]) {
      const u = mockDB.findUserById(r.reviewerId);
      reviewerNames[r.reviewerId] = u ? `${u.firstName} ${u.lastName}` : 'Unknown Reviewer';
    }
  }

  return (
    <div className="space-y-6 w-full max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/staff/applications"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Applications
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-oau-navy">Application Details</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Submitted on {format(new Date(application.submittedAt), 'dd MMMM yyyy, HH:mm')}
          </p>
        </div>
      </div>

      <ReviewPipeline
        application={application}
        reviews={reviews}
        applicantUser={applicantUser}
        applicantProfile={applicantProfile}
        sessionRole="STAFF"
        reviewerNames={reviewerNames}
      />
    </div>
  );
}
