'use client';

// =============================================================================
// HelpdeskPanel — Re-exports HelpdeskTicketsTableClient
// =============================================================================

import {
  HelpdeskTicketsTableClient,
  type HelpdeskTicketsTableClientProps,
} from './HelpdeskTicketsTableClient';
import type { IncidentTicket, User as UserType } from '@/lib/mock-api/db';

export interface HelpdeskPanelProps {
  tickets: IncidentTicket[];
  users: UserType[];
}

export function HelpdeskPanel({ tickets, users }: HelpdeskPanelProps) {
  const userMap = new Map(users.map(u => [u.id, u]));

  const enrichedTickets = tickets.map(ticket => ({
    ticket,
    user: userMap.get(ticket.userId) ?? null,
    profile: null,
  }));

  const initialData = {
    tickets: enrichedTickets,
    total: tickets.length,
    page: 1,
    limit: 10,
    totalPages: Math.max(1, Math.ceil(tickets.length / 10)),
    openCount: tickets.filter(t => t.status === 'OPEN').length,
    inProgressCount: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolvedCount: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  return (
    <HelpdeskTicketsTableClient
      initialData={initialData}
      initialSearch=""
      initialStatus="ALL"
      initialPage={1}
      initialLimit={10}
    />
  );
}

export { HelpdeskTicketsTableClient };
