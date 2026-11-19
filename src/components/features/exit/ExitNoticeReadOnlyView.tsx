'use client';

// =============================================================================
// ExitNoticeReadOnlyView — Read-only pipeline view for staff & history
// =============================================================================
// Phase 4 refactor (Step 20):
//   - Reads canonical fields (housingPaymentStatus, electricalFittingStatus)
//     with deprecated alias fallbacks
//   - GracePeriodBanner added (universal — shown for every active notice)
//   - Management-initiation info banner (shows initiating officer name + date)
//   - ALLOCATION_CHANGE exit reason label added
//   - isAdminTerminated banner shown distinctly from isWithdrawn
//   - Parallel stage layout (A and B side-by-side)
//   - Stage C shown separately below with lock indicator when not yet unlocked
//   - QuitRequest button removed (staff no longer controls exit initiation)
// =============================================================================

import { cn } from '@/lib/utils';
import {
  Home, Zap, Building2, CheckCircle2, XCircle, Clock,
  Shield, Calendar, User, FileX2, Lock, AlertTriangle,
  Info,
} from 'lucide-react';
import type { ExitNotice } from '@/lib/mock-api/db';
import { GracePeriodBanner } from './GracePeriodBanner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StageStatus = 'PENDING' | 'PASSED' | 'FAILED';

const EXIT_REASON_LABELS: Record<string, string> = {
  RETIREMENT:        'Retirement',
  DEATH:             'Death of Occupant',
  RESIGNATION:       'Resignation',
  RELOCATION:        'Personal Relocation',
  TRANSFER:          'Transfer to Another Institution',
  ALLOCATION_CHANGE: 'Change of Allocation (Promotion)',
  OTHER:             'Other',
};

function formatExitReason(reason: string, customReason?: string | null): string {
  const label = EXIT_REASON_LABELS[reason] ?? reason.toLowerCase().replace(/_/g, ' ');
  return reason === 'OTHER' && customReason ? `${label} — ${customReason}` : label;
}

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', ...opts,
  });
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StageStatus }) {
  const config = {
    PENDING: { icon: Clock,        label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    PASSED:  { icon: CheckCircle2, label: 'Passed',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    FAILED:  { icon: XCircle,      label: 'Failed',  cls: 'bg-red-50 text-red-700 border-red-200' },
  }[status];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border', config.cls)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ParallelStageCard (read-only) — Stage A or B
// ---------------------------------------------------------------------------

function ParallelStageCard({
  label,
  unit,
  status,
  inspectorLabel,
  inspectionDate,
  index,
}: {
  label: string;
  unit: string;
  icon: React.ElementType;
  status: StageStatus;
  inspectorLabel: string;
  inspectionDate?: string | null;
  index: number;
}) {
  const isPassed = status === 'PASSED';
  const isFailed = status === 'FAILED';

  return (
    <div className={cn(
      'rounded-xl border p-4 flex flex-col gap-2 transition-all',
      isPassed ? 'border-emerald-200 bg-emerald-50/50' :
      isFailed ? 'border-red-200 bg-red-50/50' :
      'border-border bg-card'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border',
            isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
            isFailed ? 'bg-red-500 border-red-500 text-white' :
            'bg-muted border-border text-muted-foreground'
          )}>
            {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> :
             isFailed ? <XCircle className="h-3.5 w-3.5" /> :
             String.fromCharCode(65 + index)}
          </div>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Inspector + date when actioned */}
      {(isPassed || isFailed) && inspectionDate && (
        <div className="pt-2 border-t text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {inspectorLabel}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {fmtDate(inspectionDate)}
          </div>
        </div>
      )}

      {/* Pending hint */}
      {status === 'PENDING' && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-auto">
          <Clock className="h-3.5 w-3.5" />
          Awaiting {inspectorLabel}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FinalStageCard (read-only) — Stage C
// ---------------------------------------------------------------------------

function FinalStageCard({
  notice,
  isUnlocked,
}: {
  notice: ExitNotice;
  isUnlocked: boolean;
}) {
  const status = notice.estateInspectionStatus as StageStatus;
  const isPassed = status === 'PASSED';
  const isFailed = status === 'FAILED';

  return (
    <div className="relative flex gap-4">
      {/* Step circle */}
      <div className={cn(
        'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-base',
        isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
        isFailed ? 'bg-red-500 border-red-500 text-white' :
        isUnlocked ? 'bg-primary border-primary text-white' :
        'bg-muted border-border text-muted-foreground'
      )}>
        {isPassed ? <CheckCircle2 className="h-5 w-5" /> :
         isFailed ? <XCircle className="h-5 w-5" /> :
         !isUnlocked ? <Lock className="h-4 w-4" /> :
         'C'}
      </div>

      {/* Card */}
      <div className={cn(
        'flex-1 rounded-xl border p-4 transition-all',
        isPassed ? 'border-emerald-200 bg-emerald-50/50' :
        isFailed ? 'border-red-200 bg-red-50/50' :
        isUnlocked ? 'border-primary/20 bg-primary/5' :
        'border-border bg-card opacity-60'
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className={cn(
              'h-5 w-5',
              isPassed ? 'text-emerald-600' :
              isFailed ? 'text-red-500' :
              isUnlocked ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div>
              <p className="font-semibold text-base">Pre-Vacation Site Inspection</p>
              <p className="text-sm text-muted-foreground">Estate Office</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Lock hint */}
        {!isUnlocked && (
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Waiting for Housing Payment and Electrical Fittings clearances
          </p>
        )}

        {/* Inspection notes */}
        {isPassed && notice.estateInspectionNotes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Site Observations</p>
            <p className="text-sm">{notice.estateInspectionNotes}</p>
          </div>
        )}

        {/* Date */}
        {(isPassed || isFailed) && notice.estateInspectionDate && (
          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {fmtDate(notice.estateInspectionDate)}
          </div>
        )}

        {/* Pending unlock */}
        {isUnlocked && status === 'PENDING' && (
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Awaiting Estate Officer site inspection
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export interface ExitNoticeReadOnlyViewProps {
  notice: ExitNotice;
  initiatorName?: string | null;
}

export function ExitNoticeReadOnlyView({ notice, initiatorName }: ExitNoticeReadOnlyViewProps) {
  // Canonical fields with deprecated alias fallbacks
  const housingStatus =
    (notice.housingPaymentStatus ?? notice.housingInspectionStatus ?? 'PENDING') as StageStatus;
  const electricalStatus =
    (notice.electricalFittingStatus ?? notice.electricalInspectionStatus ?? 'PENDING') as StageStatus;
  const estateStatus = notice.estateInspectionStatus as StageStatus;

  const isEstateUnlocked = housingStatus === 'PASSED' && electricalStatus === 'PASSED';
  const passedCount = [housingStatus, electricalStatus, estateStatus].filter(s => s === 'PASSED').length;
  const progressPct = Math.round((passedCount / 3) * 100);

  const housingDate = notice.housingPaymentClearedAt ?? notice.housingInspectionDate;
  const electricalDate = notice.electricalFittingClearedAt ?? notice.electricalInspectionDate;

  const isTerminated = notice.isAdminTerminated;
  const isWithdrawn = notice.isWithdrawn && !notice.isAdminTerminated;

  return (
    <div className="space-y-6">
      {/* Management-initiation info banner */}
      {notice.initiatedByUserId && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            This exit was initiated by{' '}
            {initiatorName ? (
              <strong>{initiatorName} (Estate Office)</strong>
            ) : (
              <strong>the Estate Office</strong>
            )}{' '}
            on <strong>{fmtDate(notice.submittedAt)}</strong>.{' '}
            {notice.gracePeriodDeadline && (
              <>You have until <strong>{fmtDate(notice.gracePeriodDeadline)}</strong> to complete the exit process.</>
            )}
          </p>
        </div>
      )}

      {/* Grace period banner — shown for all active notices */}
      {!notice.isCleared && !isTerminated && !isWithdrawn && notice.gracePeriodDeadline && (
        <GracePeriodBanner
          deadline={notice.gracePeriodDeadline}
          extended={notice.gracePeriodExtended}
          extensionDays={notice.gracePeriodExtensionDays ?? undefined}
        />
      )}

      {/* Full clearance banner */}
      {notice.isCleared && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-800">Full Clearance Granted</h3>
            <p className="text-base text-emerald-700 mt-1">
              All clearance stages have been completed. Your property has been vacated in the system
              and your clearance certificate has been issued.
            </p>
            {notice.clearedAt && (
              <p className="text-sm text-emerald-600 mt-2">
                Cleared on{' '}
                {new Date(notice.clearedAt).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Admin-terminated banner */}
      {isTerminated && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <FileX2 className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Exit Notice Administratively Closed</h3>
            <p className="text-base text-slate-700 mt-1">
              This exit notice has been closed by the Estate Office.
              {notice.adminTerminatedReason && (
                <> Reason: <span className="italic">{notice.adminTerminatedReason}</span></>
              )}
            </p>
            {notice.adminTerminatedAt && (
              <p className="text-sm text-slate-500 mt-1">
                Closed on {fmtDate(notice.adminTerminatedAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Withdrawn banner (occupant-initiated withdrawal) */}
      {isWithdrawn && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Exit Notice Withdrawn</h3>
            <p className="text-base text-slate-700 mt-1">
              This exit notice has been withdrawn. Please contact the Estate Office for further guidance.
            </p>
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-muted-foreground">Exit Reason</p>
          <p className="font-semibold mt-0.5">
            {formatExitReason(notice.reason, notice.customReason)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-muted-foreground">Initiated</p>
          <p className="font-semibold mt-0.5">{fmtDate(notice.submittedAt)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-muted-foreground">Status</p>
          <p className={cn(
            'font-semibold mt-0.5',
            notice.isCleared ? 'text-emerald-600' :
            isTerminated ? 'text-slate-600' :
            isWithdrawn ? 'text-slate-500' :
            'text-amber-600'
          )}>
            {notice.isCleared ? 'Cleared' :
             isTerminated ? 'Closed' :
             isWithdrawn ? 'Withdrawn' :
             'In Progress'}
          </p>
        </div>
      </div>

      {/* Pipeline stages */}
      <div>
        <h3 className="text-base font-semibold mb-4">Clearance Pipeline</h3>

        {/* Progress bar */}
        {!notice.isCleared && (
          <div className="mb-4 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{passedCount} of 3 stages complete</span>
              <span className="text-base font-bold text-primary tabular-nums">{progressPct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Stage A + B — parallel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <ParallelStageCard
            label="Housing Payment Clearance"
            unit="Housing Unit"
            icon={Home}
            status={housingStatus}
            inspectorLabel="Housing Secretary"
            inspectionDate={housingDate}
            index={0}
          />
          <ParallelStageCard
            label="Electrical Fittings Clearance"
            unit="Electrical Unit"
            icon={Zap}
            status={electricalStatus}
            inspectorLabel="Electrical Officer"
            inspectionDate={electricalDate}
            index={1}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex-1 h-px bg-border" />
          <span className="shrink-0">Both required for final stage</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Stage C */}
        <FinalStageCard notice={notice} isUnlocked={isEstateUnlocked} />
      </div>

      {/* Additional notes */}
      {notice.additionalNotes && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Notes from Estate Office</p>
          <p className="text-base">{notice.additionalNotes}</p>
        </div>
      )}
    </div>
  );
}
