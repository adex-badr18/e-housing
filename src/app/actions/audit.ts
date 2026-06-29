'use server';

// =============================================================================
// Server Actions — Audit Logs & Incident Tickets
// =============================================================================

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  getAllAuditLogs,
  getAllIncidentTickets,
  updateIncidentTicketStatus,
  createIncidentTicket,
} from '@/lib/mock-api/endpoints/audit';
import { writeAuditEntry } from '@/lib/mock-api/endpoints/audit';
import {
  incidentStatusUpdateSchema,
  incidentTicketSchema,
} from '@/lib/validations/housing';

// ---------------------------------------------------------------------------
// Super Admin: Fetch all audit logs
// ---------------------------------------------------------------------------

export async function getAuditLogsAction() {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only Super Admins can access audit logs' };
  }

  try {
    const logs = await getAllAuditLogs();
    return { success: true, data: logs };
  } catch {
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}

// ---------------------------------------------------------------------------
// Super Admin: Fetch all incident tickets
// ---------------------------------------------------------------------------

export async function getIncidentTicketsAction() {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only Super Admins can view all tickets' };
  }

  try {
    const tickets = await getAllIncidentTickets();
    return { success: true, data: tickets };
  } catch {
    return { success: false, error: 'Failed to fetch incident tickets' };
  }
}

// ---------------------------------------------------------------------------
// Super Admin: Update incident ticket status
// ---------------------------------------------------------------------------

export async function updateIncidentStatusAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only Super Admins can update ticket status' };
  }

  const parsed = incidentStatusUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const ticket = await updateIncidentTicketStatus(parsed.data.ticketId, parsed.data.status);

    await writeAuditEntry({
      actorId: session.user.id,
      action: 'INCIDENT_STATUS_UPDATED',
      entityType: 'IncidentTicket',
      entityId: parsed.data.ticketId,
      status: 'SUCCESS',
      metadata: { newStatus: parsed.data.status },
    });

    revalidatePath('/admin/helpdesk');
    return { success: true, data: ticket };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update status' };
  }
}

// ---------------------------------------------------------------------------
// Staff: Submit a new incident / complaint ticket
// ---------------------------------------------------------------------------

export async function submitIncidentTicketAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff members can submit complaint tickets' };
  }

  const parsed = incidentTicketSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const ticket = await createIncidentTicket({
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    });

    await writeAuditEntry({
      actorId: session.user.id,
      action: 'INCIDENT_TICKET_SUBMITTED',
      entityType: 'IncidentTicket',
      entityId: ticket.id,
      status: 'SUCCESS',
      metadata: { title: parsed.data.title },
    });

    revalidatePath('/admin/helpdesk');
    return { success: true, data: ticket };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit ticket' };
  }
}
