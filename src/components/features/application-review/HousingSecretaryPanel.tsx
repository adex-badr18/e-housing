'use client';

// =============================================================================
// HousingSecretaryPanel — Stage 1 Review Form
// =============================================================================
// Displays auto-populated score (from scoring engine) with editable fields.
// Housing Secretary can adjust any component, add remarks, then Forward or Reject.
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Sparkles, Loader2, ChevronRight, XCircle, Info, CheckCircle2,
  User, GraduationCap, Calendar, Users, Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { autoScoreApplicationAction, reviewApplicationAction } from '@/app/actions/applications';
import type { HousingApplication, StaffProfile, User as UserType } from '@/lib/mock-api/db';
import type { ScoringBreakdown } from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  baseTypePoints:     z.coerce.number().int().min(0).max(70),
  seniorityBonus:     z.coerce.number().int().min(0).max(25),
  dependentsBonus:    z.coerce.number().int().min(0).max(15),
  maritalStatusBonus: z.coerce.number().int().min(0).max(10),
  comments: z
    .string()
    .min(10, 'Remarks must be at least 10 characters')
    .max(1000, 'Remarks must be under 1000 characters'),
  decision: z.enum(['FORWARDED', 'REJECTED']),
});

type FormValues = {
  baseTypePoints:     number;
  seniorityBonus:     number;
  dependentsBonus:    number;
  maritalStatusBonus: number;
  comments:           string;
  decision:           'FORWARDED' | 'REJECTED';
};

// ---------------------------------------------------------------------------
// Verification Checklist item
// ---------------------------------------------------------------------------

interface CheckItem {
  id: string;
  label: string;
  description: string;
}

const VERIFICATION_CHECKS: CheckItem[] = [
  { id: 'staff-id',      label: 'Staff ID verified',              description: 'Confirm applicant appears in the staff registry' },
  { id: 'profile-compl', label: 'Profile complete',               description: 'All mandatory profile fields are filled in correctly' },
  { id: 'eligibility',   label: 'Eligibility criteria met',       description: 'Rank and grade level qualify for requested housing category' },
  { id: 'no-duplicate',  label: 'No duplicate application',       description: 'Only one active application is permitted at a time' },
];

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
  const [checks, setChecks]       = useState<Record<string, boolean>>({});
  const [autoScoring, startAutoScore] = useTransition();
  const [scoringDetails, setScoringDetails] = useState<ScoringBreakdown | null>(null);
  const [isPending, startTransition] = useTransition();

  const existingBreakdown = application.pointsBreakdown;

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      baseTypePoints:     existingBreakdown?.baseTypePoints     ?? 0,
      seniorityBonus:     existingBreakdown?.seniorityBonus     ?? 0,
      dependentsBonus:    existingBreakdown?.dependentsBonus    ?? 0,
      maritalStatusBonus: existingBreakdown?.maritalStatusBonus ?? 0,
      comments:           '',
      decision:           'FORWARDED',
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

  function toggleCheck(id: string) {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const allChecked = VERIFICATION_CHECKS.every(c => checks[c.id]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const payload = {
        applicationId:      application.id,
        stage:              'HOUSING' as const,
        decision:           values.decision,
        comments:           values.comments,
        score:              totalPoints,
        baseTypePoints:     values.baseTypePoints,
        seniorityBonus:     values.seniorityBonus,
        dependentsBonus:    values.dependentsBonus,
        maritalStatusBonus: values.maritalStatusBonus,
      };

      const res = await reviewApplicationAction(payload);
      if (res.success) {
        toast.success(
          values.decision === 'FORWARDED'
            ? 'Application scored and forwarded to Estate Officer'
            : 'Application rejected'
        );
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to submit review');
      }
    });
  }

  return (
    <div className="space-y-6">
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
              <p className="font-semibold">{applicantProfile.rank} · {applicantProfile.salaryGradeLevel}</p>
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

      {/* Verification checklist */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          Verification Checklist
        </h3>
        <div className="space-y-2">
          {VERIFICATION_CHECKS.map(item => (
            <label
              key={item.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                checks[item.id]
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-background border-border hover:bg-muted/30'
              )}
            >
              <input
                type="checkbox"
                checked={checks[item.id] ?? false}
                onChange={() => toggleCheck(item.id)}
                className="mt-0.5 accent-emerald-600 h-4 w-4 cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </label>
          ))}
        </div>
        {!allChecked && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Complete all checks before forwarding the application
          </p>
        )}
      </div>

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

        {/* Remarks */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Reviewer Remarks</label>
          <textarea
            {...form.register('comments')}
            rows={4}
            placeholder="Provide a detailed remark justifying your decision..."
            className={cn(
              'w-full text-sm px-3 py-2 rounded-xl border bg-background resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
            )}
          />
          {form.formState.errors.comments && (
            <p className="text-xs text-destructive">{form.formState.errors.comments.message}</p>
          )}
        </div>

        {/* Decision */}
        <div className="flex gap-3">
          <label className={cn(
            'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
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
                <ChevronRight className="h-4 w-4 text-primary" /> Forward to Estate Officer
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Score accepted — advance to Stage 2</p>
            </div>
          </label>

          <label className={cn(
            'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
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
              <p className="text-xs text-muted-foreground mt-0.5">Application does not meet criteria</p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || (!allChecked && watched.decision === 'FORWARDED')}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
            watched.decision === 'REJECTED'
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {watched.decision === 'FORWARDED' ? 'Submit & Forward to Estate Officer' : 'Submit Rejection'}
        </button>

        {watched.decision === 'FORWARDED' && !allChecked && (
          <p className="text-xs text-center text-amber-600">
            Complete all verification checks to enable forwarding
          </p>
        )}
      </form>
    </div>
  );
}
