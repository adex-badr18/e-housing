'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { finalizeApplicationAction } from '@/app/actions/applications';
import { CheckCircle2, Loader2, FileCheck2, AlertTriangle } from 'lucide-react';
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

interface FinalizeApplicationButtonProps {
  applicationId: string;
}

export function FinalizeApplicationButton({ applicationId }: FinalizeApplicationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleFinalize() {
    startTransition(async () => {
      const res = await finalizeApplicationAction(applicationId);
      if (res.success) {
        toast.success('Application finalized. Occupancy record has been created.', { duration: 5000 });
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to finalize application');
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          id="finalize-application-btn"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-teal-700 hover:bg-teal-800 text-white"
        >
          <FileCheck2 className="h-4 w-4" />
          Mark Agreement as Submitted
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Confirm Finalization
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground">
              Are you sure you want to finalize this application? This action is irreversible and will officially mark the housing unit as occupied and create an active occupancy record for the applicant.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <DialogClose
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={isPending}
              className="bg-teal-700 hover:bg-teal-800 text-white"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {isPending ? 'Finalizing…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
