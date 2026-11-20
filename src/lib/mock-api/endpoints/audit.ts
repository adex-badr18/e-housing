// =============================================================================
// Mock API — Audit Log + Incident Ticket Endpoints
// =============================================================================

import { mockDB, AuditLog, IncidentTicket, IncidentStatus, User, StaffProfile } from '../db';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  await delay(300);
  return [...mockDB.auditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<AuditLog[]> {
  await delay(200);
  return mockDB.auditLogs
    .filter(l => l.entityType === entityType && l.entityId === entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAuditLogsByActor(actorId: string): Promise<AuditLog[]> {
  await delay(200);
  return mockDB.auditLogs
    .filter(l => l.actorId === actorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function writeAuditEntry(
  entry: Omit<AuditLog, 'id' | 'createdAt'>
): Promise<AuditLog> {
  await delay(100);
  return mockDB.writeAuditLog(entry);
}

// ---------------------------------------------------------------------------
// Incident Tickets
// ---------------------------------------------------------------------------

export interface EnrichedIncidentTicketRow {
  ticket: IncidentTicket;
  user: User | null;
  profile: StaffProfile | null;
}

export interface PaginatedIncidentTicketsResult {
  tickets: EnrichedIncidentTicketRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
}

export async function getAllIncidentTickets(): Promise<IncidentTicket[]> {
  await delay(300);
  return [...mockDB.incidentTickets].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
}

export async function getIncidentTicketById(id: string): Promise<IncidentTicket | null> {
  await delay(200);
  return mockDB.incidentTickets.find(t => t.id === id) ?? null;
}

export async function getPaginatedIncidentTickets(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedIncidentTicketsResult> {
  await delay(200);

  let list = [...mockDB.incidentTickets].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  const openCount = mockDB.incidentTickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = mockDB.incidentTickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = mockDB.incidentTickets.filter(t => t.status === 'RESOLVED').length;

  // Filter by status
  if (params.status && params.status !== 'ALL') {
    list = list.filter(t => t.status === params.status);
  }

  // Enrich & Search
  const query = (params.search ?? '').trim().toLowerCase();
  const enriched: EnrichedIncidentTicketRow[] = list.map(ticket => {
    const user = mockDB.findUserById(ticket.userId) ?? null;
    const profile = user ? (mockDB.staffProfiles.find(p => p.userId === user.id) ?? null) : null;
    return { ticket, user, profile };
  });

  const filtered = query
    ? enriched.filter(({ ticket, user, profile }) => {
        const idMatch = ticket.id.toLowerCase().includes(query);
        const titleMatch = ticket.title.toLowerCase().includes(query);
        const descMatch = ticket.description.toLowerCase().includes(query);
        const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';
        const userEmail = user?.email?.toLowerCase() ?? '';
        const staffId = profile?.staffId?.toLowerCase() ?? '';
        const dept = profile?.department?.toLowerCase() ?? '';

        const unitName = (ticket.unitName ?? '').toLowerCase();
        const roadNumber = (ticket.roadNumber ?? '').toLowerCase();
        const housingType = (ticket.housingTypeName ?? '').toLowerCase();

        return (
          idMatch ||
          titleMatch ||
          descMatch ||
          userName.includes(query) ||
          userEmail.includes(query) ||
          staffId.includes(query) ||
          dept.includes(query) ||
          unitName.includes(query) ||
          roadNumber.includes(query) ||
          housingType.includes(query)
        );
      })
    : enriched;

  const total = filtered.length;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 10);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  const paginatedTickets = filtered.slice(offset, offset + limit);

  return {
    tickets: paginatedTickets,
    total,
    page,
    limit,
    totalPages,
    openCount,
    inProgressCount,
    resolvedCount,
  };
}

export async function updateIncidentTicketStatus(
  ticketId: string,
  status: IncidentStatus
): Promise<IncidentTicket> {
  await delay(400);
  const idx = mockDB.incidentTickets.findIndex(t => t.id === ticketId);
  if (idx === -1) throw new Error('Incident ticket not found');
  const now = new Date().toISOString();
  mockDB.incidentTickets[idx] = {
    ...mockDB.incidentTickets[idx],
    status,
    updatedAt: now,
  };
  return mockDB.incidentTickets[idx];
}

export interface PaginatedMyIncidentTicketsResult {
  tickets: IncidentTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  myOpenCount: number;
  myInProgressCount: number;
  myResolvedCount: number;
}

export async function getPaginatedMyIncidentTickets(params: {
  userId: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedMyIncidentTicketsResult> {
  await delay(200);

  let list = [...mockDB.incidentTickets]
    .filter(t => t.userId === params.userId)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  const myOpenCount = list.filter(t => t.status === 'OPEN').length;
  const myInProgressCount = list.filter(t => t.status === 'IN_PROGRESS').length;
  const myResolvedCount = list.filter(t => t.status === 'RESOLVED').length;

  // Filter by status
  if (params.status && params.status !== 'ALL') {
    list = list.filter(t => t.status === params.status);
  }

  // Search within title and description
  const query = (params.search ?? '').trim().toLowerCase();
  const filtered = query
    ? list.filter(t =>
        t.id.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.unitName ?? '').toLowerCase().includes(query) ||
        (t.housingTypeName ?? '').toLowerCase().includes(query)
      )
    : list;

  const total = filtered.length;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 10);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  const paginatedTickets = filtered.slice(offset, offset + limit);

  return {
    tickets: paginatedTickets,
    total,
    page,
    limit,
    totalPages,
    myOpenCount,
    myInProgressCount,
    myResolvedCount,
  };
}

export async function createIncidentTicket(params: {
  userId: string;
  title: string;
  description: string;
  housingUnitId?: string | null;
  housingTypeName?: string | null;
  unitName?: string | null;
  roadNumber?: string | null;
}): Promise<IncidentTicket> {
  await delay(500);
  const now = new Date().toISOString();
  const ticket: IncidentTicket = {
    id: mockDB.generateId('inc'),
    userId: params.userId,
    title: params.title,
    description: params.description,
    housingUnitId: params.housingUnitId ?? null,
    housingTypeName: params.housingTypeName ?? null,
    unitName: params.unitName ?? null,
    roadNumber: params.roadNumber ?? null,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  };
  mockDB.incidentTickets.push(ticket);
  return ticket;
}
