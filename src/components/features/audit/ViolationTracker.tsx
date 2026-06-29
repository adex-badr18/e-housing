'use client';

// =============================================================================
// ViolationTracker — Filtered panel of FAILURE audit log entries
// =============================================================================
// Groups by entity type, shows a count badge, and lists a timeline of
// recent failures with actor, action, and error metadata.
// =============================================================================

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle, XCircle, ChevronDown, ChevronUp, User, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuditLog, User as UserType } from '@/lib/mock-api/db';

interface ViolationTrackerProps {
  logs: AuditLog[];
  users: UserType[];
}

interface GroupedViolation {
  entityType: string;
  count: number;
  entries: AuditLog[];
}

export function ViolationTracker({ logs, users }: ViolationTrackerProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const userMap = useMemo(() => {
    const m: Record<string, UserType> = {};
    users.forEach(u => { m[u.id] = u; });
    return m;
  }, [users]);

  const failures = useMemo(
    () => logs.filter(l => l.status === 'FAILURE').sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [logs]
  );

  const grouped: GroupedViolation[] = useMemo(() => {
    const map: Record<string, AuditLog[]> = {};
    failures.forEach(f => {
      if (!map[f.entityType]) map[f.entityType] = [];
      map[f.entityType].push(f);
    });
    return Object.entries(map)
      .map(([entityType, entries]) => ({ entityType, count: entries.length, entries }))
      .sort((a, b) => b.count - a.count);
  }, [failures]);

  if (failures.length === 0) {
    return (
      <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-8 text-center flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-emerald-800">No Violations Detected</p>
        <p className="text-sm text-emerald-600">All system actions have completed successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
        <div>
          <p className="font-semibold text-red-800 text-sm">
            {failures.length} Failed Action{failures.length !== 1 ? 's' : ''} Detected
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            Grouped across {grouped.length} entity type{grouped.length !== 1 ? 's' : ''}.
            Review and remediate below.
          </p>
        </div>
        <Badge className="ml-auto bg-red-600 text-white text-sm font-bold px-3">{failures.length}</Badge>
      </div>

      {/* Grouped entity sections */}
      {grouped.map(group => {
        const isExpanded = expandedGroup === group.entityType;
        return (
          <div key={group.entityType} className="rounded-xl border overflow-hidden">
            <button
              onClick={() => setExpandedGroup(isExpanded ? null : group.entityType)}
              className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition text-left"
            >
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-semibold text-sm">{group.entityType}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.count} failure{group.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs font-bold">
                  {group.count}
                </Badge>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </button>

            {isExpanded && (
              <div className="border-t divide-y">
                {group.entries.map(log => {
                  const actor = userMap[log.actorId];
                  return (
                    <div key={log.id} className="p-4 bg-red-50/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">
                              {log.action}
                            </code>
                            <span className="text-xs text-muted-foreground font-mono">{log.entityId}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {actor ? `${actor.firstName} ${actor.lastName}` : log.actorId}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(log.createdAt).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {/* Error metadata */}
                          {log.metadata && typeof log.metadata.error !== 'undefined' && (
                            <div className={cn(
                              'mt-2 rounded-lg bg-red-100 border border-red-200 px-3 py-2 text-xs text-red-700 font-mono'
                            )}>
                              {String(log.metadata.error)}
                            </div>
                          )}
                        </div>
                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
