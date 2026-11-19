'use client';

// =============================================================================
// ClearancePipeline — Parallel A/B + Gated C Inspection Management Component
// =============================================================================
// Phase 4 refactor:
//   Stage A: Housing Payment Clearance      (HOUSING_SECRETARY) — always open
//   Stage B: Electrical Fittings Clearance  (ELECTRICAL_OFFICER) — always open (parallel to A)
//   Stage C: Pre-Vacation Site Inspection   (ESTATE_OFFICER) — unlocked only when A + B pass
//
// Key changes from the old sequential pipeline:
//   - No sequential lock between A and B; both are open simultaneously
//   - Stage C gate reads canonical fields (housingPaymentStatus, electricalFittingStatus)
//     with fallback to deprecated aliases
//   - Re-submission (FAILED → PASSED) is now allowed for the same authorised role
//   - StageActionPanel shows inspectionNotes textarea for the ESTATE stage
//   - A+B both-passed banner unlocks the Stage C panel
//   - Progress bar uses canonical field values
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Home, Zap, Building2, CheckCircle2, XCircle, Clock,
  Lock, Loader2, AlertTriangle, Shield, User, Calendar,
  ChevronRight, RefreshCw, FileCheck2,
} from 'lucide-react';
import { updateExitInspectionAction } from '@/app/actions/exit';
import type { ExitNotice, Role, User as UserType } from '@/lib/mock-api/db';
import { GracePeriodBanner } from './GracePeriodBanner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InspectionStage = 'HOUSING' | 'ELECTRICAL' | 'ESTATE';
type StageStatus = 'PENDING' | 'PASSED' | 'FAILED';

interface ParallelStageDef {
  stage: InspectionStage;
  label: string;
  unit: string;
  description: string;
  icon: React.ElementType;
  authorisedRole: Role;
  roleLabel: string;
  getStatus: (n: ExitNotice) => StageStatus;
  getInspectorId: (n: ExitNotice) => string | null | undefined;
  getDate: (n: ExitNotice) => string | null | undefined;
}

// ---------------------------------------------------------------------------
// Stage definitions — canonical fields with deprecated alias fallbacks
// ---------------------------------------------------------------------------

const PARALLEL_STAGES: ParallelStageDef[] = [
  {
    stage: 'HOUSING',
    label: 'Housing Payment Clearance',
    unit: 'Housing Unit',
    description:
      'Verify all outstanding rent, levies, and charges are fully settled, then issue the payment clearance certificate.',
    icon: Home,
    authorisedRole: 'HOUSING_SECRETARY',
    roleLabel: 'Housing Secretary',
    getStatus: n => (n.housingPaymentStatus ?? n.housingInspectionStatus ?? 'PENDING') as StageStatus,
    getInspectorId: n => n.housingPaymentClearedById ?? n.housingInspectedById,
    getDate: n => n.housingPaymentClearedAt ?? n.housingInspectionDate,
  },
  {
    stage: 'ELECTRICAL',
    label: 'Electrical Fittings Clearance',
    unit: 'Electrical Unit',
    description:
      'Inspect all electrical installations and fittings. Issue clearance certificate if in satisfactory condition.',
    icon: Zap,
    authorisedRole: 'ELECTRICAL_OFFICER',
    roleLabel: 'Electrical Officer',
    getStatus: n => (n.electricalFittingStatus ?? n.electricalInspectionStatus ?? 'PENDING') as StageStatus,
    getInspectorId: n => n.electricalFittingClearedById ?? n.electricalInspectedById,
    getDate: n => n.electricalFittingClearedAt ?? n.electricalInspectionDate,
  },
];

const FINAL_STAGE: ParallelStageDef = {
  stage: 'ESTATE',
  label: 'Pre-Vacation Site Inspection',
  unit: 'Estate Office',
  description:
    'Estate Officer accompanies the occupant to the property for a final physical walkthrough. Both clearance certificates must be received before this stage can be submitted.',
  icon: Building2,
  authorisedRole: 'ESTATE_OFFICER',
  roleLabel: 'Estate Officer',
  getStatus: n => n.estateInspectionStatus as StageStatus,
  getInspectorId: n => n.estateInspectedById,
  getDate: n => n.estateInspectionDate,
};

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StageStatus }) {
  const map = {
    PENDING: { icon: Clock,        label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    PASSED:  { icon: CheckCircle2, label: 'Passed',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    FAILED:  { icon: XCircle,      label: 'Failed',  cls: 'bg-red-50 text-red-700 border-red-200' },
  }[status];
  const Icon = map.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border', map.cls)}>
      <Icon className="h-3.5 w-3.5" />
      {map.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StageActionPanel — authorised users submit PASSED or FAILED
// Re-submission (FAILED → PASSED) is now supported
// ---------------------------------------------------------------------------

function StageActionPanel({
  exitNoticeId,
  stage,
  currentStatus,
  onComplete,
}: {
  exitNoticeId: string;
  stage: InspectionStage;
  currentStatus: StageStatus;
  onComplete: () => void;
}) {
  const isResubmission = currentStatus === 'FAILED';
  const [choice, setChoice] = useState<'PASSED' | 'FAILED'>(isResubmission ? 'PASSED' : 'PASSED');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const res = await updateExitInspectionAction({
        exitNoticeId,
        stage,
        result: choice,
        ...(stage === 'ESTATE' && inspectionNotes.trim() ? { inspectionNotes: inspectionNotes.trim() } : {}),
      });

      if (res.success) {
        const isCleared = res.data?.isCleared;
        if (choice === 'PASSED') {
          toast.success(
            isCleared
              ? '🎉 All stages passed — clearance certificate has been issued!'
              : isResubmission
              ? 'Result updated to PASSED. Stage cleared.'
              : 'Stage passed. Clearance certificate submitted.'
          );
        } else {
          toast.warning('Stage marked as FAILED. It can be updated to PASSED once the issue is resolved.');
        }
        onComplete();
      } else {
        toast.error(res.error ?? 'Failed to submit clearance result');
      }
    });
  }

  return (
    <div className={cn(
      'mt-4 p-4 rounded-xl border-2 border-dashed space-y-4',
      isResubmission ? 'border-amber-300 bg-amber-50' : 'border-primary/30 bg-primary/5'
    )}>
      {isResubmission && (
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <RefreshCw className="h-4 w-4" />
          Re-submitting — previous result was FAILED
        </div>
      )}

      <p className={cn(
        'text-sm font-semibold uppercase tracking-wider',
        isResubmission ? 'text-amber-700' : 'text-primary'
      )}>
        {isResubmission ? 'Update Clearance Result' : 'Record Clearance Result'}
      </p>

      {/* Pass / Fail toggle */}
      <div className="flex gap-3">
        <label className={cn(
          'flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
          choice === 'PASSED' ? 'border-emerald-400 bg-emerald-50' : 'border-border hover:border-muted-foreground/40'
        )}>
          <input type="radio" value="PASSED" checked={choice === 'PASSED'} onChange={() => setChoice('PASSED')} className="sr-only" />
          <CheckCircle2 className={cn('h-5 w-5', choice === 'PASSED' ? 'text-emerald-600' : 'text-muted-foreground')} />
          <div>
            <p className="text-base font-semibold">Pass</p>
            <p className="text-sm text-muted-foreground">All requirements satisfied</p>
          </div>
        </label>

        <label className={cn(
          'flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
          choice === 'FAILED' ? 'border-red-400 bg-red-50' : 'border-border hover:border-muted-foreground/40'
        )}>
          <input type="radio" value="FAILED" checked={choice === 'FAILED'} onChange={() => setChoice('FAILED')} className="sr-only" />
          <XCircle className={cn('h-5 w-5', choice === 'FAILED' ? 'text-red-500' : 'text-muted-foreground')} />
          <div>
            <p className="text-base font-semibold">Fail</p>
            <p className="text-sm text-muted-foreground">Issues found — flag for remediation</p>
          </div>
        </label>
      </div>

      {/* Inspection notes — ESTATE stage only */}
      {stage === 'ESTATE' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Site Inspection Observations <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={inspectionNotes}
            onChange={e => setInspectionNotes(e.target.value)}
            placeholder="Record key findings from the physical walkthrough — condition of property, items noted, etc."
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{inspectionNotes.length}/1000</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-base transition-all',
          choice === 'PASSED'
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-destructive text-white hover:bg-destructive/90',
          'disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
        )}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Saving…' : `Confirm — Mark as ${choice}`}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParallelStageCard — Housing or Electrical (always unlocked, side-by-side)
// ---------------------------------------------------------------------------

function ParallelStageCard({
  def,
  notice,
  index,
  currentUserRole,
  users,
  onComplete,
}: {
  def: ParallelStageDef;
  notice: ExitNotice;
  index: number;
  currentUserRole: Role;
  users: UserType[];
  onComplete: () => void;
}) {
  const Icon = def.icon;
  const status = def.getStatus(notice);
  const inspectorId = def.getInspectorId(notice);
  const date = def.getDate(notice);
  const inspector = users.find(u => u.id === inspectorId);

  const isPassed = status === 'PASSED';
  const isFailed = status === 'FAILED';

  // Allow action when PENDING or FAILED (re-submission)
  const canAct =
    (status === 'PENDING' || status === 'FAILED') &&
    (currentUserRole === def.authorisedRole || currentUserRole === 'SUPER_ADMIN');

  return (
    <div className={cn(
      'rounded-xl border p-5 flex flex-col gap-3 transition-all h-full',
      isPassed ? 'border-emerald-200 bg-emerald-50/60' :
      isFailed ? 'border-red-200 bg-red-50/60' :
      'border-primary/20 bg-primary/5 shadow-sm'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border',
            isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
            isFailed ? 'bg-red-500 border-red-500 text-white' :
            'bg-primary border-primary text-white'
          )}>
            {isPassed ? <CheckCircle2 className="h-4 w-4" /> :
             isFailed ? <XCircle className="h-4 w-4" /> :
             String.fromCharCode(65 + index)}
          </div>
          <div>
            <p className="font-semibold text-sm">{def.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{def.unit}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">{def.description}</p>

      {/* Inspector info */}
      {inspector && date && (
        <div className="pt-3 border-t grid grid-cols-1 gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {inspector.firstName} {inspector.lastName}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(date).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </div>
        </div>
      )}

      {/* Waiting hint for other roles */}
      {status === 'PENDING' && !canAct && (
        <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-auto">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Awaiting <strong className="mx-1">{def.roleLabel}</strong>
        </div>
      )}

      {/* Action panel */}
      {canAct && (
        <StageActionPanel
          exitNoticeId={notice.id}
          stage={def.stage}
          currentStatus={status}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FinalStageCard — Estate (gated: requires A + B both PASSED)
// ---------------------------------------------------------------------------

function FinalStageCard({
  notice,
  isUnlocked,
  currentUserRole,
  users,
  onComplete,
}: {
  notice: ExitNotice;
  isUnlocked: boolean;
  currentUserRole: Role;
  users: UserType[];
  onComplete: () => void;
}) {
  const def = FINAL_STAGE;
  const Icon = def.icon;
  const status = def.getStatus(notice);
  const inspectorId = def.getInspectorId(notice);
  const date = def.getDate(notice);
  const inspector = users.find(u => u.id === inspectorId);

  const isPassed = status === 'PASSED';
  const isFailed = status === 'FAILED';
  const canAct =
    isUnlocked &&
    (status === 'PENDING' || status === 'FAILED') &&
    (currentUserRole === def.authorisedRole || currentUserRole === 'SUPER_ADMIN');

  return (
    <div className="relative flex gap-5">
      {/* Step circle */}
      <div className={cn(
        'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-base transition-all',
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

      {/* Card body */}
      <div className={cn(
        'flex-1 rounded-xl border p-5 transition-all',
        isPassed ? 'border-emerald-200 bg-emerald-50/60' :
        isFailed ? 'border-red-200 bg-red-50/60' :
        isUnlocked ? 'border-primary/30 bg-primary/5 shadow-sm' :
        'border-border bg-card opacity-60'
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon className={cn(
              'h-5 w-5',
              isPassed ? 'text-emerald-600' : isFailed ? 'text-red-500' :
              isUnlocked ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div>
              <p className="font-semibold text-base">{def.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{def.unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            <StatusBadge status={status} />
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{def.description}</p>

        {/* Inspector info */}
        {inspector && date && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {inspector.firstName} {inspector.lastName}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </div>
        )}

        {/* Estate inspection notes (read-only) */}
        {isPassed && notice.estateInspectionNotes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Site Observations</p>
            <p className="text-sm text-foreground">{notice.estateInspectionNotes}</p>
          </div>
        )}

        {/* Locked hint */}
        {!isUnlocked && (
          <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Requires both Housing Payment and Electrical Fittings clearances to be PASSED
          </p>
        )}

        {/* Waiting for other role */}
        {isUnlocked && status === 'PENDING' && !canAct && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Awaiting <strong className="mx-1">{def.roleLabel}</strong> to conduct the site inspection
          </div>
        )}

        {/* Action panel */}
        {canAct && (
          <StageActionPanel
            exitNoticeId={notice.id}
            stage={def.stage}
            currentStatus={status}
            onComplete={onComplete}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

interface ClearancePipelineProps {
  notice: ExitNotice;
  currentUserRole: Role;
  users: UserType[];
}

export function ClearancePipeline({ notice, currentUserRole, users }: ClearancePipelineProps) {
  const router = useRouter();

  function handleComplete() {
    router.refresh();
  }

  // Read canonical fields with deprecated alias fallbacks
  const housingStatus =
    (notice.housingPaymentStatus ?? notice.housingInspectionStatus ?? 'PENDING') as StageStatus;
  const electricalStatus =
    (notice.electricalFittingStatus ?? notice.electricalInspectionStatus ?? 'PENDING') as StageStatus;
  const estateStatus = notice.estateInspectionStatus as StageStatus;

  const isEstateUnlocked = housingStatus === 'PASSED' && electricalStatus === 'PASSED';
  const passedCount = [housingStatus, electricalStatus, estateStatus].filter(s => s === 'PASSED').length;

  return (
    <div className="space-y-6">
      {/* Grace period banner */}
      {!notice.isCleared && notice.gracePeriodDeadline && (
        <GracePeriodBanner
          deadline={notice.gracePeriodDeadline}
          extended={notice.gracePeriodExtended}
          extensionDays={notice.gracePeriodExtensionDays ?? undefined}
        />
      )}

      {/* Full clearance banner */}
      {notice.isCleared && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-800">Property Fully Cleared</h3>
            <p className="text-base text-emerald-700 mt-0.5">
              All stages passed. The property has been vacated and the clearance certificate issued.
            </p>
          </div>
          <a
            href={`/management/exit/${notice.id}/certificate`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shrink-0"
          >
            View Certificate <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Progress bar */}
      {!notice.isCleared && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-base font-medium">Clearance Progress</span>
            <span className="text-base font-bold text-primary">{passedCount} / 3 Passed</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${(passedCount / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stage A + B — parallel, side-by-side grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">A</span>
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">B</span>
          </div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Parallel Clearance Stages — either can be submitted first
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PARALLEL_STAGES.map((def, i) => (
            <ParallelStageCard
              key={def.stage}
              def={def}
              notice={notice}
              index={i}
              currentUserRole={currentUserRole}
              users={users}
              onComplete={handleComplete}
            />
          ))}
        </div>

        {/* Certificate-received unlock banner */}
        {isEstateUnlocked && !notice.isCleared && estateStatus === 'PENDING' && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
            <FileCheck2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-800">
              Housing payment and electrical fittings certificates received.
              Estate Officer may now schedule the pre-vacation site inspection.
            </p>
          </div>
        )}
      </div>

      {/* Merge arrow → Stage C */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground pl-1">
        <div className="flex-1 h-px bg-border" />
        <span className="shrink-0 font-medium">Both certificates required for Stage C</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Stage C — Pre-Vacation Site Inspection (gated) */}
      <FinalStageCard
        notice={notice}
        isUnlocked={isEstateUnlocked}
        currentUserRole={currentUserRole}
        users={users}
        onComplete={handleComplete}
      />
    </div>
  );
}
