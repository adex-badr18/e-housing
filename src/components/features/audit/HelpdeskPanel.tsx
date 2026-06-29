'use client';

// =============================================================================
// HelpdeskPanel — Kanban-style incident ticket management for Super Admin
// =============================================================================
// Three-column layout: OPEN | IN_PROGRESS | RESOLVED
// Each ticket card is clickable to expand full details.
// Super Admin can update ticket status via dropdown.
// =============================================================================

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertCircle, Clock, CheckCircle2, User,
  Calendar, ChevronDown, Loader2, MessageSquare, X,
} from 'lucide-react';
import { updateIncidentStatusAction } from '@/app/actions/audit';
import type { IncidentTicket, User as UserType } from '@/lib/mock-api/db';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface HelpdeskPanelProps {
  tickets: IncidentTicket[];
  users: UserType[];
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  OPEN: {
    label: 'Open',
    icon: AlertCircle,
    headerCls: 'bg-red-50 border-red-200 text-red-800',
    badgeCls: 'bg-red-100 text-red-700 border-red-200',
    cardBorder: 'border-red-100',
    iconCls: 'text-red-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    headerCls: 'bg-amber-50 border-amber-200 text-amber-800',
    badgeCls: 'bg-amber-100 text-amber-700 border-amber-200',
    cardBorder: 'border-amber-100',
    iconCls: 'text-amber-500',
  },
  RESOLVED: {
    label: 'Resolved',
    icon: CheckCircle2,
    headerCls: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cardBorder: 'border-emerald-100',
    iconCls: 'text-emerald-500',
  },
} as const;

// ---------------------------------------------------------------------------
// StatusSelect — inline dropdown for updating ticket status
// ---------------------------------------------------------------------------

function StatusSelect({
  ticketId,
  currentStatus,
  onUpdate,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
  onUpdate: (id: string, status: TicketStatus) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: TicketStatus) {
    startTransition(async () => {
      const res = await updateIncidentStatusAction({ ticketId, status: newStatus });
      if (res.success) {
        toast.success(`Ticket moved to ${STATUS_CONFIG[newStatus].label}`);
        onUpdate(ticketId, newStatus);
      } else {
        toast.error(res.error ?? 'Failed to update status');
      }
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentStatus}
        onChange={e => handleChange(e.target.value as TicketStatus)}
        disabled={isPending}
        onClick={e => e.stopPropagation()}
        className="appearance-none text-xs border border-border rounded-lg px-3 py-1.5 pr-7 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:opacity-50"
      >
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>
      <div className="absolute right-2 pointer-events-none">
        {isPending
          ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          : <ChevronDown className="h-3 w-3 text-muted-foreground" />
        }
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TicketCard
// ---------------------------------------------------------------------------

function TicketCard({
  ticket,
  user,
  onStatusUpdate,
}: {
  ticket: IncidentTicket;
  user: UserType | undefined;
  onStatusUpdate: (id: string, status: TicketStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[ticket.status as TicketStatus];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden',
        config.cardBorder
      )}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/20 transition"
      >
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.iconCls)} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight line-clamp-2">{ticket.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              {user ? `${user.firstName} ${user.lastName}` : ticket.userId}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short',
              }) : '—'}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description}</p>

          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex gap-2">
              <span className="font-medium w-20">Ticket ID:</span>
              <code className="font-mono">{ticket.id}</code>
            </div>
            <div className="flex gap-2">
              <span className="font-medium w-20">Last Updated:</span>
              <span>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : '—'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium w-20">Submitter:</span>
              <span>{user ? `${user.firstName} ${user.lastName} (${user.email})` : ticket.userId}</span>
            </div>
          </div>

          {/* Status control */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Move to:</span>
            <StatusSelect
              ticketId={ticket.id}
              currentStatus={ticket.status as TicketStatus}
              onUpdate={onStatusUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

export function HelpdeskPanel({ tickets: initialTickets, users }: HelpdeskPanelProps) {
  const [tickets, setTickets] = useState(initialTickets);

  const userMap: Record<string, UserType> = {};
  users.forEach(u => { userMap[u.id] = u; });

  function handleStatusUpdate(id: string, status: TicketStatus) {
    setTickets(prev =>
      prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {STATUSES.map(status => {
          const count = tickets.filter(t => t.status === status).length;
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div
              key={status}
              className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold', cfg.badgeCls)}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}: {count}
            </div>
          );
        })}
        <span className="text-xs text-muted-foreground ml-auto">{tickets.length} total tickets</span>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {STATUSES.map(status => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          const col = tickets.filter(t => t.status === status);

          return (
            <div key={status} className="flex flex-col gap-3">
              {/* Column header */}
              <div className={cn(
                'flex items-center justify-between px-4 py-2.5 rounded-xl border font-semibold text-sm',
                cfg.headerCls
              )}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </div>
                <span className="text-xs font-bold">{col.length}</span>
              </div>

              {/* Cards */}
              {col.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <MessageSquare className="h-6 w-6 opacity-30" />
                  No {cfg.label.toLowerCase()} tickets
                </div>
              ) : (
                col.map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    user={userMap[ticket.userId]}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
