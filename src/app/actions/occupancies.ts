'use server';

// =============================================================================
// Server Actions — Housing Occupancies
// =============================================================================

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  getPaginatedOccupancies,
  getOccupancyDetails,
  getOccupancyStats,
  revokeOccupancy,
  triggerOccupantExit,
  updateOccupancy,
  type GetPaginatedOccupanciesParams,
} from '@/lib/mock-api/endpoints/occupancies';
import {
  revokeOccupancySchema,
  triggerOccupantExitSchema,
  updateOccupancySchema,
} from '@/lib/validations/housing';
import { writeAuditEntry } from '@/lib/mock-api/endpoints/audit';
import type { Role } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Role guards
// ---------------------------------------------------------------------------

const MANAGEMENT_ROLES: Role[] = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'];
const REVOKE_ROLES: Role[] = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER'];
const EXIT_TRIGGER_ROLES: Role[] = ['SUPER_ADMIN', 'ESTATE_OFFICER'];
const UPDATE_ROLES: Role[] = ['SUPER_ADMIN', 'ESTATE_OFFICER'];

// ---------------------------------------------------------------------------
// Query: Paginated list
// ---------------------------------------------------------------------------

export async function getPaginatedOccupanciesAction(params: GetPaginatedOccupanciesParams) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (!MANAGEMENT_ROLES.includes(session.user.role as Role)) {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const result = await getPaginatedOccupancies(params);
    return { success: true as const, data: result };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch occupancies' };
  }
}

// ---------------------------------------------------------------------------
// Query: Summary stats
// ---------------------------------------------------------------------------

export async function getOccupancyStatsAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (!MANAGEMENT_ROLES.includes(session.user.role as Role)) {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const stats = await getOccupancyStats();
    return { success: true as const, data: stats };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch stats' };
  }
}

// ---------------------------------------------------------------------------
// Query: Occupancy details by ID
// ---------------------------------------------------------------------------

export async function getOccupancyDetailsAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (!MANAGEMENT_ROLES.includes(session.user.role as Role)) {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const details = await getOccupancyDetails(id);
    if (!details) return { success: false as const, error: 'Occupancy not found' };
    return { success: true as const, data: details };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch occupancy' };
  }
}

// ---------------------------------------------------------------------------
// Mutation: Revoke Occupancy
// ---------------------------------------------------------------------------

export async function revokeOccupancyAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (!REVOKE_ROLES.includes(session.user.role as Role)) {
    return { success: false as const, error: 'Only Super Admin, Housing Secretary, or Estate Officer can revoke occupancies' };
  }

  const parsed = revokeOccupancySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const occupancy = await revokeOccupancy(parsed.data);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'OCCUPANCY_REVOKED',
      entityType: 'Occupancy',
      entityId: parsed.data.occupancyId,
      status: 'SUCCESS',
      metadata: { reason: parsed.data.reason, userId: occupancy.userId },
    });
    revalidatePath('/management/occupancies');
    revalidatePath(`/management/occupancies/${parsed.data.occupancyId}`);
    return { success: true as const, data: occupancy };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'OCCUPANCY_REVOKED',
      entityType: 'Occupancy',
      entityId: parsed.data.occupancyId,
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to revoke occupancy' };
  }
}

// ---------------------------------------------------------------------------
// Mutation: Trigger Occupant Exit (Estate Officer / Super Admin)
// ---------------------------------------------------------------------------

export async function triggerOccupantExitAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (!EXIT_TRIGGER_ROLES.includes(session.user.role as Role)) {
    return { success: false as const, error: 'Only Estate Officer or Super Admin can trigger an occupant exit' };
  }

  const parsed = triggerOccupantExitSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const notice = await triggerOccupantExit(parsed.data);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'OCCUPANT_EXIT_TRIGGERED',
      entityType: 'ExitNotice',
      entityId: notice.id,
      status: 'SUCCESS',
      metadata: { occupancyId: parsed.data.occupancyId, reason: parsed.data.reason },
    });
    revalidatePath('/management/occupancies');
    revalidatePath(`/management/occupancies/${parsed.data.occupancyId}`);
    revalidatePath('/management/exit');
    return { success: true as const, data: notice };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'OCCUPANT_EXIT_TRIGGERED',
      entityType: 'ExitNotice',
      entityId: 'unknown',
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to trigger exit' };
  }
}

// ---------------------------------------------------------------------------
// Mutation: Update Occupancy Information
// ---------------------------------------------------------------------------

export async function updateOccupancyAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (!UPDATE_ROLES.includes(session.user.role as Role)) {
    return { success: false as const, error: 'Only Super Admin or Estate Officer can update occupancy information' };
  }

  const parsed = updateOccupancySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const occupancy = await updateOccupancy(parsed.data);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'OCCUPANCY_UPDATED',
      entityType: 'Occupancy',
      entityId: parsed.data.occupancyId,
      status: 'SUCCESS',
      metadata: { changes: parsed.data },
    });
    revalidatePath('/management/occupancies');
    revalidatePath(`/management/occupancies/${parsed.data.occupancyId}`);
    return { success: true as const, data: occupancy };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to update occupancy' };
  }
}
