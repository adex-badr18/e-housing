'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Check, X, FileX2, ChevronRight, User, GraduationCap, Home, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { reviewQuitRequestAction } from '@/app/actions/applications';
import type { EnrichedQuitRequest } from '@/lib/mock-api/endpoints/applications';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface QuitRequestsPanelProps {
  requests: EnrichedQuitRequest[];
}

// Stage badge colours
const STAGE_STYLES: Record<string, string> = {
  HOUSING:   'bg-blue-100 text-blue-800 border-blue-200',
  ESTATE:    'bg-violet-100 text-violet-800 border-violet-200',
  DVC:       'bg-indigo-100 text-indigo-800 border-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

// Status badge colours
const STATUS_STYLES: Record<string, string> = {
  PENDING:        'bg-amber-100 text-amber-800 border-amber-200',
  UNDER_REVIEW:   'bg-sky-100 text-sky-800 border-sky-200',
  FORWARDED:      'bg-blue-100 text-blue-800 border-blue-200',
  QUEUED:         'bg-orange-100 text-orange-800 border-orange-200',
  RETURNED:       'bg-yellow-100 text-yellow-800 border-yellow-200',
  QUIT_REQUESTED: 'bg-orange-100 text-orange-800 border-orange-200',
  APPROVED:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED:       'bg-red-100 text-red-800 border-red-200',
  WITHDRAWN:      'bg-slate-100 text-slate-700 border-slate-200',
  TERMINATED:     'bg-red-100 text-red-900 border-red-200',
};

function Badge({ label, styleClass }: { label: string; styleClass: string }) {
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase', styleClass)}>
      {label}
    </span>
  );
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
        toast.success(`Withdrawal request ${decision === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
      } else {
        toast.error(res.error ?? `Failed to ${decision.toLowerCase()} request`);
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-oau-navy">Pending Withdrawal Requests</h2>
        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-200">
          {pendingRequests.length}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pendingRequests.map(req => {
          const { applicantUser, applicantProfile, application, preferredHousingTypeNames } = req;
          const isProcessing = isPending && processingId === req.id;
          const stage = application?.currentStage;
          const status = application?.status;

          return (
            <div
              key={req.id}
              className="bg-orange-50 border border-orange-200 rounded-xl overflow-hidden flex flex-col shadow-sm"
            >
              {/* ── Clickable card body ─────────────────────────────── */}
              <Link
                href={req.entityType === 'HousingApplication' ? `/management/applications/${req.entityId}` : '#'}
                className="group flex flex-col gap-3 p-4 hover:bg-orange-100/60 transition-colors"
              >
                {/* Card header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileX2 className="h-4 w-4 text-orange-600 shrink-0" />
                    <span className="text-sm font-semibold text-orange-900">
                      {req.entityType === 'HousingApplication' ? 'Housing Application' : 'Exit Notice'} · Withdrawal Request
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-orange-600/80 font-medium">
                      {format(new Date(req.createdAt), 'dd MMM yyyy')}
                    </span>
                    <ChevronRight className="h-4 w-4 text-orange-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Applicant identity row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-orange-200 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-orange-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-orange-950 leading-tight">
                        {applicantUser
                          ? `${applicantUser.firstName} ${applicantUser.lastName}`
                          : <span className="italic font-normal text-orange-600">Unknown applicant</span>
                        }
                      </p>
                      {applicantProfile && (
                        <p className="text-xs text-orange-700 mt-0.5 flex items-center gap-1 flex-wrap">
                          <GraduationCap className="h-3 w-3 shrink-0" />
                          <span>{applicantProfile.rank}</span>
                          {(applicantProfile.salaryLevel || applicantProfile.salaryGradeLevel) && (
                            <>
                              <span className="text-orange-400">·</span>
                              <span>Grade {applicantProfile.salaryLevel || applicantProfile.salaryGradeLevel}</span>
                            </>
                          )}
                          {applicantProfile.department && (
                            <>
                              <span className="text-orange-400">·</span>
                              <span className="truncate">{applicantProfile.department}</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stage + Status badges */}
                  {(stage || status) && (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {stage && (
                        <Badge label={stage} styleClass={STAGE_STYLES[stage] ?? 'bg-gray-100 text-gray-700 border-gray-200'} />
                      )}
                      {status && (
                        <Badge label={status.replace('_', ' ')} styleClass={STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'} />
                      )}
                    </div>
                  )}
                </div>

                {/* Application context row */}
                {application && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-orange-700">
                    {preferredHousingTypeNames.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3 shrink-0" />
                        <span className="font-medium">{preferredHousingTypeNames.join(', ')}</span>
                      </span>
                    )}
                    <span className="text-orange-300">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Submitted {format(new Date(application.submittedAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}

                {/* Reason box */}
                <div className="text-sm bg-white border border-orange-100 rounded-lg p-3 text-orange-950">
                  <span className="font-semibold block mb-1 text-xs uppercase tracking-wide text-orange-600">Reason</span>
                  <span className="opacity-90 text-sm">{req.reason}</span>
                </div>
              </Link>

              {/* ── Action buttons (not inside the link) ───────────── */}
              <div className="px-4 pb-4 pt-1 flex items-center gap-2 border-t border-orange-200/60 mt-auto">
                <button
                  onClick={() => onReview(req.id, 'REJECTED')}
                  disabled={isPending}
                  className="flex-1 py-1.5 px-3 rounded-lg text-sm font-medium border border-orange-300 text-orange-800 hover:bg-orange-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
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
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Approve Withdrawal
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
