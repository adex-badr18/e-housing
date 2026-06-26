'use client';

import { type UseFormReturn } from 'react-hook-form';
import type { ApplicationWizardValues } from '@/lib/validations/housing';
import type { HousingType } from '@/lib/mock-api/db';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  GraduationCap,
  Home,
  Users,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface StepReviewProps {
  form: UseFormReturn<ApplicationWizardValues, any, any>;
  housingTypes: HousingType[];
}

function ReviewRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

export function StepReview({ form, housingTypes }: StepReviewProps) {
  const { watch, register, formState: { errors } } = form;
  const values = watch();

  const selectedTypes = (values.preferredHousingTypeIds ?? [])
    .map((id, i) => ({ rank: i + 1, type: housingTypes.find((t) => t.id === id) }))
    .filter((x) => x.type);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shrink-0">
          <ClipboardCheck className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Review & Submit</h2>
          <p className="text-sm text-muted-foreground">
            Confirm your details before submitting. You can go back to any step to make changes.
          </p>
        </div>
      </div>

      {/* Professional Profile Summary */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Professional Profile</h3>
        </div>
        <div className="px-4 py-3 space-y-0.5">
          <ReviewRow label="Rank" value={values.rank} />
          <ReviewRow label="Grade Level" value={values.salaryGradeLevel} />
          <ReviewRow label="Department" value={values.department} />
          <ReviewRow label="Faculty" value={values.faculty} />
          <ReviewRow label="Employment Date" value={values.employmentDate} />
          <ReviewRow label="Marital Status" value={values.maritalStatus} />
          <ReviewRow label="No. of Dependents" value={values.numberOfDependents} />
        </div>
      </div>

      {/* Housing Preferences Summary */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
          <Home className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Housing Preferences</h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          {selectedTypes.length === 0 ? (
            <p className="text-sm text-destructive">No housing types selected.</p>
          ) : (
            selectedTypes.map(({ rank, type }) => (
              <div key={type!.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{type!.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {type!.numberOfBedrooms} bed · {type!.allocationPoints} pts · ₦{type!.annualRent.toLocaleString()}/yr
                  </p>
                </div>
                <Badge
                  className={
                    type!.category === 'SENIOR'
                      ? 'bg-violet-100 text-violet-800 border-violet-200 text-xs'
                      : 'bg-sky-100 text-sky-800 border-sky-200 text-xs'
                  }
                >
                  {type!.category}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dependents Summary */}
      {(values.dependents ?? []).length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Dependents ({values.dependents!.length})</h3>
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {values.dependents!.map((dep, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="font-medium">{dep.name}</span>
                <span className="text-muted-foreground">— {dep.relationship}</span>
                {dep.age != null && <span className="text-muted-foreground">(Age {dep.age})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Additional Notes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="wiz-notes" className="text-sm font-semibold">
            Additional Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
        </div>
        <Textarea
          id="wiz-notes"
          placeholder="Any special circumstances or additional information for the Housing Secretary…"
          rows={3}
          maxLength={500}
          {...register('additionalNotes')}
          className={errors.additionalNotes ? 'border-destructive' : ''}
        />
        <div className="flex justify-between">
          {errors.additionalNotes && (
            <p className="text-xs text-destructive">{errors.additionalNotes.message}</p>
          )}
          <p className="text-xs text-muted-foreground ml-auto">
            {(watch('additionalNotes') ?? '').length} / 500
          </p>
        </div>
      </div>

      {/* Declaration */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 space-y-1">
        <p className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Declaration
        </p>
        <p className="text-emerald-700 leading-relaxed">
          I confirm that the information provided is accurate and complete. I understand that
          false information may result in the rejection or revocation of my housing allocation.
        </p>
      </div>
    </div>
  );
}
