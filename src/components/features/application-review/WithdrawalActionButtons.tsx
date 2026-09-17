'use client';

// =============================================================================
// WithdrawalActionButtons — Approve / Reject a pending withdrawal request
// =============================================================================
// Displayed inline inside the "Withdrawal Requested" banner on the
// application details page. Any management role can act on it.
// =============================================================================

import { useState, useTransition } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { reviewQuitRequestAction } from '@/app/actions/applications';

interface WithdrawalActionButtonsProps {
  quitRequestId: string;
}

export function WithdrawalActionButtons({ quitRequestId }: WithdrawalActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);

  function onReview(d: 'APPROVED' | 'REJECTED') {
    setDecision(d);
    startTransition(async () => {
      const res = await reviewQuitRequestAction({ quitRequestId, decision: d });
      if (res.success) {
        toast.success(
          d === 'APPROVED'
            ? 'Withdrawal approved — application will be marked as withdrawn.'
            : 'Withdrawal request rejected.'
        );
      } else {
        toast.error(res.error ?? 'Failed to process withdrawal request');
      }
      setDecision(null);
    });
  }

  const isProcessing = isPending;

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={() => onReview('REJECTED')}
        disabled={isProcessing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-orange-300 text-orange-800 hover:bg-orange-100 transition-colors disabled:opacity-50"
      >
        {isProcessing && decision === 'REJECTED' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        Reject
      </button>
      <button
        onClick={() => onReview('APPROVED')}
        disabled={isProcessing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 shadow-sm"
      >
        {isProcessing && decision === 'APPROVED' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Approve Withdrawal
      </button>
    </div>
  );
}
