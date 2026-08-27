'use client';

// =============================================================================
// ClearancePipeline — 3-Stage Inspection Management Component
// =============================================================================
// Renders the full sequential clearance pipeline with role-gated action panels
// for each inspection stage. Only the authorised role can act on their stage.
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Home, Zap, Building2, CheckCircle2, XCircle, Clock,
  Lock, Loader2, AlertTriangle, Shield, User, Calendar,
  ChevronRight,
} from 'lucide-react';
import { updateExitInspectionAction } from '@/app/actions/exit';
import type { ExitNotice, Role, User as UserType } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InspectionStage = 'HOUSING' | 'ELECTRICAL' | 'ESTATE';
type StageStatus = 'PENDING' | 'PASSED' | 'FAILED';

interface StageDefinition {
  stage: InspectionStage;
  label: string;
  unit: string;
  icon: React.ElementType;
  authorisedRole: Role;
  roleLabel: string;
  statusKey: keyof Pick<ExitNotice, 'housingInspectionStatus' | 'electricalInspectionStatus' | 'estateInspectionStatus'>;
  inspectorKey: keyof Pick<ExitNotice, 'housingInspectedById' | 'electricalInspectedById' | 'estateInspectedById'>;
  dateKey: keyof Pick<ExitNotice, 'housingInspectionDate' | 'electricalInspectionDate' | 'estateInspectionDate'>;
}

const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    stage: 'HOUSING',
    label: 'Housing Unit Inspection',
    unit: 'Housing Secretary',
    icon: Home,
    authorisedRole: 'HOUSING_SECRETARY',
    roleLabel: 'Housing Secretary',
    statusKey: 'housingInspectionStatus',
    inspectorKey: 'housingInspectedById',
    dateKey: 'housingInspectionDate',
  },
  {
    stage: 'ELECTRICAL',
    label: 'Electrical / Power Inspection',
    unit: 'Electrical Officer',
    icon: Zap,
    authorisedRole: 'ELECTRICAL_OFFICER',
    roleLabel: 'Electrical Officer',
    statusKey: 'electricalInspectionStatus',
    inspectorKey: 'electricalInspectedById',
    dateKey: 'electricalInspectionDate',
  },
  {
    stage: 'ESTATE',
    label: 'Estate Office Inspection',
    unit: 'Estate Officer',
    icon: Building2,
    authorisedRole: 'ESTATE_OFFICER',
    roleLabel: 'Estate Officer',
    statusKey: 'estateInspectionStatus',
    inspectorKey: 'estateInspectedById',
    dateKey: 'estateInspectionDate',
  },
];

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StageStatus }) {
  const map = {
    PENDING: { icon: Clock, label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    PASSED:  { icon: CheckCircle2, label: 'Passed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    FAILED:  { icon: XCircle, label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200' },
  }[status];
  const Icon = map.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', map.cls)}>
      <Icon className="h-3.5 w-3.5" />
      {map.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StageActionPanel — where authorised users mark PASSED or FAILED
// ---------------------------------------------------------------------------

function StageActionPanel({
  exitNoticeId,
  stage,
  onComplete,
}: {
  exitNoticeId: string;
  stage: InspectionStage;
  onComplete: () => void;
}) {
  const [choice, setChoice] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const res = await updateExitInspectionAction({
        exitNoticeId,
        stage,
        result: choice,
      });

      if (res.success) {
        const isCleared = res.data?.isCleared;
        if (choice === 'PASSED') {
          toast.success(
            isCleared
              ? 'All stages passed — clearance certificate has been issued!'
              : 'Stage marked as PASSED. Next stage is now unlocked.'
          );
        } else {
          toast.error('Stage marked as FAILED. The submitter has been flagged.');
        }
        onComplete();
      } else {
        toast.error(res.error ?? 'Failed to update inspection');
      }
    });
  }

  return (
    <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-4">
      <p className="text-xs font-semibold text-primary uppercase tracking-wider">Record Your Inspection Result</p>

      {/* Pass / Fail toggle */}
      <div className="flex gap-3">
        <label className={cn(
          'flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
          choice === 'PASSED' ? 'border-emerald-400 bg-emerald-50' : 'border-border hover:border-muted-foreground/40'
        )}>
          <input
            type="radio"
            value="PASSED"
            checked={choice === 'PASSED'}
            onChange={() => setChoice('PASSED')}
            className="sr-only"
          />
          <CheckCircle2 className={cn('h-5 w-5', choice === 'PASSED' ? 'text-emerald-600' : 'text-muted-foreground')} />
          <div>
            <p className="text-sm font-semibold">Pass Inspection</p>
            <p className="text-xs text-muted-foreground">Property meets all requirements</p>
          </div>
        </label>

        <label className={cn(
          'flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
          choice === 'FAILED' ? 'border-red-400 bg-red-50' : 'border-border hover:border-muted-foreground/40'
        )}>
          <input
            type="radio"
            value="FAILED"
            checked={choice === 'FAILED'}
            onChange={() => setChoice('FAILED')}
            className="sr-only"
          />
          <XCircle className={cn('h-5 w-5', choice === 'FAILED' ? 'text-red-500' : 'text-muted-foreground')} />
          <div>
            <p className="text-sm font-semibold">Fail Inspection</p>
            <p className="text-xs text-muted-foreground">Issues found — flag for remediation</p>
          </div>
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
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
// Stage Card
// ---------------------------------------------------------------------------

function StageCard({
  def,
  notice,
  step,
  isLast,
  isUnlocked,
  currentUserRole,
  users,
  onComplete,
}: {
  def: StageDefinition;
  notice: ExitNotice;
  step: number;
  isLast: boolean;
  isUnlocked: boolean;
  currentUserRole: Role;
  users: UserType[];
  onComplete: () => void;
}) {
  const Icon = def.icon;
  const status = notice[def.statusKey] as StageStatus;
  const inspectorId = notice[def.inspectorKey] as string | null | undefined;
  const inspectionDate = notice[def.dateKey] as string | null | undefined;
  const inspector = users.find(u => u.id === inspectorId);

  const isPassed = status === 'PASSED';
  const isFailed = status === 'FAILED';
  const canAct =
    isUnlocked &&
    status === 'PENDING' &&
    (currentUserRole === def.authorisedRole || currentUserRole === 'SUPER_ADMIN');

  return (
    <div className="relative flex gap-5">
      {!isLast && (
        <div className="absolute left-5 top-12 w-0.5 h-[calc(100%-1rem)] bg-border z-0" />
      )}

      {/* Step circle */}
      <div className={cn(
        'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all',
        isPassed ? 'bg-emerald-500 border-emerald-500 text-white' :
        isFailed ? 'bg-red-500 border-red-500 text-white' :
        isUnlocked ? 'bg-primary border-primary text-white' :
        'bg-muted border-border text-muted-foreground'
      )}>
        {isPassed ? <CheckCircle2 className="h-5 w-5" /> :
         isFailed ? <XCircle className="h-5 w-5" /> :
         !isUnlocked ? <Lock className="h-4 w-4" /> :
         step}
      </div>

      {/* Card body */}
      <div className={cn(
        'flex-1 rounded-xl border p-5 mb-6 transition-all',
        isPassed ? 'border-emerald-200 bg-emerald-50/60' :
        isFailed ? 'border-red-200 bg-red-50/60' :
        isUnlocked ? 'border-primary/30 bg-primary/5 shadow-sm' :
        'border-border bg-card opacity-60'
      )}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon className={cn(
              'h-5 w-5',
              isPassed ? 'text-emerald-600' : isFailed ? 'text-red-500' :
              isUnlocked ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div>
              <p className="font-semibold text-sm">{def.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{def.unit}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isUnlocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Inspector info */}
        {inspector && inspectionDate && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {inspector.firstName} {inspector.lastName}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(inspectionDate).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          </div>
        )}

        {/* Locked hint */}
        {!isUnlocked && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Unlocked after previous stage passes
          </p>
        )}

        {/* Action panel */}
        {canAct && (
          <StageActionPanel
            exitNoticeId={notice.id}
            stage={def.stage}
            onComplete={onComplete}
          />
        )}

        {/* Waiting for other role hint */}
        {isUnlocked && status === 'PENDING' && !canAct && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Waiting for <strong>{def.roleLabel}</strong> to complete this stage
          </div>
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

  const isHousingUnlocked = true;
  const isElecUnlocked = notice.housingInspectionStatus === 'PASSED';
  const isEstateUnlocked =
    notice.housingInspectionStatus === 'PASSED' &&
    notice.electricalInspectionStatus === 'PASSED';

  const unlocked = [isHousingUnlocked, isElecUnlocked, isEstateUnlocked];

  return (
    <div className="space-y-6">
      {/* Clearance banner */}
      {notice.isCleared && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-800">Property Fully Cleared</h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              All inspections passed. The property has been vacated and the clearance certificate issued.
            </p>
          </div>
          <a
            href={`/management/exit/${notice.id}/certificate`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shrink-0"
          >
            View Certificate <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Progress bar */}
      {!notice.isCleared && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Clearance Progress</span>
            <span className="text-sm font-bold text-primary">
              {[notice.housingInspectionStatus, notice.electricalInspectionStatus, notice.estateInspectionStatus]
                .filter(s => s === 'PASSED').length} / 3 Passed
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{
                width: `${([notice.housingInspectionStatus, notice.electricalInspectionStatus, notice.estateInspectionStatus]
                  .filter(s => s === 'PASSED').length / 3) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Stages */}
      <div>
        {STAGE_DEFINITIONS.map((def, i) => (
          <StageCard
            key={def.stage}
            def={def}
            notice={notice}
            step={i + 1}
            isLast={i === STAGE_DEFINITIONS.length - 1}
            isUnlocked={unlocked[i]}
            currentUserRole={currentUserRole}
            users={users}
            onComplete={handleComplete}
          />
        ))}
      </div>
    </div>
  );
}
