'use server';

// =============================================================================
// Server Actions — Housing Management
// Covers: housing types, housing units, BQ occupants, allocation & tenancy
// =============================================================================

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  createHousingType,
  updateHousingType,
  deleteHousingType,
  createHousingUnit,
  updateHousingUnitStatus,
  addBQOccupant,
  updateBQOccupant,
  removeBQOccupant,
  getBQsForCurrentOccupant,
} from '@/lib/mock-api/endpoints/housing';
import {
  housingTypeSchema,
  housingUnitSchema,
  bqOccupantSchema,
} from '@/lib/validations/housing';
import { writeAuditEntry } from '@/lib/mock-api/endpoints/audit';
import { mockDB } from '@/lib/mock-api/db';
import type { UnitStatus } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Role guard helper
// ---------------------------------------------------------------------------

const HOUSING_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER'] as const;

// ---------------------------------------------------------------------------
// Housing Types
// ---------------------------------------------------------------------------

export async function createHousingTypeAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (!HOUSING_MANAGEMENT_ROLES.includes(session.user.role as typeof HOUSING_MANAGEMENT_ROLES[number])) {
    return { success: false, error: 'Access denied: insufficient permissions' };
  }

  const parsed = housingTypeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const newType = await createHousingType({ ...parsed.data });
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'HOUSING_TYPE_CREATED',
      entityType: 'HousingType',
      entityId: newType.id,
      status: 'SUCCESS',
      metadata: { name: newType.name },
    });
    revalidatePath('/admin/housing');
    revalidatePath('/housing-types');
    return { success: true, data: newType };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'HOUSING_TYPE_CREATED',
      entityType: 'HousingType',
      entityId: 'unknown',
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return { success: false, error: 'Failed to create housing type' };
  }
}

export async function updateHousingTypeAction(id: string, data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (!HOUSING_MANAGEMENT_ROLES.includes(session.user.role as typeof HOUSING_MANAGEMENT_ROLES[number])) {
    return { success: false, error: 'Access denied: insufficient permissions' };
  }

  const parsed = housingTypeSchema.partial().safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const updated = await updateHousingType(id, parsed.data);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'HOUSING_TYPE_UPDATED',
      entityType: 'HousingType',
      entityId: id,
      status: 'SUCCESS',
      metadata: { changes: Object.keys(parsed.data) },
    });
    revalidatePath('/admin/housing');
    revalidatePath('/housing-types');
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update housing type' };
  }
}

export async function deleteHousingTypeAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only Super Admin can delete housing types' };
  }

  try {
    await deleteHousingType(id);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'HOUSING_TYPE_DELETED',
      entityType: 'HousingType',
      entityId: id,
      status: 'SUCCESS',
      metadata: null,
    });
    revalidatePath('/admin/housing');
    revalidatePath('/housing-types');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete housing type' };
  }
}

// ---------------------------------------------------------------------------
// Housing Units
// ---------------------------------------------------------------------------

export async function createHousingUnitAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (!HOUSING_MANAGEMENT_ROLES.includes(session.user.role as typeof HOUSING_MANAGEMENT_ROLES[number])) {
    return { success: false, error: 'Access denied: insufficient permissions' };
  }

  const parsed = housingUnitSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const unit = await createHousingUnit(parsed.data);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'HOUSING_UNIT_CREATED',
      entityType: 'HousingUnit',
      entityId: unit.id,
      status: 'SUCCESS',
      metadata: { name: unit.name, housingTypeId: unit.housingTypeId },
    });
    revalidatePath('/admin/housing-units');
    revalidatePath('/housing-units');
    return { success: true, data: unit };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create housing unit' };
  }
}

export async function updateHousingUnitStatusAction(id: string, status: UnitStatus) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (!HOUSING_MANAGEMENT_ROLES.includes(session.user.role as typeof HOUSING_MANAGEMENT_ROLES[number])) {
    return { success: false, error: 'Access denied: insufficient permissions' };
  }

  try {
    const updated = await updateHousingUnitStatus(id, status);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'HOUSING_UNIT_STATUS_UPDATED',
      entityType: 'HousingUnit',
      entityId: id,
      status: 'SUCCESS',
      metadata: { newStatus: status },
    });
    revalidatePath('/admin/housing-units');
    revalidatePath('/housing-units');
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update unit status' };
  }
}

// ---------------------------------------------------------------------------
// BQ Occupants — STAFF only (own unit)
// ---------------------------------------------------------------------------

export async function addBQOccupantAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff members can manage BQ occupants' };
  }

  const parsed = bqOccupantSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const { bqId, ...rest } = parsed.data;
    const occupant = await addBQOccupant(session.user.id, { bqId, ...rest });
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'BQ_OCCUPANT_ADDED',
      entityType: 'BQOccupant',
      entityId: occupant.id,
      status: 'SUCCESS',
      metadata: { bqId, fullName: rest.fullName },
    });
    revalidatePath('/staff/housing');
    revalidatePath('/staff/bq');
    return { success: true, data: occupant };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to add BQ occupant' };
  }
}

export async function updateBQOccupantAction(
  bqOccupantId: string,
  data: unknown
) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff members can manage BQ occupants' };
  }

  const partialSchema = bqOccupantSchema.pick({
    fullName: true,
    phoneNumber: true,
    email: true,
    relationship: true,
  }).partial();
  const parsed = partialSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const updated = await updateBQOccupant(session.user.id, bqOccupantId, parsed.data);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'BQ_OCCUPANT_UPDATED',
      entityType: 'BQOccupant',
      entityId: bqOccupantId,
      status: 'SUCCESS',
      metadata: { changes: Object.keys(parsed.data) },
    });
    revalidatePath('/staff/housing');
    revalidatePath('/staff/bq');
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update BQ occupant' };
  }
}

export async function removeBQOccupantAction(bqOccupantId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff members can manage BQ occupants' };
  }

  try {
    await removeBQOccupant(session.user.id, bqOccupantId);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'BQ_OCCUPANT_REMOVED',
      entityType: 'BQOccupant',
      entityId: bqOccupantId,
      status: 'SUCCESS',
      metadata: null,
    });
    revalidatePath('/staff/housing');
    revalidatePath('/staff/bq');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to remove BQ occupant' };
  }
}

// ---------------------------------------------------------------------------
// Staff: Get BQs for logged-in occupant (own unit)
// ---------------------------------------------------------------------------

export async function getMyBQsAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false as const, error: 'Only staff can access BQ management' };
  }

  try {
    const bqs = await getBQsForCurrentOccupant(session.user.id);
    return { success: true as const, data: bqs };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch BQs' };
  }
}

// ---------------------------------------------------------------------------
// Staff: Get pending allocation for the logged-in user
// ---------------------------------------------------------------------------

export async function getMyPendingAllocationAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  try {
    const allocation = mockDB.allocations.find(
      a => a.userId === session!.user!.id && a.status === 'PENDING'
    ) ?? null;

    if (!allocation) return { success: true as const, data: null };

    const unit = mockDB.findUnitById(allocation.housingUnitId) ?? null;
    const housingType = unit
      ? (mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId) ?? null)
      : null;

    return {
      success: true as const,
      data: { allocation, unit, housingType },
    };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch allocation' };
  }
}

// ---------------------------------------------------------------------------
// Staff: Get active tenancy agreement
// ---------------------------------------------------------------------------

export async function getMyTenancyAgreementAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  try {
    const occupancy = mockDB.findActiveOccupancyByUserId(session.user.id) ?? null;
    if (!occupancy) return { success: true as const, data: null };

    const agreement = mockDB.tenancyAgreements.find(t => t.occupancyId === occupancy.id) ?? null;
    const unit = mockDB.findUnitById(occupancy.housingUnitId) ?? null;
    const housingType = unit
      ? (mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId) ?? null)
      : null;
    const user = mockDB.findUserById(session.user.id) ?? null;
    const profile = mockDB.staffProfiles.find(p => p.userId === session!.user!.id) ?? null;

    return {
      success: true as const,
      data: { occupancy, agreement, unit, housingType, user, profile },
    };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch tenancy data' };
  }
}
