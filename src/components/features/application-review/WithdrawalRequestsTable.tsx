'use client';

// =============================================================================
// WithdrawalRequestsTable — Modern Table for Pending Withdrawal / Quit Requests
// =============================================================================
// Displays pending staff-initiated withdrawal requests for Housing Applications
// or Exit Notices in a clean, high-density Shadcn table with inline review actions.
// =============================================================================

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2,
  Check,
  X,
  FileX2,
  ExternalLink,
  User,
  GraduationCap,
  Calendar,
  Clock,
  Home,
  LogOut,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { reviewQuitRequestAction } from '@/app/actions/applications';
import type { EnrichedQuitRequest } from '@/lib/mock-api/endpoints/applications';

interface WithdrawalRequestsTableProps {
  requests: EnrichedQuitRequest[];
  hideIfEmpty?: boolean;
}

// Stage badge styles
const STAGE_STYLES: Record<string, string> = {
  HOUSING: 'bg-blue-50 text-blue-700 border-blue-200',
  ESTATE: 'bg-purple-50 text-purple-700 border-purple-200',
  DVC: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// Application status styles
const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  UNDER_REVIEW: 'bg-sky-50 text-sky-700 border-sky-200',
  FORWARDED: 'bg-blue-50 text-blue-700 border-blue-200',
  QUEUED: 'bg-orange-50 text-orange-700 border-orange-200',
  RETURNED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  QUIT_REQUESTED: 'bg-orange-50 text-orange-700 border-orange-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  WITHDRAWN: 'bg-slate-100 text-slate-700 border-slate-200',
  TERMINATED: 'bg-red-50 text-red-700 border-red-200',
};

export function WithdrawalRequestsTable({
  requests,
  hideIfEmpty = false,
}: WithdrawalRequestsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<EnrichedQuitRequest | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  if (hideIfEmpty && pendingRequests.length === 0) {
    return null;
  }

  function onReview(id: string, decision: 'APPROVED' | 'REJECTED') {
    setProcessingId(id);
    startTransition(async () => {
      const res = await reviewQuitRequestAction({
        quitRequestId: id,
        decision,
      });

      if (res.success) {
        toast.success(
          `Withdrawal request ${decision === 'APPROVED' ? 'approved' : 'rejected'} successfully`
        );
        if (selectedRequestForDetails?.id === id) {
          setSelectedRequestForDetails(null);
        }
      } else {
        toast.error(res.error ?? `Failed to ${decision.toLowerCase()} request`);
      }
      setProcessingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {/* Header with counter badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <FileX2 className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-oau-navy">Pending Withdrawal Requests</h2>
            <p className="text-xs text-muted-foreground">
              Review and act on staff requests to withdraw applications or exit notices.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200 font-semibold px-2.5 py-0.5 text-xs"
        >
          {pendingRequests.length} Pending
        </Badge>
      </div>

      {/* Table container */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider w-32">
                Date Requested
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Applicant
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Target Record
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                Current Stage / Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider max-w-[280px]">
                Reason
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-28 text-center text-muted-foreground text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Clock className="h-6 w-6 text-muted-foreground/40 mb-1" />
                    <p className="font-semibold text-foreground">No pending withdrawal requests</p>
                    <p className="text-xs text-muted-foreground">
                      All withdrawal submissions have been reviewed.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pendingRequests.map(req => {
                const {
                  applicantUser,
                  applicantProfile,
                  application,
                  preferredHousingTypeNames,
                } = req;
                const isProcessing = isPending && processingId === req.id;
                const stage = application?.currentStage;
                const appStatus = application?.status;

                const isHousingApp = req.entityType === 'HousingApplication';
                const targetUrl = isHousingApp
                  ? `/management/applications/${req.entityId}`
                  : `/management/exit/${req.entityId}`;

                return (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition">
                    {/* Date Requested */}
                    <TableCell className="align-top py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="font-medium text-foreground">
                          {format(new Date(req.createdAt), 'dd MMM yyyy')}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground pl-5 block">
                        {format(new Date(req.createdAt), 'HH:mm')}
                      </span>
                    </TableCell>

                    {/* Applicant */}
                    <TableCell className="align-top py-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground leading-tight">
                            {applicantUser
                              ? `${applicantUser.firstName} ${applicantUser.lastName}`
                              : 'Unknown Applicant'}
                          </p>
                          {applicantProfile && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              <GraduationCap className="h-3 w-3 shrink-0" />
                              <span>{applicantProfile.rank}</span>
                              {(applicantProfile.salaryLevel ||
                                applicantProfile.salaryGradeLevel) && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Grade{' '}
                                    {applicantProfile.salaryLevel ||
                                      applicantProfile.salaryGradeLevel}
                                  </span>
                                </>
                              )}
                              {applicantProfile.department && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[130px]">
                                    {applicantProfile.department}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Target Record */}
                    <TableCell className="align-top py-3.5">
                      <div>
                        <Link
                          href={targetUrl}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
                        >
                          {isHousingApp ? (
                            <Home className="h-3.5 w-3.5 text-primary/80" />
                          ) : (
                            <LogOut className="h-3.5 w-3.5 text-primary/80" />
                          )}
                          <span>
                            {isHousingApp ? 'Housing Application' : 'Exit Notice'}
                          </span>
                          <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition" />
                        </Link>
                        {preferredHousingTypeNames.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[160px]">
                            {preferredHousingTypeNames.join(', ')}
                          </p>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground block">
                          ID: {req.entityId}
                        </span>
                      </div>
                    </TableCell>

                    {/* Current Stage / Status */}
                    <TableCell className="align-top py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {stage && (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase',
                              STAGE_STYLES[stage] ?? 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {stage}
                          </span>
                        )}
                        {appStatus && (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase',
                              STATUS_STYLES[appStatus] ?? 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {appStatus.replace(/_/g, ' ')}
                          </span>
                        )}
                        {!stage && !appStatus && (
                          <Badge variant="outline" className="text-[10px]">
                            Notice Stage
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Reason */}
                    <TableCell className="align-top py-3.5 max-w-[280px]">
                      <div className="text-xs text-foreground bg-muted/40 p-2 rounded-lg border border-border/50">
                        <p className="line-clamp-2" title={req.reason}>
                          {req.reason}
                        </p>
                        {req.reason.length > 80 && (
                          <button
                            type="button"
                            onClick={() => setSelectedRequestForDetails(req)}
                            className="text-[11px] text-primary hover:underline font-medium mt-1 block"
                          >
                            View full reason
                          </button>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top py-3.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReview(req.id, 'REJECTED')}
                          disabled={isPending}
                          className="h-8 px-2.5 text-xs font-medium border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onReview(req.id, 'APPROVED')}
                          disabled={isPending}
                          className="h-8 px-2.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal for full reason / request overview */}
      <Dialog
        open={Boolean(selectedRequestForDetails)}
        onOpenChange={open => {
          if (!open) setSelectedRequestForDetails(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-oau-navy">
              <Info className="h-4 w-4 text-orange-600" />
              Withdrawal Request Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Staff withdrawal request details and review notes.
            </DialogDescription>
          </DialogHeader>

          {selectedRequestForDetails && (
            <div className="space-y-4 pt-1 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl space-y-2 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applicant:</span>
                  <span className="font-semibold text-foreground">
                    {selectedRequestForDetails.applicantUser
                      ? `${selectedRequestForDetails.applicantUser.firstName} ${selectedRequestForDetails.applicantUser.lastName}`
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Record:</span>
                  <span className="font-semibold text-foreground">
                    {selectedRequestForDetails.entityType} ({selectedRequestForDetails.entityId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>
                    {format(
                      new Date(selectedRequestForDetails.createdAt),
                      'dd MMM yyyy, HH:mm'
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Full Withdrawal Reason
                </label>
                <div className="p-3 bg-muted/30 border rounded-lg text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedRequestForDetails.reason}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(selectedRequestForDetails.id, 'REJECTED')}
                  disabled={isPending}
                  className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Reject Request
                </Button>
                <Button
                  size="sm"
                  onClick={() => onReview(selectedRequestForDetails.id, 'APPROVED')}
                  disabled={isPending}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Approve Withdrawal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

