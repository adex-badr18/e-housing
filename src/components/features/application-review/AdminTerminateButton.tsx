'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminTerminateApplicationAction } from '@/app/actions/applications';
import { adminTerminateExitNoticeAction } from '@/app/actions/exit';
import { adminTerminateSchema, type AdminTerminateValues } from '@/lib/validations/housing';

interface AdminTerminateButtonProps {
  entityId: string;
  entityType: 'HousingApplication' | 'ExitNotice';
}

export function AdminTerminateButton({ entityId, entityType }: AdminTerminateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AdminTerminateValues>({
    resolver: zodResolver(adminTerminateSchema),
    defaultValues: {
      entityId,
      entityType,
      reason: '',
    },
  });

  function onSubmit(values: AdminTerminateValues) {
    startTransition(async () => {
      const res = await (entityType === 'HousingApplication'
        ? adminTerminateApplicationAction(values)
        : adminTerminateExitNoticeAction(values));
        
      if (res.success) {
        toast.success(`Successfully terminated ${entityType === 'HousingApplication' ? 'application' : 'exit notice'}`);
        setIsOpen(false);
      } else {
        toast.error(res.error ?? 'Failed to terminate');
      }
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-background text-red-700 border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1.5"
      >
        <ShieldAlert className="h-3.5 w-3.5" /> Terminate Administratively
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b bg-red-50">
          <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> Administrative Termination
          </h3>
          <p className="text-sm text-red-700 mt-1">
            You are about to forcibly terminate this {entityType === 'HousingApplication' ? 'application' : 'exit notice'}. This action cannot be undone.
          </p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Reason for Termination</label>
            <textarea
              {...form.register('reason')}
              rows={4}
              placeholder="State the reason for this administrative action..."
              className={cn(
                'w-full text-sm px-3 py-2 rounded-xl border bg-background resize-none',
                'focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition'
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Termination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
