'use client';

// =============================================================================
// DVCAdminPanel — Stage 3 Final Decision Form
// =============================================================================
// High-level summary card + Approve / Reject controls.
// DVC Admin cannot FORWARD — must make a terminal decision.
// =============================================================================

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Crown, CheckCircle2, XCircle, Loader2, Award, ClipboardList, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { reviewApplicationAction } from '@/app/actions/applications';
import type { HousingApplication, ApplicationReview, PointsBreakdown, User as UserType, StaffProfile } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const formSchema = z.object({
  comments: z
    .string()
    .min(10, 'Decision rationale must be at least 10 characters')
    .max(1000, 'Decision rationale must be under 1000 characters'),
  decision: z.enum(['APPROVED', 'REJECTED']),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Summary stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DVCAdminPanelProps {
  application: HousingApplication;
  reviews: ApplicationReview[];
  applicantUser: UserType | null;
  applicantProfile: StaffProfile | null;
  reviewerNames: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DVCAdminPanel({
  application,
  reviews,
  applicantUser,
  applicantProfile,
  reviewerNames,
}: DVCAdminPanelProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { comments: '', decision: 'APPROVED' },
  });

  const watched = form.watch();

  const housingReview = reviews.find(r => r.stage === 'HOUSING');
  const estateReview  = reviews.find(r => r.stage === 'ESTATE');
  const score         = application.pointsBreakdown?.totalPoints ?? 0;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId: application.id,
        stage:         'DVC',
        decision:      values.decision,
        comments:      values.comments,
      });

      if (res.success) {
        toast.success(
          values.decision === 'APPROVED'
            ? '🎉 Application approved! Allocation can now be created.'
            : 'Application has been rejected.'
        );
        window.location.reload();
      } else {
        toast.error(res.error ?? 'Failed to submit decision');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <Crown className="h-6 w-6 text-primary shrink-0" />
        <div>
          <p className="font-bold text-foreground">Final Authority Review</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Both Stage 1 (Housing Secretary) and Stage 2 (Estate Officer) have cleared this application.
            Your decision is terminal.
          </p>
        </div>
      </div>

      {/* Applicant summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Applicant"
          value={`${applicantUser?.firstName ?? '—'} ${applicantUser?.lastName ?? ''}`}
          sub={applicantProfile?.staffId ?? applicantUser?.email}
        />
        <StatCard
          label="Priority Score"
          value={<span className={score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-primary' : 'text-amber-600'}>{score}</span>}
          sub="out of 120 pts"
        />
        <StatCard
          label="Rank"
          value={applicantProfile?.rank ?? '—'}
          sub={applicantProfile?.salaryGradeLevel}
        />
        <StatCard
          label="Submitted"
          value={format(new Date(application.submittedAt), 'dd MMM yyyy')}
          sub={format(new Date(application.submittedAt), 'HH:mm')}
        />
      </div>

      {/* Score breakdown */}
      {application.pointsBreakdown && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Score Breakdown (Housing Secretary)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {[
              { label: 'Rank + Grade', value: application.pointsBreakdown.baseTypePoints },
              { label: 'Seniority',    value: application.pointsBreakdown.seniorityBonus },
              { label: 'Dependents',   value: application.pointsBreakdown.dependentsBonus },
              { label: 'Marital',      value: application.pointsBreakdown.maritalStatusBonus },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review history */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Review Trail
        </h3>
        <div className="space-y-3">
          {[housingReview, estateReview].filter(Boolean).map(review => review && (
            <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">{review.stage} stage</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{reviewerNames[review.reviewerId] ?? review.reviewerId}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(review.reviewedAt), 'dd MMM yyyy')}</span>
                </div>
                <p className="text-xs text-foreground/70 mt-1 italic">"{review.comments}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred housing types */}
      {application.additionalNotes && (
        <div className="rounded-xl border bg-card p-4 space-y-1.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Applicant Notes
          </h3>
          <p className="text-sm text-foreground/80 italic">"{application.additionalNotes}"</p>
        </div>
      )}

      {/* Decision form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Decision toggle */}
        <div className="flex gap-3">
          <label className={cn(
            'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'APPROVED'
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="APPROVED" {...form.register('decision')} className="accent-emerald-600" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve Application
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grant final approval — triggers housing unit allocation
              </p>
            </div>
          </label>

          <label className={cn(
            'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'REJECTED'
              ? 'border-destructive bg-red-50'
              : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="REJECTED" {...form.register('decision')} className="accent-red-500" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-destructive" /> Reject Application
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Final rejection — applicant will be notified
              </p>
            </div>
          </label>
        </div>

        {/* Rationale */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Decision Rationale</label>
          <textarea
            {...form.register('comments')}
            rows={4}
            placeholder="Provide the official rationale for your decision..."
            className={cn(
              'w-full text-sm px-3 py-2 rounded-xl border bg-background resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
            )}
          />
          {form.formState.errors.comments && (
            <p className="text-xs text-destructive">{form.formState.errors.comments.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md',
            watched.decision === 'APPROVED'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-destructive text-white hover:bg-destructive/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {watched.decision === 'APPROVED'
            ? '✓ Approve Application'
            : '✗ Reject Application'}
        </button>

        <p className="text-xs text-center text-muted-foreground">
          This decision is final and cannot be reversed without Super Admin intervention.
        </p>
      </form>
    </div>
  );
}
