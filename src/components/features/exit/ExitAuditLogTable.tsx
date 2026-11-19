'use client';

// =============================================================================
// ExitAuditLogTable — Full audit trail for a specific exit notice
// =============================================================================
// Phase 4 — new component.
// Accessible to: ESTATE_OFFICER | DVC_ADMIN | SUPER_ADMIN
// Displays a chronological, newest-first log of all events on an exit notice.
// Each row shows: timestamp, actor, action label, status badge, and metadata.
// =============================================================================

import { cn } from '@/lib/utils';
import {
  CheckCircle2, XCircle, Clock, FileX2, RefreshCw,
  UserCheck, ClipboardList, AlertTriangle, Shield,
  Building2, Zap, Home, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { useState } from 'react';
import type { AuditLog } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Action display config
// ---------------------------------------------------------------------------

interface ActionConfig {
  label: string;
  icon: React.ElementType;
  iconColour: string;
  badgeCls: string;
}

const ACTION_CONFIGS: Record<string, ActionConfig> = {
  EXIT_NOTICE_INITIATED: {
    label: 'Exit Notice Initiated',
    icon: ClipboardList,
    iconColour: 'text-blue-600',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  EXIT_HOUSING_CLEARANCE_UPDATED: {
    label: 'Housing Payment Clearance Updated',
    icon: Home,
    iconColour: 'text-violet-600',
    badgeCls: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  EXIT_ELECTRICAL_CLEARANCE_UPDATED: {
    label: 'Electrical Fittings Clearance Updated',
    icon: Zap,
    iconColour: 'text-amber-600',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  EXIT_ESTATE_INSPECTION_UPDATED: {
    label: 'Pre-Vacation Site Inspection Updated',
    icon: Building2,
    iconColour: 'text-teal-600',
    badgeCls: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  EXIT_CLEARANCE_FINALIZED: {
    label: 'Clearance Certificate Issued',
    icon: Shield,
    iconColour: 'text-emerald-600',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  EXIT_GRACE_PERIOD_EXTENDED: {
    label: 'Grace Period Extended',
    icon: RefreshCw,
    iconColour: 'text-indigo-600',
    badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  EXIT_NOTICE_ADMIN_TERMINATED: {
    label: 'Exit Notice Administratively Closed',
    icon: FileX2,
    iconColour: 'text-slate-600',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  EXIT_NOTICE_SUBMITTED: {
    label: 'Exit Notice Submitted (Legacy)',
    icon: ClipboardList,
    iconColour: 'text-gray-500',
    badgeCls: 'bg-gray-50 text-gray-600 border-gray-200',
  },
  EXIT_NOTICE_TERMINATED: {
    label: 'Exit Notice Terminated (Legacy)',
    icon: FileX2,
    iconColour: 'text-slate-500',
    badgeCls: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  EXIT_INSPECTION_UPDATED: {
    label: 'Inspection Updated (Legacy)',
    icon: UserCheck,
    iconColour: 'text-gray-500',
    badgeCls: 'bg-gray-50 text-gray-600 border-gray-200',
  },
};

const FALLBACK_CONFIG: ActionConfig = {
  label: 'System Event',
  icon: Info,
  iconColour: 'text-gray-400',
  badgeCls: 'bg-gray-50 text-gray-600 border-gray-200',
};

// ---------------------------------------------------------------------------
// Metadata renderer — shows key/value pairs from log.metadata
// ---------------------------------------------------------------------------

function MetadataPanel({ metadata }: { metadata: Record<string, unknown> | null | undefined }) {
  const [open, setOpen] = useState(false);
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );
  if (entries.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={open}
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? 'Hide details' : 'Show details'}
      </button>

      {open && (
        <div className="mt-2 rounded-lg bg-muted/60 border px-3 py-2 space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="font-mono text-muted-foreground shrink-0 min-w-[130px]">{key}</span>
              <span className="text-foreground break-all">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusResultBadge — shows PASSED/FAILED inline when present in metadata
// ---------------------------------------------------------------------------

function ResultChip({ result }: { result?: string }) {
  if (!result) return null;
  if (result === 'PASSED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> PASSED
      </span>
    );
  }
  if (result === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <XCircle className="h-3 w-3" /> FAILED
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// AuditLogRow
// ---------------------------------------------------------------------------

interface AuditLogRowProps {
  log: AuditLog;
  actorName?: string;
  isLast: boolean;
}

function AuditLogRow({ log, actorName, isLast }: AuditLogRowProps) {
  const config = ACTION_CONFIGS[log.action] ?? FALLBACK_CONFIG;
  const Icon = config.icon;

  const meta = log.metadata as Record<string, unknown> | null | undefined;
  const result = meta?.result as string | undefined;
  const isSuccess = log.status === 'SUCCESS';

  const formattedTime = new Date(log.createdAt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="relative flex gap-4">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 w-0.5 h-[calc(100%-1rem)] bg-border z-0" />
      )}

      {/* Icon circle */}
      <div className={cn(
        'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background',
        isSuccess ? 'border-border' : 'border-red-300 bg-red-50'
      )}>
        <Icon className={cn('h-4 w-4', isSuccess ? config.iconColour : 'text-red-500')} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        {/* Top row */}
        <div className="flex items-start flex-wrap gap-2 mb-1">
          <span className={cn(
            'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border',
            isSuccess ? config.badgeCls : 'bg-red-50 text-red-700 border-red-200'
          )}>
            {config.label}
          </span>
          {!isSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle className="h-3 w-3" /> Failed
            </span>
          )}
          <ResultChip result={result} />
        </div>

        {/* Actor + timestamp */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formattedTime}
          </div>
          {actorName && (
            <div className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {actorName}
            </div>
          )}
        </div>

        {/* Metadata */}
        <MetadataPanel metadata={meta} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

interface ExitAuditLogTableProps {
  logs: AuditLog[];
  /** Optional map of userId → display name for actor resolution */
  usersById?: Record<string, string>;
  className?: string;
}

export function ExitAuditLogTable({
  logs,
  usersById = {},
  className,
}: ExitAuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card p-8 flex flex-col items-center gap-3 text-center', className)}>
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <ClipboardList className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-semibold text-muted-foreground">No audit events yet</p>
        <p className="text-sm text-muted-foreground">
          Audit events will appear here as actions are taken on this exit notice.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-base">Audit Trail</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{logs.length} event{logs.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </div>

      {/* Log entries */}
      <div>
        {logs.map((log, i) => (
          <AuditLogRow
            key={log.id}
            log={log}
            actorName={usersById[log.actorId]}
            isLast={i === logs.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
