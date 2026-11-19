'use client';

// =============================================================================
// InitiateExitModal — Estate Officer initiates an exit for an occupant
// =============================================================================
// Phase 5 [22] — replaces the old TriggerExitModal (which called the deprecated
// triggerOccupantExitAction). Calls estateOfficerInitiateExitAction instead.
//
// The occupant must physically visit the Estate Office. The officer opens the
// occupant's occupancy record and clicks "Initiate Exit" to open this modal.
//
// On submission:
//   - An exit notice is created with gracePeriodDeadline = submittedAt + 90 days
//   - Both Housing Secretary and Electrical Officer can immediately act (parallel)
//   - The notice appears on the exit list for all relevant management portals
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { estateOfficerInitiateExitAction } from '@/app/actions/exit';
import { managementInitiateExitSchema } from '@/lib/validations/housing';
import {
  DoorOpen, Loader2, CalendarClock, AlertTriangle, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormValues = z.infer<typeof managementInitiateExitSchema>;

const EXIT_REASONS = [
  { value: 'RETIREMENT',        label: 'Retirement',                         description: 'Occupant is retiring from service' },
  { value: 'RESIGNATION',       label: 'Resignation',                        description: 'Occupant has resigned from their position' },
  { value: 'TRANSFER',          label: 'Transfer to Another Institution',    description: 'Transfer to a different parastatal or institution' },
  { value: 'RELOCATION',        label: 'Personal Relocation',                description: 'Occupant is relocating to their personal property' },
  { value: 'DEATH',             label: 'Death of Occupant',                  description: 'Occupant is deceased' },
  { value: 'ALLOCATION_CHANGE', label: 'Change of Allocation (Promotion)',   description: 'A higher housing type has been approved following promotion' },
  { value: 'OTHER',             label: 'Other',                              description: 'Specify the reason below' },
] as const;

// ---------------------------------------------------------------------------
// Grace Period Info Chip
// ---------------------------------------------------------------------------

function GracePeriodChip() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 90);
  const formatted = deadline.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
      <CalendarClock className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-blue-800">90-day grace period</p>
        <p className="text-blue-700 mt-0.5">
          A grace period deadline of <strong>{formatted}</strong> will be automatically
          set. The Estate Officer can extend this if needed.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

interface InitiateExitModalProps {
  /** The active occupancy record ID */
  occupancyId: string;
  /** Display name of the occupant — used in confirmation copy */
  occupantName: string;
  /** Unit name — shown for context */
  unitName?: string;
}

export function InitiateExitModal({
  occupancyId,
  occupantName,
  unitName,
}: InitiateExitModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(managementInitiateExitSchema),
    defaultValues: {
      occupancyId,
      reason: 'RETIREMENT',
      customReason: '',
      additionalNotes: '',
    },
  });

  const reason = watch('reason');
  const selectedReasonDef = EXIT_REASONS.find(r => r.value === reason);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await estateOfficerInitiateExitAction(data);
      if (result.success) {
        toast.success('Exit notice created', {
          description: `A 90-day exit process has been initiated for ${occupantName}. The Housing Secretary and Electrical Officer have been notified.`,
        });
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error('Failed to initiate exit', { description: result.error });
      }
    });
  };

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button
          id="btn-initiate-exit"
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
        />
      }>
        <DoorOpen className="h-4 w-4" />
        Initiate Exit
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <DoorOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Initiate Exit Process</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                Opening exit clearance for <strong>{occupantName}</strong>
                {unitName && <> — <span className="font-medium">{unitName}</span></>}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Context note */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            The occupant must be physically present at the Estate Office. Confirm their reason
            for vacating before proceeding.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <input type="hidden" {...register('occupancyId')} />

          {/* Exit Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="initiate-reason" className="text-sm font-semibold">
              Exit Reason <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="initiate-reason" className="text-sm">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXIT_REASONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedReasonDef && (
              <p className="text-xs text-muted-foreground">{selectedReasonDef.description}</p>
            )}
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {/* Custom reason — shown only when OTHER is selected */}
          {reason === 'OTHER' && (
            <div className="space-y-1.5">
              <Label htmlFor="initiate-custom-reason" className="text-sm font-semibold">
                Specify Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="initiate-custom-reason"
                {...register('customReason')}
                placeholder="Describe the specific reason for vacating..."
                className="text-sm"
              />
              {errors.customReason && (
                <p className="text-sm text-red-600">{errors.customReason.message}</p>
              )}
            </div>
          )}

          {/* Additional notes */}
          <div className="space-y-1.5">
            <Label htmlFor="initiate-notes" className="text-sm font-semibold">
              Additional Notes{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="initiate-notes"
              {...register('additionalNotes')}
              placeholder="Any additional context, observations, or instructions relevant to this exit..."
              className="resize-none text-sm min-h-[80px]"
            />
          </div>

          {/* Grace period info */}
          <GracePeriodChip />

          <DialogFooter className="gap-2 pt-2">
            <DialogClose
              render={<Button variant="outline" id="btn-initiate-exit-cancel" />}
              onClick={() => reset()}
            >
              Cancel
            </DialogClose>
            <Button
              id="btn-initiate-exit-confirm"
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isPending ? 'Initiating…' : 'Initiate Exit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
