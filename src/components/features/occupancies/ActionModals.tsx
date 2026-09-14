'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  revokeOccupancyAction,
  triggerOccupantExitAction,
  updateOccupancyAction,
} from '@/app/actions/occupancies';
import {
  revokeOccupancySchema,
  triggerOccupantExitSchema,
  updateOccupancySchema,
  type RevokeOccupancyValues,
  type TriggerOccupantExitValues,
  type UpdateOccupancyValues,
} from '@/lib/validations/housing';
import {
  AlertTriangle,
  ShieldOff,
  DoorOpen,
  Pencil,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// 1. Revoke Allocation Modal
// ---------------------------------------------------------------------------

interface RevokeModalProps {
  occupancyId: string;
  occupantName: string;
  unitName: string;
}

export function RevokeAllocationModal({ occupancyId, occupantName, unitName }: RevokeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RevokeOccupancyValues>({
    resolver: zodResolver(revokeOccupancySchema),
    defaultValues: { occupancyId, reason: '' },
  });

  const onSubmit = (data: RevokeOccupancyValues) => {
    startTransition(async () => {
      const result = await revokeOccupancyAction(data);
      if (result.success) {
        toast.success('Occupancy revoked', {
          description: `${occupantName}'s allocation has been revoked. The unit is now vacant.`,
        });
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error('Failed to revoke', { description: result.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" id="btn-revoke-allocation" />}>
        <ShieldOff className="h-4 w-4 mr-2" />
        Revoke Allocation
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Revoke Occupancy Allocation</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                This will immediately free <strong>{unitName}</strong> and remove{' '}
                <strong>{occupantName}</strong>&apos;s housing status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <input type="hidden" {...register('occupancyId')} />

          <div className="space-y-1.5">
            <Label htmlFor="revoke-reason" className="text-xs font-semibold">
              Reason for Revocation <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="revoke-reason"
              {...register('reason')}
              placeholder="Provide a clear reason for revoking this housing allocation..."
              className="resize-none text-sm min-h-[100px]"
            />
            {errors.reason && (
              <p className="text-xs text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Warning:</strong> This action is irreversible. The occupant will need to
            reapply for housing through the standard application process.
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose render={<Button variant="outline" id="btn-revoke-cancel" />} onClick={() => reset()}>
              Cancel
            </DialogClose>
            <Button
              id="btn-revoke-confirm"
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isPending ? 'Revoking...' : 'Revoke Allocation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 2. Trigger Exit Modal (Estate Officer / Super Admin)
// ---------------------------------------------------------------------------

const EXIT_REASONS = [
  { value: 'RETIREMENT', label: 'Retirement' },
  { value: 'RESIGNATION', label: 'Resignation' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'RELOCATION', label: 'Relocation' },
  { value: 'DEATH', label: 'Death' },
  { value: 'OTHER', label: 'Other' },
] as const;

interface TriggerExitModalProps {
  occupancyId: string;
  occupantName: string;
}

export function TriggerExitModal({ occupancyId, occupantName }: TriggerExitModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TriggerOccupantExitValues>({
    resolver: zodResolver(triggerOccupantExitSchema),
    defaultValues: { occupancyId, reason: 'RETIREMENT', customReason: '', additionalNotes: '' },
  });

  const reason = watch('reason');

  const onSubmit = (data: TriggerOccupantExitValues) => {
    startTransition(async () => {
      const result = await triggerOccupantExitAction(data);
      if (result.success) {
        toast.success('Exit notice created', {
          description: `An exit notice has been triggered for ${occupantName}. It is now in the Exit Pipeline.`,
        });
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast.error('Failed to trigger exit', { description: result.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" id="btn-trigger-exit" className="border-orange-300 text-orange-700 hover:bg-orange-50" />}>
        <DoorOpen className="h-4 w-4 mr-2" />
        Trigger Exit
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <DoorOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Trigger Occupant Exit</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Initiate the exit clearance pipeline for <strong>{occupantName}</strong>. This
                creates an Exit Notice that goes through Housing, Electrical, and Estate inspections.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <input type="hidden" {...register('occupancyId')} />

          <div className="space-y-1.5">
            <Label htmlFor="trigger-reason" className="text-xs font-semibold">
              Exit Reason <span className="text-red-500">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={val => setValue('reason', val as TriggerOccupantExitValues['reason'], { shouldValidate: true })}
            >
              <SelectTrigger id="trigger-reason" className="text-sm">
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
            {errors.reason && (
              <p className="text-xs text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {reason === 'OTHER' && (
            <div className="space-y-1.5">
              <Label htmlFor="trigger-custom-reason" className="text-xs font-semibold">
                Custom Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="trigger-custom-reason"
                {...register('customReason')}
                placeholder="Describe the specific reason..."
                className="text-sm"
              />
              {errors.customReason && (
                <p className="text-xs text-red-600">{errors.customReason.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="trigger-notes" className="text-xs font-semibold">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="trigger-notes"
              {...register('additionalNotes')}
              placeholder="Any additional context or remarks..."
              className="resize-none text-sm min-h-[80px]"
            />
            {errors.additionalNotes && (
              <p className="text-xs text-red-600">{errors.additionalNotes.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose render={<Button variant="outline" id="btn-exit-cancel" />} onClick={() => reset()}>
              Cancel
            </DialogClose>
            <Button
              id="btn-exit-confirm"
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isPending ? 'Triggering...' : 'Trigger Exit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 3. Update Occupancy Information Modal
// ---------------------------------------------------------------------------

interface UpdateOccupancyModalProps {
  occupancyId: string;
  currentCheckIn: string;
  currentCheckOut?: string | null;
}

export function UpdateOccupancyModal({
  occupancyId,
  currentCheckIn,
  currentCheckOut,
}: UpdateOccupancyModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateOccupancyValues>({
    resolver: zodResolver(updateOccupancySchema),
    defaultValues: {
      occupancyId,
      checkInDate: currentCheckIn,
      checkOutDate: currentCheckOut ?? '',
    },
  });

  const onSubmit = (data: UpdateOccupancyValues) => {
    startTransition(async () => {
      const result = await updateOccupancyAction({
        ...data,
        checkOutDate: data.checkOutDate || null,
      });
      if (result.success) {
        toast.success('Occupancy updated', {
          description: 'The occupancy information has been updated successfully.',
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.error('Failed to update', { description: result.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" id="btn-update-occupancy" />}>
        <Pencil className="h-4 w-4 mr-2" />
        Update Information
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Pencil className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Update Occupancy Information</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Update check-in and check-out dates for this occupancy record.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <input type="hidden" {...register('occupancyId')} />

          <div className="space-y-1.5">
            <Label htmlFor="update-checkin" className="text-xs font-semibold">
              Check-in Date
            </Label>
            <Input
              id="update-checkin"
              type="date"
              {...register('checkInDate')}
              className="text-sm"
            />
            {errors.checkInDate && (
              <p className="text-xs text-red-600">{errors.checkInDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="update-checkout" className="text-xs font-semibold">
              Check-out Date <span className="text-gray-400">(optional — for exited occupancies)</span>
            </Label>
            <Input
              id="update-checkout"
              type="date"
              {...register('checkOutDate')}
              className="text-sm"
            />
            {errors.checkOutDate && (
              <p className="text-xs text-red-600">{String(errors.checkOutDate.message)}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose render={<Button variant="outline" id="btn-update-cancel" />} onClick={() => reset()}>
              Cancel
            </DialogClose>
            <Button
              id="btn-update-confirm"
              type="submit"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
