'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, X, FileX2 } from 'lucide-react';
import { format } from 'date-fns';
import { reviewQuitRequestAction } from '@/app/actions/applications';
import type { QuitRequest } from '@/lib/mock-api/db';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface QuitRequestsPanelProps {
  requests: QuitRequest[];
}

export function QuitRequestsPanel({ requests }: QuitRequestsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  if (pendingRequests.length === 0) return null;

  function onReview(id: string, decision: 'APPROVED' | 'REJECTED') {
    setProcessingId(id);
    startTransition(async () => {
      const res = await reviewQuitRequestAction({
        quitRequestId: id,
        decision,
      });

      if (res.success) {
        toast.success(`Quit request ${decision.toLowerCase()} successfully`);
      } else {
        toast.error(res.error ?? `Failed to ${decision.toLowerCase()} request`);
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-oau-navy">Pending Withdrawal Requests</h2>
        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full">
          {pendingRequests.length}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pendingRequests.map(req => (
          <div key={req.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileX2 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">
                  {req.entityType === 'HousingApplication' ? 'Housing Application' : 'Exit Notice'}
                </span>
              </div>
              <span className="text-xs text-orange-600/80 font-medium">
                {format(new Date(req.createdAt), 'dd MMM yyyy, HH:mm')}
              </span>
            </div>

            <div className="text-sm bg-white border border-orange-100 rounded-lg p-3 text-orange-950">
              <span className="font-semibold block mb-1">Reason:</span>
              <span className="opacity-90">{req.reason}</span>
            </div>

            <div className="text-xs text-orange-700/80 mb-2">
              Entity ID:{' '}
              {req.entityType === 'HousingApplication' ? (
                <Link href={`/management/applications/${req.entityId}`} className="font-mono font-medium hover:underline">
                  {req.entityId}
                </Link>
              ) : (
                <span className="font-mono font-medium">{req.entityId}</span>
              )}
            </div>

            <div className="mt-auto pt-3 flex items-center gap-2 border-t border-orange-200/60">
              <button
                onClick={() => onReview(req.id, 'REJECTED')}
                disabled={isPending}
                className="flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border border-orange-300 text-orange-800 hover:bg-orange-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isPending && processingId === req.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Reject
              </button>
              <button
                onClick={() => onReview(req.id, 'APPROVED')}
                disabled={isPending}
                className="flex-1 py-1.5 px-3 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isPending && processingId === req.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
