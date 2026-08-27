'use client';

// =============================================================================
// ExitNoticeForm — Staff Departure Submission Form
// =============================================================================
// Allows a staff member to submit an exit notice with reason, optional custom
// explanation, pre-departure acknowledgements, and additional notes.
// If an active exit notice already exists, renders ExitStatusTracker instead.
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DoorOpen, Loader2, AlertTriangle, CheckCircle2,
  Info, FileText, MapPin, UserX, Briefcase, HelpCircle,
} from 'lucide-react';
import { exitNoticeSubmitSchema, type ExitNoticeSubmitValues } from '@/lib/validations/housing';
import { submitExitNoticeAction } from '@/app/actions/exit';
import type { HousingUnit } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Acknowledgement checklist items
// ---------------------------------------------------------------------------

const ACKNOWLEDGEMENTS = [
  {
    id: 'ack-inspect',
    label: 'Property Inspection Consent',
    description: 'I understand that Housing, Electrical, and Estate officers will conduct a joint inspection of the property before clearance is issued.',
  },
  {
    id: 'ack-rent',
    label: 'No Outstanding Rent',
    description: 'I confirm that all outstanding housing rent and levies owed to the university are fully settled.',
  },
  {
    id: 'ack-bq',
    label: 'BQ Occupants Notified',
    description: 'Any Boys Quarters (BQ) occupants have been informed and will vacate the property on or before my departure date.',
  },
  {
    id: 'ack-keys',
    label: 'Keys & Access Return',
    description: 'I agree to return all property keys, access cards, and any university-issued items to the Housing Office upon final clearance.',
  },
];

const EXIT_REASONS = [
  { value: 'RETIREMENT', label: 'Retirement', icon: Briefcase, description: 'Statutory or voluntary retirement from the university' },
  { value: 'RELOCATION', label: 'Relocation', icon: MapPin, description: 'Moving to a personal or other official residence' },
  { value: 'RESIGNATION', label: 'Resignation', icon: UserX, description: 'Voluntary resignation from employment' },
  { value: 'DEATH', label: 'Death of Occupant', icon: AlertTriangle, description: 'Exit on behalf of a deceased staff member' },
  { value: 'OTHER', label: 'Other Reason', icon: HelpCircle, description: 'Please specify in the field below' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExitNoticeFormProps {
  currentUnit: HousingUnit;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExitNoticeForm({ currentUnit }: ExitNoticeFormProps) {
  const router = useRouter();
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const form = useForm<ExitNoticeSubmitValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(exitNoticeSubmitSchema) as any,
    defaultValues: {
      housingUnitId: currentUnit.id,
      reason: 'RELOCATION',
      customReason: '',
      additionalNotes: '',
    },
  });

  const selectedReason = form.watch('reason');
  const allAcknowledged = ACKNOWLEDGEMENTS.every(a => acks[a.id]);

  function toggleAck(id: string) {
    setAcks(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function onSubmit(values: ExitNoticeSubmitValues) {
    startTransition(async () => {
      const res = await submitExitNoticeAction(values);
      if (res.success) {
        toast.success('Exit notice submitted. Your clearance pipeline has been initiated.');
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to submit exit notice');
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

      {/* Unit Reference Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-amber-800 text-sm">This action initiates your housing exit process</p>
          <p className="text-xs text-amber-700 mt-1">
            You are submitting an exit notice for <strong>{currentUnit.name}</strong>.
            Once submitted, this will trigger a mandatory 3-stage inspection pipeline before clearance is issued.
          </p>
        </div>
      </div>

      {/* Reason Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Reason for Departure
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXIT_REASONS.map(reason => {
            const Icon = reason.icon;
            const isSelected = selectedReason === reason.value;
            return (
              <label
                key={reason.value}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-muted-foreground/40 bg-card'
                )}
              >
                <input
                  type="radio"
                  value={reason.value}
                  {...form.register('reason')}
                  className="sr-only"
                />
                <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <p className={cn('text-sm font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                    {reason.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{reason.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        {form.formState.errors.reason && (
          <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
        )}
      </div>

      {/* Custom Reason (conditional) */}
      {selectedReason === 'OTHER' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">Specify Reason <span className="text-destructive">*</span></label>
          <textarea
            {...form.register('customReason')}
            rows={3}
            placeholder="Please describe your specific reason for departure..."
            className={cn(
              'w-full text-sm px-3 py-2.5 rounded-xl border bg-background resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition',
              form.formState.errors.customReason ? 'border-destructive' : 'border-border'
            )}
          />
          {form.formState.errors.customReason && (
            <p className="text-xs text-destructive">{form.formState.errors.customReason.message}</p>
          )}
        </div>
      )}

      {/* Additional Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Additional Notes <span className="text-muted-foreground font-normal">(Optional)</span></label>
        <textarea
          {...form.register('additionalNotes')}
          rows={4}
          placeholder="Any additional context or special circumstances to inform the inspection team..."
          className={cn(
            'w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-background resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
          )}
        />
        {form.formState.errors.additionalNotes && (
          <p className="text-xs text-destructive">{form.formState.errors.additionalNotes.message}</p>
        )}
      </div>

      {/* Pre-Departure Acknowledgements */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          Pre-Departure Acknowledgements
        </h3>
        <div className="space-y-2">
          {ACKNOWLEDGEMENTS.map(ack => (
            <label
              key={ack.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                acks[ack.id]
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-background border-border hover:bg-muted/30'
              )}
            >
              <input
                type="checkbox"
                checked={acks[ack.id] ?? false}
                onChange={() => toggleAck(ack.id)}
                className="mt-0.5 accent-emerald-600 h-4 w-4 cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium">{ack.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ack.description}</p>
              </div>
            </label>
          ))}
        </div>
        {!allAcknowledged && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            You must acknowledge all conditions before submitting
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !allAcknowledged}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all',
          'bg-destructive text-white hover:bg-destructive/90 shadow-sm',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <DoorOpen className="h-4 w-4" />
        )}
        {isPending ? 'Submitting Exit Notice…' : 'Submit Exit Notice'}
      </button>

      {!allAcknowledged && (
        <p className="text-xs text-center text-muted-foreground">
          Complete all 4 acknowledgements to enable submission
        </p>
      )}
    </form>
  );
}
