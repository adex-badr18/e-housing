'use client';

// =============================================================================
// HousingSecretaryPanel — Stage 1 Review Form
// =============================================================================
// Displays auto-populated score (from scoring engine) with editable fields.
// Housing Secretary can adjust any component, add remarks, then Forward or Reject.
// =============================================================================

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Sparkles, Loader2, ChevronRight, XCircle,
  User, GraduationCap, Calendar, Users, Heart, Save, Home, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { autoScoreApplicationAction, reviewApplicationAction, getVacantUnitsForApplicationAction } from '@/app/actions/applications';
import type { HousingApplication, StaffProfile, User as UserType } from '@/lib/mock-api/db';
import type { ScoringBreakdown } from '@/lib/scoring';
import { VacantUnitsGrid, type VacantUnitData } from './VacantUnitsGrid';

const formSchema = z.object({
  baseTypePoints:     z.coerce.number().int().min(0).max(70),
  seniorityBonus:     z.coerce.number().int().min(0).max(25),
  dependentsBonus:    z.coerce.number().int().min(0).max(15),
  maritalStatusBonus: z.coerce.number().int().min(0).max(10),
  secretarySuggestedUnitId: z.string().nullable().optional(),
  comments: z
    .string()
    .max(1000, 'Remarks must be under 1000 characters')
    .optional()
    .or(z.literal('')),
  decision: z.enum(['FORWARDED', 'REJECTED', 'SAVE_DRAFT']),
});

type FormValues = {
  baseTypePoints:     number;
  seniorityBonus:     number;
  dependentsBonus:    number;
  maritalStatusBonus: number;
  secretarySuggestedUnitId?: string | null;
  comments:           string;
  decision:           'FORWARDED' | 'REJECTED' | 'SAVE_DRAFT';
};



// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HousingSecretaryPanelProps {
  application: HousingApplication;
  applicantUser: UserType | null;
  applicantProfile: StaffProfile | null;
}

// ---------------------------------------------------------------------------
// Score Row
// ---------------------------------------------------------------------------

function ScoreRow({
  label,
  name,
  max,
  register,
  value,
}: {
  label: string;
  name: keyof Omit<FormValues, 'comments' | 'decision'>;
  max: number;
  register: ReturnType<typeof useForm<FormValues>>['register'];
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-sm text-foreground/80">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={max}
          {...register(name)}
          className={cn(
            'w-16 text-right text-sm font-semibold px-2 py-1 rounded-lg border bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
          )}
        />
        <span className="text-xs text-muted-foreground w-14">/ {max} pts</span>
        {/* Mini bar */}
        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary/60 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function HousingSecretaryPanel({
  application,
  applicantUser,
  applicantProfile,
}: HousingSecretaryPanelProps) {
  const router = useRouter();
  const [autoScoring, startAutoScore] = useTransition();
  const [scoringDetails, setScoringDetails] = useState<ScoringBreakdown | null>(null);
  const [isPending, startTransition] = useTransition();

  const [vacantUnits, setVacantUnits] = useState<VacantUnitData[]>([]);
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

  const existingBreakdown = application.pointsBreakdown;

  const isAtEstateStage = application.currentStage === 'ESTATE' && application.status !== 'RETURNED';

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      baseTypePoints:     existingBreakdown?.baseTypePoints     ?? 0,
      seniorityBonus:     existingBreakdown?.seniorityBonus     ?? 0,
      dependentsBonus:    existingBreakdown?.dependentsBonus    ?? 0,
      maritalStatusBonus: existingBreakdown?.maritalStatusBonus ?? 0,
      secretarySuggestedUnitId: application.secretarySuggestedUnitId ?? null,
      comments:           '',
      // At ESTATE stage HS can only save updates, not re-forward or reject
      decision:           isAtEstateStage ? 'SAVE_DRAFT' : 'FORWARDED',
    },
  });

  const watched = form.watch();
  const totalPoints =
    Number(watched.baseTypePoints     || 0) +
    Number(watched.seniorityBonus     || 0) +
    Number(watched.dependentsBonus    || 0) +
    Number(watched.maritalStatusBonus || 0);

  // Auto-fill from scoring engine
  function handleAutoScore() {
    startAutoScore(async () => {
      const res = await autoScoreApplicationAction(application.id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      const { breakdown } = res.data;
      setScoringDetails(breakdown);
      form.setValue('baseTypePoints',     breakdown.rankPoints + breakdown.gradePoints);
      form.setValue('seniorityBonus',     breakdown.seniorityPoints);
      form.setValue('dependentsBonus',    breakdown.dependentsPoints);
      form.setValue('maritalStatusBonus', breakdown.maritalStatusPoints);
      toast.success(`Score auto-populated: ${breakdown.totalPoints} pts`);
    });
  }



  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        applicationId:             application.id,
        stage:                     'HOUSING' as const,
        decision:                  isAtEstateStage ? 'SAVE_DRAFT' as const : values.decision,
        comments:                  values.comments,
        score:                     totalPoints,
        baseTypePoints:            values.baseTypePoints,
        seniorityBonus:            values.seniorityBonus,
        dependentsBonus:           values.dependentsBonus,
        maritalStatusBonus:        values.maritalStatusBonus,
        secretarySuggestedUnitId:  values.secretarySuggestedUnitId || null,
        isDraft:                   isAtEstateStage || values.decision === 'SAVE_DRAFT',
      };

      const res = await reviewApplicationAction(payload);
      if (res.success) {
        if (isAtEstateStage) {
          toast.success('Verification details updated successfully');
        } else if (values.decision === 'SAVE_DRAFT') {
          toast.success('Draft review and unit suggestion saved');
        } else if (values.decision === 'FORWARDED') {
          toast.success('Application scored and forwarded to Estate Officer');
        } else {
          toast.success('Application rejected');
        }
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to submit review');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* DVC Return Banner */}
      {application.status === 'RETURNED' && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/40 dark:border-amber-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Application Returned by DVC Admin for Modification
          </div>
          {application.dvcReturnNote && (
            <p className="text-xs text-amber-800 dark:text-amber-400 bg-white/70 dark:bg-amber-900/40 p-2.5 rounded-lg font-mono">
              &quot;{application.dvcReturnNote}&quot;
            </p>
          )}
          <p className="text-xs text-amber-700 dark:text-amber-400">
            You and the Estate Officer can review this application together, adjust the score or select a different vacant housing unit as instructed by the DVC Admin, then resubmit it for final approval.
          </p>
        </div>
      )}

      {/* Estate Stage Edit Banner — shown when application is with Estate Officer */}
      {isAtEstateStage && (
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4 dark:bg-blue-950/40 dark:border-blue-800 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-sm">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Application Forwarded to Estate Officer
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-400">
            This application is currently with the Estate Officer for physical inspection and unit allocation.
            You can still update your verification score, scoring breakdown, unit suggestion, and remarks below.
            Your edits will be saved without changing the application&apos;s progress.
            Editing will be locked once the Estate Officer forwards the application to the DVC Admin.
          </p>
        </div>
      )}

      {/* Applicant info strip */}
      {applicantUser && applicantProfile && (
        <div className="rounded-xl border bg-secondary/40 p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Applicant</p>
              <p className="font-semibold">{applicantUser.firstName} {applicantUser.lastName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Rank / Grade</p>
              <p className="font-semibold">
                {applicantProfile.rank} · {applicantProfile.salaryLevel || applicantProfile.salaryGradeLevel} {applicantProfile.salaryStep ? `(${applicantProfile.salaryStep})` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Employment Date</p>
              <p className="font-semibold">{applicantProfile.employmentDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Dependents</p>
              <p className="font-semibold">{applicantProfile.numberOfDependents}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Marital Status</p>
              <p className="font-semibold capitalize">{applicantProfile.maritalStatus.toLowerCase()}</p>
            </div>
          </div>
        </div>
      )}



      {/* Scoring panel */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Allocation Priority Score
            </h3>
            <button
              type="button"
              onClick={handleAutoScore}
              disabled={autoScoring}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg',
                'bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-50'
              )}
            >
              {autoScoring ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Auto-Score from Profile
            </button>
          </div>

          {/* Scoring engine summary */}
          {scoringDetails && (
            <div className="text-xs bg-primary/5 text-primary/80 border border-primary/20 rounded-lg p-3">
              <strong>Engine reasoning: </strong>
              {scoringDetails.rankLabel} ({scoringDetails.rankPoints} pts) ·{' '}
              {scoringDetails.gradeLabel} ({scoringDetails.gradePoints} pts) ·{' '}
              {scoringDetails.yearsOfService} yrs service ({scoringDetails.seniorityPoints} pts) ·{' '}
              {scoringDetails.dependentsPoints} dep. pts · {scoringDetails.maritalStatusPoints} marital pts
            </div>
          )}

          {/* Score fields */}
          <div className="space-y-3">
            <ScoreRow label="Rank + Grade Level Points" name="baseTypePoints" max={70} register={form.register} value={Number(watched.baseTypePoints) || 0} />
            <ScoreRow label="Seniority Bonus (Years of Service)" name="seniorityBonus" max={25} register={form.register} value={Number(watched.seniorityBonus) || 0} />
            <ScoreRow label="Dependents Bonus" name="dependentsBonus" max={15} register={form.register} value={Number(watched.dependentsBonus) || 0} />
            <ScoreRow label="Marital Status Bonus" name="maritalStatusBonus" max={10} register={form.register} value={Number(watched.maritalStatusBonus) || 0} />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-semibold">Total Score</span>
            <span className={cn(
              'text-2xl font-extrabold tabular-nums',
              totalPoints >= 80 ? 'text-emerald-600'
                : totalPoints >= 50 ? 'text-primary'
                : 'text-amber-600'
            )}>
              {totalPoints}
              <span className="text-sm font-medium text-muted-foreground ml-1">/ 120</span>
            </span>
          </div>
        </div>

        {/* Optional Housing Unit Suggestion */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Suggest a Housing Unit
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Optional</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your suggestion is advisory — the Estate Officer can accept it or propose a different unit. Both will be inspected and scored before the DVC decides.
            </p>
          </div>

          {/* Previously suggested badge */}
          {application.secretarySuggestedUnitId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300">
              <Home className="h-3.5 w-3.5 shrink-0" />
              Previously suggested: <span className="font-bold ml-1">{application.secretarySuggestedUnitId}</span>
            </div>
          )}

          {loadingUnits ? (
            <p className="text-xs text-muted-foreground py-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading vacant units...
            </p>
          ) : vacantUnits.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 italic">
              No vacant units currently available. You may still forward without a suggestion.
            </p>
          ) : (
            <VacantUnitsGrid
              vacantUnits={vacantUnits}
              selectedUnitId={watched.secretarySuggestedUnitId || null}
              onSelectUnit={(id) => form.setValue('secretarySuggestedUnitId', id)}
              allowClear
            />
          )}
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">
            Reviewer Remarks <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </label>
          <textarea
            {...form.register('comments')}
            rows={4}
            placeholder="Provide any remarks justifying your decision or instructions for Estate Officer (optional)..."
            className={cn(
              'w-full text-sm px-3 py-2 rounded-xl border bg-background resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
            )}
          />
          {form.formState.errors.comments && (
            <p className="text-xs text-destructive">{form.formState.errors.comments.message}</p>
          )}
        </div>

        {/* Decision options: hidden at ESTATE stage (only Save Updates allowed) */}
        {!isAtEstateStage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              watched.decision === 'FORWARDED'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40'
            )}>
              <input
                type="radio"
                value="FORWARDED"
                {...form.register('decision')}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <ChevronRight className="h-4 w-4 text-primary" /> Forward
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Advance to Estate Officer</p>
              </div>
            </label>

            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              watched.decision === 'SAVE_DRAFT'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                : 'border-border hover:border-muted-foreground/40'
            )}>
              <input
                type="radio"
                value="SAVE_DRAFT"
                {...form.register('decision')}
                className="accent-blue-500"
              />
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <Save className="h-4 w-4 text-blue-500" /> Save Draft
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Save progress without advancing</p>
              </div>
            </label>

            <label className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              watched.decision === 'REJECTED'
                ? 'border-destructive bg-red-50'
                : 'border-border hover:border-muted-foreground/40'
            )}>
              <input
                type="radio"
                value="REJECTED"
                {...form.register('decision')}
                className="accent-red-500"
              />
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" /> Reject Application
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Criteria not met</p>
              </div>
            </label>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
            isAtEstateStage
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : watched.decision === 'REJECTED'
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : watched.decision === 'SAVE_DRAFT'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isAtEstateStage
            ? 'Save Verification Updates'
            : watched.decision === 'FORWARDED'
            ? 'Submit & Forward to Estate Officer'
            : watched.decision === 'SAVE_DRAFT'
            ? 'Save Draft Review'
            : 'Submit Rejection'}
        </button>
      </form>
    </div>
  );
}
