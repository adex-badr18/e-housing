'use client';

// =============================================================================
// ExitStatusTracker — Read-only pipeline view for staff
// =============================================================================
// Shown after a staff member has submitted an exit notice.
// Displays the 3-stage inspection pipeline with live status badges.
// =============================================================================

import { cn } from '@/lib/utils';
import {
  Home, Zap, Building2, CheckCircle2, XCircle, Clock,
  Shield, Calendar, User, AlertTriangle, FileX2,
} from 'lucide-react';
import type { ExitNotice } from '@/lib/mock-api/db';
import { QuitRequestButton } from './../application-review/QuitRequestButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StageStatus = 'PENDING' | 'PASSED' | 'FAILED';

interface StageConfig {
  key: 'housing' | 'electrical' | 'estate';
  label: string;
  unit: string;
  icon: React.ElementType;
  status: StageStatus;
  inspectedById: string | null | undefined;
  inspectionDate: string | null | undefined;
  inspectorLabel: string;
}

// ---------------------------------------------------------------------------
// StatusBadge sub-component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StageStatus }) {
  const config = {
    PENDING: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    PASSED: {
      icon: CheckCircle2,
      label: 'Passed',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    FAILED: {
      icon: XCircle,
      label: 'Failed',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
        config.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StageCard sub-component
// ---------------------------------------------------------------------------

function StageCard({
  step,
  stage,
  isLast,
}: {
  step: number;
  stage: StageConfig;
  isLast: boolean;
}) {
  const Icon = stage.icon;
  const isPassed = stage.status === 'PASSED';
  const isFailed = stage.status === 'FAILED';

  return (
    <div className="relative flex gap-5">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-5 top-12 w-0.5 h-[calc(100%-1.5rem)] bg-border" />
      )}

      {/* Step circle */}
      <div
        className={cn(
          'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm',
          isPassed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : isFailed
            ? 'bg-red-500 border-red-500 text-white'
            : 'bg-background border-border text-muted-foreground'
        )}
      >
        {isPassed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : isFailed ? (
          <XCircle className="h-5 w-5" />
        ) : (
          step
        )}
      </div>

      {/* Card */}
      <div
        className={cn(
          'flex-1 rounded-xl border p-4 mb-6 transition-all',
          isPassed
            ? 'border-emerald-200 bg-emerald-50/50'
            : isFailed
            ? 'border-red-200 bg-red-50/50'
            : 'border-border bg-card'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                'h-5 w-5',
                isPassed ? 'text-emerald-600' : isFailed ? 'text-red-500' : 'text-muted-foreground'
              )}
            />
            <div>
              <p className="font-semibold text-sm">{stage.label}</p>
              <p className="text-xs text-muted-foreground">{stage.unit}</p>
            </div>
          </div>
          <StatusBadge status={stage.status} />
        </div>

        {/* Inspector details */}
        {(isPassed || isFailed) && stage.inspectedById && (
          <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{stage.inspectorLabel}</span>
            </div>
            {stage.inspectionDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(stage.inspectionDate).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}</span>
              </div>
            )}
          </div>
        )}

        {/* Pending hint */}
        {stage.status === 'PENDING' && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Awaiting {stage.unit} inspection
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface ExitStatusTrackerProps {
  notice: ExitNotice;
  hasPendingQuitRequest?: boolean;
}

export function ExitStatusTracker({ notice, hasPendingQuitRequest }: ExitStatusTrackerProps) {
  const stages: StageConfig[] = [
    {
      key: 'housing',
      label: 'Housing Inspection',
      unit: 'Housing Unit / Housing Secretary',
      icon: Home,
      status: notice.housingInspectionStatus,
      inspectedById: notice.housingInspectedById,
      inspectionDate: notice.housingInspectionDate,
      inspectorLabel: 'Housing Secretary',
    },
    {
      key: 'electrical',
      label: 'Electrical Inspection',
      unit: 'Electrical / Power Division',
      icon: Zap,
      status: notice.electricalInspectionStatus,
      inspectedById: notice.electricalInspectedById,
      inspectionDate: notice.electricalInspectionDate,
      inspectorLabel: 'Electrical Officer',
    },
    {
      key: 'estate',
      label: 'Estate Inspection',
      unit: 'Estate Office',
      icon: Building2,
      status: notice.estateInspectionStatus,
      inspectedById: notice.estateInspectedById,
      inspectionDate: notice.estateInspectionDate,
      inspectorLabel: 'Estate Officer',
    },
  ];

  const stagesComplete = stages.filter(s => s.status === 'PASSED').length;
  const progressPct = Math.round((stagesComplete / 3) * 100);

  return (
    <div className="space-y-6">
      {/* Clearance banner */}
      {notice.isCleared ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-800">Full Clearance Granted</h3>
            <p className="text-sm text-emerald-700 mt-1">
              All three inspections have been passed. Your property has been vacated in the system.
              Your clearance certificate has been issued.
            </p>
            {notice.clearedAt && (
              <p className="text-xs text-emerald-600 mt-2">
                Cleared on {new Date(notice.clearedAt).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">Clearance Progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stagesComplete} of 3 stages complete
              </p>
            </div>
            <span className="text-2xl font-extrabold text-primary tabular-nums">{progressPct}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Exit Reason</p>
          <p className="font-semibold capitalize mt-0.5">{notice.reason.toLowerCase().replace('_', ' ')}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Submitted</p>
          <p className="font-semibold mt-0.5">
            {new Date(notice.submittedAt).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className={cn('font-semibold mt-0.5', notice.isCleared ? 'text-emerald-600' : notice.isWithdrawn ? 'text-slate-600' : 'text-amber-600')}>
            {notice.isCleared ? 'Cleared' : notice.isWithdrawn ? 'Withdrawn' : 'In Progress'}
          </p>
        </div>
      </div>

      {/* Withdrawal / Termination status */}
      {notice.isWithdrawn && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <FileX2 className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Notice Withdrawn / Terminated</h3>
            <p className="text-sm text-slate-700 mt-1">
              This exit notice is no longer active. It was either withdrawn by you or administratively terminated.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!notice.isCleared && !notice.isWithdrawn && (
        <div className="flex justify-end">
          <QuitRequestButton 
            entityId={notice.id} 
            entityType="ExitNotice" 
            hasPendingRequest={hasPendingQuitRequest} 
          />
        </div>
      )}

      {/* Pipeline stages */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Inspection Pipeline</h3>
        <div>
          {stages.map((stage, i) => (
            <StageCard
              key={stage.key}
              step={i + 1}
              stage={stage}
              isLast={i === stages.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Additional notes if any */}
      {notice.additionalNotes && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Your Notes</p>
          <p className="text-sm">{notice.additionalNotes}</p>
        </div>
      )}
    </div>
  );
}
