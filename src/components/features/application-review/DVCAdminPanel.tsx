'use client';

// =============================================================================
// DVCAdminPanel — Stage 3 Final Decision Form
// =============================================================================
// Displays:
//   - Housing Secretary unit suggestion
//   - Estate Officer unit selection
//   - Physical inspection scores for each suggested unit (side-by-side if different)
//   - DVC final unit selection picker
//   - Approve / Reject / Return / Save Draft controls
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Crown, CheckCircle2, XCircle, Loader2, Award, ClipboardList,
  User, Home, Building2, RotateCcw, Save, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { reviewApplicationAction } from '@/app/actions/applications';
import type {
  HousingApplication, ApplicationReview, PointsBreakdown,
  User as UserType, StaffProfile, InspectionData,
} from '@/lib/mock-api/db';
import { mockDB } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const formSchema = z.object({
  comments: z
    .string()
    .min(5, 'Decision rationale must be at least 5 characters')
    .max(1000, 'Decision rationale must be under 1000 characters'),
  decision: z.enum(['APPROVED', 'RETURNED', 'SAVE_DRAFT', 'REJECTED']),
  finalAllocatedUnitId: z.string().nullable().optional(),
  hasTwoOptions: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Only mandate explicit selection when there are two distinct unit options
  if (data.decision === 'APPROVED' && data.hasTwoOptions && !data.finalAllocatedUnitId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select one of the two suggested units before approving',
      path: ['finalAllocatedUnitId'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RATING_COLORS: Record<string, string> = {
  GOOD: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  FAIR: 'bg-amber-100 text-amber-800 border-amber-200',
  BAD:  'bg-red-100 text-red-800 border-red-200',
  NA:   'bg-slate-100 text-slate-600 border-slate-200',
};
const RATING_LABELS: Record<string, string> = {
  GOOD: 'Good',
  FAIR: 'Fair',
  BAD:  'Bad',
  NA:   'N/A',
};
const METRIC_LABELS: Record<string, string> = {
  'str-walls':     'Wall Integrity',
  'str-roof':      'Roof Condition',
  'str-floors':    'Floor Condition',
  'str-windows':   'Doors & Windows',
  'util-water':    'Water Supply',
  'util-drainage': 'Drainage System',
  'util-sanitary': 'Sanitary Fixtures',
  'env-compound':  'Compound Condition',
  'env-waste':     'Waste Management',
  'bq-cond':       'BQ Unit Condition',
};
const METRIC_CATEGORIES: Record<string, string> = {
  'str-walls':     'Structural',
  'str-roof':      'Structural',
  'str-floors':    'Structural',
  'str-windows':   'Structural',
  'util-water':    'Utilities',
  'util-drainage': 'Utilities',
  'util-sanitary': 'Utilities',
  'env-compound':  'Environment',
  'env-waste':     'Environment',
  'bq-cond':       'BQ',
};

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
// Inspection Score Card — shows scores for a single unit
// ---------------------------------------------------------------------------

function InspectionScoreCard({
  unitId,
  label,
  badge,
  badgeColor,
  scores,
}: {
  unitId: string;
  label: string;
  badge: string;
  badgeColor: string;
  scores: Record<string, string>;
}) {
  const unit = mockDB.findUnitById(unitId);
  const housingType = unit ? mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId) : null;
  const categories = [...new Set(Object.keys(METRIC_LABELS).map(k => METRIC_CATEGORIES[k]))];

  const goodCount = Object.values(scores).filter(v => v === 'GOOD').length;
  const fairCount = Object.values(scores).filter(v => v === 'FAIR').length;
  const badCount  = Object.values(scores).filter(v => v === 'BAD').length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Unit header */}
      <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Home className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{unit?.name ?? unitId}</p>
            <p className="text-xs text-muted-foreground truncate">{housingType?.name ?? 'Unknown type'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', badgeColor)}>
            {badge}
          </span>
          <span className="text-[10px] font-semibold text-foreground">{label}</span>
        </div>
      </div>

      {/* Score summary bar */}
      <div className="flex divide-x border-b">
        {[
          { label: 'Good', count: goodCount, color: 'text-emerald-600' },
          { label: 'Fair', count: fairCount, color: 'text-amber-600' },
          { label: 'Bad',  count: badCount,  color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center py-2">
            <p className={cn('text-lg font-bold', s.color)}>{s.count}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-category metric scores */}
      <div className="p-4 space-y-4">
        {categories.map(cat => {
          const catMetrics = Object.keys(METRIC_LABELS).filter(k => METRIC_CATEGORIES[k] === cat);
          return (
            <div key={cat} className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{cat}</p>
              <div className="space-y-1.5">
                {catMetrics.map(metricId => {
                  const rating = scores[metricId];
                  return (
                    <div key={metricId} className="flex items-center justify-between text-xs">
                      <span className="text-foreground/80">{METRIC_LABELS[metricId]}</span>
                      {rating ? (
                        <span className={cn(
                          'font-semibold px-2 py-0.5 rounded border text-[10px]',
                          RATING_COLORS[rating]
                        )}>
                          {RATING_LABELS[rating]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Not rated</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
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

  const score = application.pointsBreakdown?.totalPoints ?? 0;

  // Determine suggestion scenario
  const hsUnitId = application.secretarySuggestedUnitId ?? null;
  const eoUnitId = application.estateSuggestedUnitId ?? null;
  const isSameUnit = !!(hsUnitId && eoUnitId && hsUnitId === eoUnitId);
  const hasTwoOptions = !!(hsUnitId && eoUnitId && !isSameUnit);
  // When only one suggestion or both agree, auto-select that unit
  const autoSelectedUnitId = isSameUnit
    ? eoUnitId
    : !hasTwoOptions
      ? (eoUnitId ?? hsUnitId)
      : null;

  const [selectedFinalUnitId, setSelectedFinalUnitId] = useState<string | null>(autoSelectedUnitId);

  const inspectionData: InspectionData | null = application.inspectionData ?? null;

  // Lookup readable unit names
  const hsUnit = hsUnitId ? mockDB.findUnitById(hsUnitId) : null;
  const eoUnit = eoUnitId ? mockDB.findUnitById(eoUnitId) : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: '',
      decision: 'APPROVED',
      finalAllocatedUnitId: autoSelectedUnitId,
      hasTwoOptions,
    },
  });

  const watched = form.watch();

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId:      application.id,
        stage:              'DVC',
        decision:           values.decision,
        comments:           values.comments,
        finalAllocatedUnitId: values.finalAllocatedUnitId || null,
        isDraft:            values.decision === 'SAVE_DRAFT',
      });

      if (res.success) {
        if (values.decision === 'APPROVED') {
          toast.success('🎉 Application approved! Allocation can now be created.');
        } else if (values.decision === 'RETURNED') {
          toast.success('Application forwarded back with instructions.');
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
            Review the inspection scores for proposed units and select the final housing unit to allocate. You can approve, reject, save draft, or return for modification.
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

      {/* ── Suggestions & Inspection Scores ── */}
      {(hsUnitId || eoUnitId) ? (
        <div className="space-y-4">
          {/* Context banner */}
          <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl border',
            isSameUnit
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
              : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
          )}>
            <AlertCircle className={cn('h-5 w-5 shrink-0 mt-0.5', isSameUnit ? 'text-emerald-600' : 'text-blue-600')} />
            <div>
              <p className={cn('text-sm font-semibold', isSameUnit ? 'text-emerald-800 dark:text-emerald-300' : 'text-blue-800 dark:text-blue-300')}>
                {isSameUnit
                  ? 'Both reviewers agreed on the same unit'
                  : 'Reviewers suggested different units'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSameUnit
                  ? `Housing Secretary and Estate Officer both proposed ${hsUnit?.name ?? hsUnitId}. This unit has been automatically selected for allocation.`
                  : `Housing Secretary suggested ${hsUnit?.name ?? hsUnitId ?? 'no unit'}, Estate Officer selected ${eoUnit?.name ?? eoUnitId ?? 'no unit'}. Inspection reports for both units are shown below. You must select your preferred unit before approving.`
                }
              </p>
            </div>
          </div>

          {/* Inspection Score Cards */}
          {inspectionData && Object.keys(inspectionData).length > 0 ? (
            <div className={cn(
              'grid gap-4',
              !isSameUnit && hsUnitId && eoUnitId ? 'md:grid-cols-2' : 'grid-cols-1'
            )}>
              {isSameUnit && eoUnitId && inspectionData[eoUnitId] && (
                <InspectionScoreCard
                  unitId={eoUnitId}
                  label="Agreed Unit"
                  badge="Both Agreed"
                  badgeColor="bg-emerald-100 text-emerald-800 border-emerald-300"
                  scores={inspectionData[eoUnitId]}
                />
              )}
              {!isSameUnit && hsUnitId && inspectionData[hsUnitId] && (
                <InspectionScoreCard
                  unitId={hsUnitId}
                  label="HS Suggestion"
                  badge="Housing Secretary"
                  badgeColor="bg-blue-100 text-blue-800 border-blue-300"
                  scores={inspectionData[hsUnitId]}
                />
              )}
              {!isSameUnit && eoUnitId && inspectionData[eoUnitId] && (
                <InspectionScoreCard
                  unitId={eoUnitId}
                  label="EO Selection"
                  badge="Estate Officer"
                  badgeColor="bg-purple-100 text-purple-800 border-purple-300"
                  scores={inspectionData[eoUnitId]}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">No physical inspection data recorded yet for this application.</p>
            </div>
          )}

          {/* ── Final Unit Selection ── */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                {hasTwoOptions ? 'Select Final Housing Unit to Allocate' : 'Final Housing Unit'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {hasTwoOptions
                  ? 'Based on the inspection scores above, select which unit should be allocated to the applicant. This is required before approving.'
                  : 'The unit below has been automatically selected based on the reviewers\' agreement.'}
              </p>
            </div>

            {hasTwoOptions ? (
              <div className="flex flex-col gap-2">
                {/* HS suggestion option */}
                {hsUnitId && (() => {
                  const unit = mockDB.findUnitById(hsUnitId);
                  const ht = unit ? mockDB.housingTypes.find(h => h.id === unit.housingTypeId) : null;
                  const isSelected = watched.finalAllocatedUnitId === hsUnitId;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFinalUnitId(hsUnitId);
                        form.setValue('finalAllocatedUnitId', hsUnitId, { shouldValidate: true });
                      }}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-border hover:border-primary/40 hover:bg-primary/[0.02]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', isSelected ? 'bg-emerald-100' : 'bg-muted')}>
                          <Building2 className={cn('h-4 w-4', isSelected ? 'text-emerald-600' : 'text-muted-foreground')} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{unit?.name ?? hsUnitId}</p>
                          <p className="text-xs text-muted-foreground">
                            {ht?.name}{ht ? ` · ${ht.numberOfBedrooms} bed` : ''}
                            {unit?.roadNumber ? ` · Road ${unit.roadNumber}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          HS Suggested
                        </span>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                      </div>
                    </button>
                  );
                })()}

                {/* EO selection option (only shown if different from HS) */}
                {eoUnitId && (() => {
                  const unit = mockDB.findUnitById(eoUnitId);
                  const ht = unit ? mockDB.housingTypes.find(h => h.id === unit.housingTypeId) : null;
                  const isSelected = watched.finalAllocatedUnitId === eoUnitId;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFinalUnitId(eoUnitId);
                        form.setValue('finalAllocatedUnitId', eoUnitId, { shouldValidate: true });
                      }}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-border hover:border-primary/40 hover:bg-primary/[0.02]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', isSelected ? 'bg-emerald-100' : 'bg-muted')}>
                          <Building2 className={cn('h-4 w-4', isSelected ? 'text-emerald-600' : 'text-muted-foreground')} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{unit?.name ?? eoUnitId}</p>
                          <p className="text-xs text-muted-foreground">
                            {ht?.name}{ht ? ` · ${ht.numberOfBedrooms} bed` : ''}
                            {unit?.roadNumber ? ` · Road ${unit.roadNumber}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          EO Selected
                        </span>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                      </div>
                    </button>
                  );
                })()}
              </div>
            ) : (
              /* Single auto-selected unit display */
              autoSelectedUnitId && (() => {
                const unit = mockDB.findUnitById(autoSelectedUnitId);
                const ht = unit ? mockDB.housingTypes.find(h => h.id === unit.housingTypeId) : null;
                return (
                  <div className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{unit?.name ?? autoSelectedUnitId}</p>
                        <p className="text-xs text-muted-foreground">
                          {ht?.name}{ht ? ` · ${ht.numberOfBedrooms} bed` : ''}
                          {unit?.roadNumber ? ` · Road ${unit.roadNumber}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isSameUnit && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Both Agreed
                        </span>
                      )}
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                );
              })()
            )}

            {form.formState.errors.finalAllocatedUnitId && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.finalAllocatedUnitId.message}
              </p>
            )}

            {watched.finalAllocatedUnitId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  <strong>{mockDB.findUnitById(watched.finalAllocatedUnitId)?.name ?? watched.finalAllocatedUnitId}</strong> will be allocated upon approval.
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">No housing unit has been proposed yet</p>
            <p className="text-xs mt-0.5">Neither the Housing Secretary nor the Estate Officer has suggested a unit. Return the application for unit selection.</p>
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
                {review.suggestedUnitId && (
                  <p className="text-xs text-primary font-medium mt-1">
                    Unit proposed: {review.suggestedUnitId}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applicant notes */}
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
                Grant final approval &amp; trigger allocation
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
                Forward back with instructions
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
                Save without completing
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

        {/* Rationale / Instructions */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">
            {watched.decision === 'RETURNED' ? 'Modification Instructions for Reviewers' : 'Decision Rationale'}
          </label>
          <textarea
            {...form.register('comments')}
            rows={4}
            placeholder={
              watched.decision === 'RETURNED'
                ? 'Specify what needs to change (e.g. inspect an alternative unit, re-verify scoring)...'
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
            ? '↩ Return to Estate Officer & Housing Secretary'
            : watched.decision === 'SAVE_DRAFT'
            ? 'Save Draft Decision'
            : '✗ Reject Application'}
        </button>
      </form>
    </div>
  );
}
