'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { finalizeApplicationAction } from '@/app/actions/applications';
import { CheckCircle2, Loader2, FileCheck2 } from 'lucide-react';

interface FinalizeApplicationButtonProps {
  applicationId: string;
}

export function FinalizeApplicationButton({ applicationId }: FinalizeApplicationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  function handleFinalize() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    startTransition(async () => {
      const res = await finalizeApplicationAction(applicationId);
      if (res.success) {
        toast.success('Application finalized. Occupancy record has been created.', { duration: 5000 });
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to finalize application');
        setConfirmed(false);
      }
    });
  }

  return (
    <div className="rounded-xl border-2 border-teal-200 bg-teal-50/60 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <FileCheck2 className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-teal-900 text-sm">Tenancy Agreement Submitted</p>
          <p className="text-xs text-teal-700/80 mt-0.5">
            Confirm that the stamped, signed copy of the Tenancy Agreement has been received and submitted 
            by the applicant. This will create the occupancy record and mark the housing unit as occupied.
          </p>
        </div>
      </div>

      {confirmed && !isPending && (
        <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠ Are you sure? This action is irreversible. Click again to confirm.
        </div>
      )}

      <button
        id="finalize-application-btn"
        onClick={handleFinalize}
        disabled={isPending}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          confirmed
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-teal-700 hover:bg-teal-800 text-white'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : confirmed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <FileCheck2 className="h-4 w-4" />
        )}
        {isPending ? 'Finalizing…' : confirmed ? 'Confirm Finalization' : 'Mark Agreement as Submitted'}
      </button>
    </div>
  );
}
