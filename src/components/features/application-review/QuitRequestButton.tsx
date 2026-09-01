'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitQuitRequestAction } from '@/app/actions/applications';
import { submitQuitRequestSchema, type SubmitQuitRequestValues } from '@/lib/validations/housing';

interface QuitRequestButtonProps {
  entityId: string;
  entityType: 'HousingApplication' | 'ExitNotice';
  hasPendingRequest?: boolean;
}

export function QuitRequestButton({ entityId, entityType, hasPendingRequest }: QuitRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const label = entityType === 'HousingApplication' ? 'Withdraw Application' : 'Withdraw Notice';

  const form = useForm<SubmitQuitRequestValues>({
    resolver: zodResolver(submitQuitRequestSchema),
    defaultValues: {
      entityId,
      entityType,
      reason: '',
    },
  });

  function onSubmit(values: SubmitQuitRequestValues) {
    startTransition(async () => {
      const res = await submitQuitRequestAction(values);
      if (res.success) {
        toast.success('Withdrawal request submitted successfully');
        setIsOpen(false);
      } else {
        toast.error(res.error ?? 'Failed to submit withdrawal request');
      }
    });
  }

  if (hasPendingRequest) {
    return (
      <button
        disabled
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-orange-50 border-orange-200 text-orange-800 flex items-center gap-1.5 opacity-80 cursor-not-allowed"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Awaiting Withdrawal Approval
      </button>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-background text-destructive hover:bg-destructive/5 transition-colors flex items-center gap-1.5"
      >
        <XCircle className="h-3.5 w-3.5" /> {label}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b">
          <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" /> Request Withdrawal
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to withdraw this {entityType === 'HousingApplication' ? 'application' : 'exit notice'}? This request must be approved by the Housing Secretary.
          </p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Reason for Withdrawal</label>
            <textarea
              {...form.register('reason')}
              rows={4}
              placeholder="Please explain why you want to withdraw..."
              className={cn(
                'w-full text-sm px-3 py-2 rounded-xl border bg-background resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
              )}
            />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                form.reset();
              }}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm border hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-destructive text-white hover:bg-destructive/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
