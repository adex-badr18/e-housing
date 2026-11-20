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
  getPaginatedMyIncidentTickets,
  getPaginatedIncidentTickets,
  type PaginatedMyIncidentTicketsResult,
} from '@/lib/mock-api/endpoints/audit';
import { mockDB } from '@/lib/mock-api/db';
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
  const MANAGEMENT_ROLES = ['SUPER_ADMIN', 'ESTATE_OFFICER', 'HOUSING_SECRETARY', 'DVC_ADMIN'];
  if (!MANAGEMENT_ROLES.includes(session.user.role)) {
    return { success: false, error: 'Only management users can update ticket status' };
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
    revalidatePath('/management/helpdesk');
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
    // Auto-capture housing context from staff's current occupancy
    let housingUnitId: string | null = null;
    let unitName: string | null = null;
    let roadNumber: string | null = null;
    let housingTypeName: string | null = null;

    const occupancy = mockDB.findActiveOccupancyByUserId(session.user.id);
    if (occupancy) {
      const unit = mockDB.housingUnits.find(u => u.id === occupancy.housingUnitId);
      if (unit) {
        housingUnitId = unit.id;
        unitName = unit.name ?? null;
        roadNumber = unit.roadNumber ?? null;
        const htype = mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId);
        housingTypeName = htype?.name ?? null;
      }
    }

    const ticket = await createIncidentTicket({
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      housingUnitId,
      housingTypeName,
      unitName,
      roadNumber,
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
    revalidatePath('/staff/complaints');
    return { success: true, data: ticket };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit ticket' };
  }
}


// ---------------------------------------------------------------------------
// Staff: Get paginated list of own complaint tickets
// ---------------------------------------------------------------------------

export async function getMyIncidentTicketsAction(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false as const, error: 'Only staff members can view their own tickets' };
  }

  try {
    const result = await getPaginatedMyIncidentTickets({
      userId: session.user.id,
      ...params,
    });
    return { success: true as const, data: result };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch tickets' };
  }
}

// ---------------------------------------------------------------------------
// Management: Fetch paginated incident tickets (SUPER_ADMIN + management roles)
// ---------------------------------------------------------------------------

export async function getPaginatedIncidentTicketsAction(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  const ALLOWED_ROLES = ['SUPER_ADMIN', 'ESTATE_OFFICER', 'HOUSING_SECRETARY', 'DVC_ADMIN'];
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return { success: false as const, error: 'Unauthorized' };
  }

  try {
    const result = await getPaginatedIncidentTickets(params);
    return { success: true as const, data: result };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch tickets' };
  }
}
