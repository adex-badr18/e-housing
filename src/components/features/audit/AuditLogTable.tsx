'use client';

// =============================================================================
// AuditLogTable — Paginated read-only audit log viewer
// =============================================================================
// Features: column display, client-side pagination, search/filter by action
// and actor, expandable row for full metadata JSON, status badges.
// =============================================================================

import { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Search, ChevronDown, ChevronUp, SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuditLog, User } from '@/lib/mock-api/db';

const PAGE_SIZE = 10;

interface AuditLogTableProps {
  logs: AuditLog[];
  users: User[];
}

function StatusCell({ status }: { status: 'SUCCESS' | 'FAILURE' }) {
  return status === 'SUCCESS' ? (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border gap-1 text-xs">
      <CheckCircle2 className="h-3 w-3" /> Success
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-200 border gap-1 text-xs">
      <XCircle className="h-3 w-3" /> Failure
    </Badge>
  );
}

export function AuditLogTable({ logs, users }: AuditLogTableProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'SUCCESS' | 'FAILURE'>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const userMap = useMemo(() => {
    const m: Record<string, User> = {};
    users.forEach(u => { m[u.id] = u; });
    return m;
  }, [users]);

  const uniqueActors = useMemo(() => [...new Set(logs.map(l => l.actorId))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entityType.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId.toLowerCase().includes(search.toLowerCase());
      const matchActor = !actorFilter || l.actorId === actorFilter;
      const matchStatus = !statusFilter || l.status === statusFilter;
      return matchSearch && matchActor && matchStatus;
    });
  }, [logs, search, actorFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(0);
  }

  function handleActorChange(v: string) {
    setActorFilter(v);
    setPage(0);
  }

  function handleStatusChange(v: string) {
    setStatusFilter(v as '' | 'SUCCESS' | 'FAILURE');
    setPage(0);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search action, entity…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={actorFilter}
            onChange={e => handleActorChange(e.target.value)}
            className="h-9 text-sm border border-border rounded-lg px-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Actors</option>
            {uniqueActors.map(id => {
              const u = userMap[id];
              return (
                <option key={id} value={id}>
                  {u ? `${u.firstName} ${u.lastName}` : id}
                </option>
              );
            })}
          </select>

          <select
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value)}
            className="h-9 text-sm border border-border rounded-lg px-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
        </div>

        <p className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {logs.length} entries
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-40 text-xs font-semibold">Timestamp</TableHead>
              <TableHead className="text-xs font-semibold">Actor</TableHead>
              <TableHead className="text-xs font-semibold">Action</TableHead>
              <TableHead className="text-xs font-semibold">Entity</TableHead>
              <TableHead className="w-28 text-xs font-semibold">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  No audit log entries match your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(log => {
                const actor = userMap[log.actorId];
                const isExpanded = expandedId === log.id;
                return (
                  <>
                    <TableRow
                      key={log.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/30 transition',
                        isExpanded && 'bg-muted/20',
                        log.status === 'FAILURE' && 'bg-red-50/50 hover:bg-red-50'
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <p className="font-medium">
                            {actor ? `${actor.firstName} ${actor.lastName}` : log.actorId}
                          </p>
                          {actor && (
                            <p className="text-muted-foreground text-xs">{actor.role.replace('_', ' ')}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{log.action}</code>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <p className="font-medium">{log.entityType}</p>
                          <p className="text-muted-foreground font-mono">{log.entityId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusCell status={log.status} />
                      </TableCell>
                      <TableCell>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </TableCell>
                    </TableRow>

                    {/* Expanded metadata */}
                    {isExpanded && (
                      <TableRow key={`${log.id}-expanded`} className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={6} className="py-3 px-6">
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                              Metadata
                            </p>
                            {log.metadata ? (
                              <pre className="text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No metadata recorded</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded-lg border text-xs font-medium transition',
                    pageNum === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
