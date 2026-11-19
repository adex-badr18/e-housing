'use client';

// =============================================================================
// ExtendGracePeriodModal — Estate Officer extends the grace period deadline
// =============================================================================
// Phase 5 [23]
// Used on the /management/exit/[exitId] detail page.
// Only ESTATE_OFFICER and SUPER_ADMIN can see + use this button.
// Calls extendGracePeriodAction — adds additionalDays to the current deadline.
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { extendGracePeriodAction } from '@/app/actions/exit';
import { extendGracePeriodSchema } from '@/lib/validations/housing';
import { CalendarClock, Loader2, RefreshCw, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormValues = z.infer<typeof extendGracePeriodSchema>;

// ---------------------------------------------------------------------------
// New deadline preview helper
// ---------------------------------------------------------------------------

function computeNewDeadline(currentDeadline: string, additionalDays: number): string {
  const d = new Date(currentDeadline);
  d.setDate(d.getDate() + additionalDays);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

interface ExtendGracePeriodModalProps {
  exitNoticeId: string;
  occupantName: string;
  /** The current gracePeriodDeadline ISO string */
  currentDeadline: string;
  /** Whether this is already an extended deadline */
  alreadyExtended?: boolean;
}

export function ExtendGracePeriodModal({
  exitNoticeId,
  occupantName,
  currentDeadline,
  alreadyExtended = false,
}: ExtendGracePeriodModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(extendGracePeriodSchema),
    defaultValues: {
      exitNoticeId,
      additionalDays: 30,
      reason: '',
    },
  });

  const additionalDays = watch('additionalDays');
  const previewDeadline =
    additionalDays > 0 && additionalDays <= 180
      ? computeNewDeadline(currentDeadline, Number(additionalDays))
      : null;

  const currentFormatted = new Date(currentDeadline).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await extendGracePeriodAction(data);
      if (result.success) {
        toast.success('Grace period extended', {
          description: `The deadline for ${occupantName} has been extended by ${data.additionalDays} day${data.additionalDays === 1 ? '' : 's'}.`,
        });
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error('Failed to extend grace period', { description: result.error });
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
          id="btn-extend-grace-period"
          variant="outline"
          className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
        />
      }>
        <RefreshCw className="h-4 w-4" />
        {alreadyExtended ? 'Extend Again' : 'Extend Grace Period'}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <CalendarClock className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle>Extend Grace Period</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                Add additional days to <strong>{occupantName}</strong>&apos;s grace period deadline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current deadline info */}
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">Current deadline</p>
            <p className="text-blue-700">{currentFormatted}</p>
            {alreadyExtended && (
              <p className="text-blue-600 text-xs mt-0.5">This deadline has already been extended at least once.</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('exitNoticeId')} />

          {/* Additional days */}
          <div className="space-y-1.5">
            <Label htmlFor="extend-days" className="text-sm font-semibold">
              Additional Days <span className="text-red-500">*</span>
            </Label>
            <Input
              id="extend-days"
              type="number"
              min={1}
              max={180}
              {...register('additionalDays', { valueAsNumber: true })}
              className="text-sm"
              placeholder="e.g. 30"
            />
            <p className="text-xs text-muted-foreground">
              Must be between 1 and 180 days. The extension is added to the <em>current deadline</em>, not today.
            </p>
            {errors.additionalDays && (
              <p className="text-sm text-red-600">{errors.additionalDays.message}</p>
            )}
          </div>

          {/* New deadline preview */}
          {previewDeadline && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-0.5">New deadline preview</p>
              <p className="font-bold text-indigo-900">{previewDeadline}</p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="extend-reason" className="text-sm font-semibold">
              Reason for Extension <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="extend-reason"
              {...register('reason')}
              placeholder="Explain why the grace period is being extended (e.g. occupant has extenuating circumstances, outstanding documentation pending, etc.)"
              className="resize-none text-sm min-h-[90px]"
            />
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose
              render={<Button variant="outline" id="btn-extend-cancel" />}
              onClick={() => reset()}
            >
              Cancel
            </DialogClose>
            <Button
              id="btn-extend-confirm"
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isPending ? 'Extending…' : 'Confirm Extension'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
