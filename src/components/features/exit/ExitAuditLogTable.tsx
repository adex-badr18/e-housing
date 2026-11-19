'use client';

// =============================================================================
// ExitAuditLogTable — Full audit trail for a specific exit notice
// =============================================================================
// Table layout with row-click modal for full metadata details.
// Accessible to: ESTATE_OFFICER | DVC_ADMIN | SUPER_ADMIN
// =============================================================================

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  FileX2,
  RefreshCw,
  UserCheck,
  ClipboardList,
  AlertTriangle,
  Shield,
  Building2,
  Zap,
  Home,
  Info,
  Eye,
} from 'lucide-react';
import type { AuditLog, User } from '@/lib/mock-api/db';
import { AuditLogDetailModal } from '@/components/features/audit/AuditLogDetailModal';

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
    label: 'Housing Payment Clearance',
    icon: Home,
    iconColour: 'text-violet-600',
    badgeCls: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  EXIT_ELECTRICAL_CLEARANCE_UPDATED: {
    label: 'Electrical Fittings Clearance',
    icon: Zap,
    iconColour: 'text-amber-600',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  EXIT_ESTATE_INSPECTION_UPDATED: {
    label: 'Pre-Vacation Site Inspection',
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
    label: 'Notice Administratively Closed',
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
// Main Component
// ---------------------------------------------------------------------------

interface ExitAuditLogTableProps {
  logs: AuditLog[];
  /** Optional array or map of users for actor resolution */
  users?: User[];
  usersById?: Record<string, string>;
  className?: string;
}

export function ExitAuditLogTable({
  logs,
  users = [],
  usersById = {},
  className,
}: ExitAuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const userMap = useMemo(() => {
    const m: Record<string, User> = {};
    users.forEach(u => {
      m[u.id] = u;
    });
    return m;
  }, [users]);

  function getActorName(actorId: string): string {
    if (userMap[actorId]) {
      return `${userMap[actorId].firstName} ${userMap[actorId].lastName}`;
    }
    if (usersById[actorId]) {
      return usersById[actorId];
    }
    return actorId;
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  if (logs.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border bg-card p-12 flex flex-col items-center gap-3 text-center',
          className
        )}
      >
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
    <div className={cn('rounded-xl border bg-card overflow-hidden shadow-sm', className)}>
      {/* Header bar */}
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-oau-navy">Exit Event Audit Trail</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click on any record to inspect the complete payload and metadata.
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-background">
          {logs.length} event{logs.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-44 text-xs font-semibold uppercase tracking-wider">
              Timestamp
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              Action / Event
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              Actor
            </TableHead>
            <TableHead className="w-32 text-xs font-semibold uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="w-16 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Details
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => {
            const config = ACTION_CONFIGS[log.action] ?? FALLBACK_CONFIG;
            const Icon = config.icon;
            const isSuccess = log.status === 'SUCCESS';
            const actorName = getActorName(log.actorId);
            const actorUser = userMap[log.actorId];
            const meta = (log.metadata ?? {}) as Record<string, unknown>;
            const resultChip = meta.result as string | undefined;

            return (
              <TableRow
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={cn(
                  'cursor-pointer hover:bg-muted/40 transition group',
                  !isSuccess && 'bg-red-50/40 hover:bg-red-50/70'
                )}
              >
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border',
                        isSuccess ? 'bg-muted/50 border-border' : 'bg-red-100 border-red-200'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-3.5 w-3.5',
                          isSuccess ? config.iconColour : 'text-red-600'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {config.label}
                      </p>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {log.action}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm text-foreground">{actorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {actorUser?.role?.replace(/_/g, ' ') ?? log.actorId}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={cn(
                        'text-xs font-semibold border gap-1',
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      )}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {log.status}
                    </Badge>
                    {resultChip && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5',
                          resultChip === 'PASSED'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-red-700 bg-red-50 border-red-200'
                        )}
                      >
                        {resultChip}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Audit Log Modal */}
      <AuditLogDetailModal
        log={selectedLog}
        actorUser={selectedLog ? userMap[selectedLog.actorId] : null}
        open={!!selectedLog}
        onOpenChange={open => {
          if (!open) setSelectedLog(null);
        }}
      />
    </div>
  );
}
