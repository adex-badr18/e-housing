// =============================================================================
// Mock API — Audit Log + Incident Ticket Endpoints
// =============================================================================

import { mockDB, AuditLog, IncidentTicket, IncidentStatus } from '../db';

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

export async function createIncidentTicket(params: {
  userId: string;
  title: string;
  description: string;
}): Promise<IncidentTicket> {
  await delay(500);
  const now = new Date().toISOString();
  const ticket: IncidentTicket = {
    id: mockDB.generateId('inc'),
    userId: params.userId,
    title: params.title,
    description: params.description,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  };
  mockDB.incidentTickets.push(ticket);
  return ticket;
}
