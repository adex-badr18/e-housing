'use client';

// =============================================================================
// DVCAdminPanel — Stage 3 Final Decision Form
// =============================================================================
// High-level summary card + Approve / Reject controls.
// DVC Admin cannot FORWARD — must make a terminal decision.
// =============================================================================

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Crown, CheckCircle2, XCircle, Loader2, Award, ClipboardList, User, Home, Building2, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { reviewApplicationAction, getVacantUnitsForApplicationAction } from '@/app/actions/applications';
import type { HousingApplication, ApplicationReview, PointsBreakdown, User as UserType, StaffProfile, HousingUnit, HousingType } from '@/lib/mock-api/db';
import { mockDB } from '@/lib/mock-api/db';

const formSchema = z.object({
  comments: z
    .string()
    .min(5, 'Decision rationale must be at least 5 characters')
    .max(1000, 'Decision rationale must be under 1000 characters'),
  decision: z.enum(['APPROVED', 'RETURNED', 'SAVE_DRAFT', 'REJECTED']),
  allocatedUnitId: z.string().nullable().optional(),
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [vacantUnits, setVacantUnits] = useState<{
    unit: HousingUnit;
    housingType: HousingType | null;
    isEligible: boolean;
    matchesPreference: boolean;
  }[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingUnits(true);
    getVacantUnitsForApplicationAction(application.id).then(res => {
      if (mounted && res.success && res.data) {
        setVacantUnits(res.data);
      }
      if (mounted) setLoadingUnits(false);
    });
    return () => { mounted = false; };
  }, [application.id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: '',
      decision: 'APPROVED',
      allocatedUnitId: application.allocatedUnitId ?? null,
    },
  });

  const watched = form.watch();

  const housingReview = reviews.find(r => r.stage === 'HOUSING');
  const estateReview  = reviews.find(r => r.stage === 'ESTATE');
  const score         = application.pointsBreakdown?.totalPoints ?? 0;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId:   application.id,
        stage:           'DVC',
        decision:        values.decision,
        comments:        values.comments,
        allocatedUnitId: values.allocatedUnitId || null,
        isDraft:         values.decision === 'SAVE_DRAFT',
      });

      if (res.success) {
        if (values.decision === 'APPROVED') {
          toast.success('🎉 Application approved! Allocation can now be created.');
        } else if (values.decision === 'RETURNED') {
          toast.success('Application forwarded back to Estate Officer & Housing Secretary with instructions.');
        } else if (values.decision === 'SAVE_DRAFT') {
          toast.success('Draft decision saved.');
        } else {
          toast.error('Application has been rejected.');
        }
        router.refresh();
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
            Review the application details and review trail. You can approve, reject, save draft, or forward back to the Estate Officer & Housing Secretary for modification.
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
          sub={applicantProfile ? `${applicantProfile.salaryLevel || applicantProfile.salaryGradeLevel || ''} ${applicantProfile.salaryStep ? `(${applicantProfile.salaryStep})` : ''}`.trim() : undefined}
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

      {/* Pre-allocated Unit (Estate Officer’s selection) */}
      {(() => {
        const unitId = watched.allocatedUnitId || application.allocatedUnitId;
        const unit = unitId ? mockDB.findUnitById(unitId) : null;
        const housingType = unit ? mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId) : null;
        if (!unit) return null;
        return (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-5 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Home className="h-4 w-4" />
              Proposed Housing Unit for Allocation
            </h3>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/50">
                <Building2 className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-base">{unit.name}</p>
                <p className="text-sm text-muted-foreground">{housingType?.name ?? 'Unknown Type'}</p>
                {housingType && (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      {housingType.numberOfBedrooms} bed · {housingType.numberOfBathrooms} bath
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full capitalize">
                      {housingType.buildingType.toLowerCase()}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full capitalize">
                      {housingType.parkingSpace}
                    </span>
                    {housingType.hasBQ && (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        Has BQ
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full bg-emerald-500 text-white">
                VACANT
              </span>
            </div>
          </div>
        );
      })()}

      {/* View Other Alternative Vacant Units */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Alternative Vacant Housing Units ({vacantUnits.length})
        </h3>
        {loadingUnits ? (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading vacant units...
          </p>
        ) : vacantUnits.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No other vacant units available.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {vacantUnits.map(v => {
              const isCurrent = (watched.allocatedUnitId || application.allocatedUnitId) === v.unit.id;
              return (
                <div
                  key={v.unit.id}
                  onClick={() => form.setValue('allocatedUnitId', v.unit.id)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all',
                    isCurrent
                      ? 'border-primary bg-primary/5 font-semibold'
                      : 'border-border bg-background hover:bg-muted/40'
                  )}
                >
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      {v.unit.name} ({v.unit.houseNumber}, {v.unit.roadNumber})
                      {v.matchesPreference && (
                        <span className="text-[10px] font-normal text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Preferred
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {v.housingType?.name} · {v.housingType?.numberOfBedrooms} bed
                    </p>
                  </div>
                  {isCurrent ? (
                    <span className="text-primary font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                    >
                      Suggest / Select
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review history */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Review Trail
        </h3>
        <div className="space-y-3">
          {reviews.filter(Boolean).map(review => (
            <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{review.stage} stage</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{reviewerNames[review.reviewerId] ?? review.reviewerId}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-semibold text-primary">{review.decision}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(review.reviewedAt), 'dd MMM yyyy')}</span>
                </div>
                {review.comments?.trim() ? (
                  <p className="text-xs text-foreground/70 mt-1 italic">&quot;{review.comments}&quot;</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 italic">No remarks provided</p>
                )}
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
          <p className="text-sm text-foreground/80 italic">&quot;{application.additionalNotes}&quot;</p>
        </div>
      )}

      {/* Decision form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Decision toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className={cn(
            'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'APPROVED'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="APPROVED" {...form.register('decision')} className="accent-emerald-600" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approve
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grant final approval & trigger allocation
              </p>
            </div>
          </label>

          <label className={cn(
            'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'RETURNED'
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
              : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="RETURNED" {...form.register('decision')} className="accent-amber-600" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                <RotateCcw className="h-4 w-4 text-amber-600" /> Return for Review
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Forward back to Estate & Housing with instructions
              </p>
            </div>
          </label>

          <label className={cn(
            'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'SAVE_DRAFT'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
              : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="SAVE_DRAFT" {...form.register('decision')} className="accent-blue-500" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <Save className="h-4 w-4 text-blue-500" /> Save Draft
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Save decision rationale without completing
              </p>
            </div>
          </label>

          <label className={cn(
            'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'REJECTED'
              ? 'border-destructive bg-red-50 dark:bg-red-950/40'
              : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="REJECTED" {...form.register('decision')} className="accent-red-500" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5 text-red-700 dark:text-red-300">
                <XCircle className="h-4 w-4 text-destructive" /> Reject
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Final rejection
              </p>
            </div>
          </label>
        </div>

        {/* Rationale / Instruction message */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">
            {watched.decision === 'RETURNED' ? 'Modification Instructions for Reviewers' : 'Decision Rationale'}
          </label>
          <textarea
            {...form.register('comments')}
            rows={4}
            placeholder={
              watched.decision === 'RETURNED'
                ? 'Specify instructions for the Estate Officer & Housing Secretary (e.g. propose alternative vacant unit hu-8)...'
                : 'Provide the official rationale for your decision...'
            }
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
              : watched.decision === 'RETURNED'
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : watched.decision === 'SAVE_DRAFT'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-destructive text-white hover:bg-destructive/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {watched.decision === 'APPROVED'
            ? '✓ Approve Application'
            : watched.decision === 'RETURNED'
            ? '↩ Forward Back to Estate Officer & Housing Secretary'
            : watched.decision === 'SAVE_DRAFT'
            ? 'Save Draft Decision'
            : '✗ Reject Application'}
        </button>
      </form>
    </div>
  );
}
