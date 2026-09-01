'use server';

// =============================================================================
// Server Actions — Exit Notices & Inspection Pipeline
// =============================================================================

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  submitExitNotice,
  updateExitInspection,
  getActiveExitNoticeForUser,
  getExitNoticesForRole,
  getExitNoticeById,
  adminTerminateExitNotice,
  getExitNoticesForUser,
  getAllExitNotices,
  getExitNoticeWithProfile,
} from '@/lib/mock-api/endpoints/exit';
import {
  exitNoticeSubmitSchema,
  exitInspectionSchema,
  adminTerminateSchema,
} from '@/lib/validations/housing';
import { writeAuditEntry } from '@/lib/mock-api/endpoints/audit';

// ---------------------------------------------------------------------------
// Staff: Submit Exit Notice
// ---------------------------------------------------------------------------

export async function submitExitNoticeAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff members can submit exit notices' };
  }

  const parsed = exitNoticeSubmitSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const notice = await submitExitNotice({
      userId: session.user.id,
      housingUnitId: parsed.data.housingUnitId,
      reason: parsed.data.reason,
      customReason: parsed.data.customReason,
      additionalNotes: parsed.data.additionalNotes,
    });

    await writeAuditEntry({
      actorId: session.user.id,
      action: 'EXIT_NOTICE_SUBMITTED',
      entityType: 'ExitNotice',
      entityId: notice.id,
      status: 'SUCCESS',
      metadata: { reason: parsed.data.reason, housingUnitId: parsed.data.housingUnitId },
    });

    revalidatePath('/staff/exit');
    revalidatePath('/staff');
    return { success: true, data: notice };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'EXIT_NOTICE_SUBMITTED',
      entityType: 'ExitNotice',
      entityId: 'unknown',
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit exit notice' };
  }
}

// ---------------------------------------------------------------------------
// Staff: View own active exit notice
// ---------------------------------------------------------------------------

export async function getMyExitNoticeAction() {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Access denied' };
  }

  try {
    const notice = await getActiveExitNoticeForUser(session.user.id);
    return { success: true, data: notice };
  } catch {
    return { success: false, error: 'Failed to fetch exit notice' };
  }
}

// ---------------------------------------------------------------------------
// Management: List exit notices filtered by caller's role
// ---------------------------------------------------------------------------

export async function getExitNoticesForRoleAction() {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const allowedRoles = [
    'SUPER_ADMIN',
    'HOUSING_SECRETARY',
    'ELECTRICAL_OFFICER',
    'ESTATE_OFFICER',
  ] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const notices = await getExitNoticesForRole(session.user.role);
    return { success: true, data: notices };
  } catch {
    return { success: false, error: 'Failed to fetch exit notices' };
  }
}

// ---------------------------------------------------------------------------
// Management: Fetch a single exit notice
// ---------------------------------------------------------------------------

export async function getExitNoticeDetailAction(exitNoticeId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const allowedRoles = [
    'SUPER_ADMIN',
    'HOUSING_SECRETARY',
    'ELECTRICAL_OFFICER',
    'ESTATE_OFFICER',
  ] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const notice = await getExitNoticeById(exitNoticeId);
    if (!notice) return { success: false, error: 'Exit notice not found' };
    return { success: true, data: notice };
  } catch {
    return { success: false, error: 'Failed to fetch exit notice' };
  }
}

// ---------------------------------------------------------------------------
// Management: Update Inspection Stage
// Automatically triggers cascading clearance if all 3 stages pass.
// ---------------------------------------------------------------------------

export async function updateExitInspectionAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const inspectorRoles = ['HOUSING_SECRETARY', 'ELECTRICAL_OFFICER', 'ESTATE_OFFICER', 'SUPER_ADMIN'] as const;
  if (!inspectorRoles.includes(session.user.role as typeof inspectorRoles[number])) {
    return { success: false, error: 'You do not have permission to update exit inspections' };
  }

  const parsed = exitInspectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const updatedNotice = await updateExitInspection({
      exitNoticeId: parsed.data.exitNoticeId,
      stage: parsed.data.stage,
      inspectorId: session.user.id,
      inspectorRole: session.user.role,
      result: parsed.data.result,
    });

    await writeAuditEntry({
      actorId: session.user.id,
      action: 'EXIT_INSPECTION_UPDATED',
      entityType: 'ExitNotice',
      entityId: parsed.data.exitNoticeId,
      status: 'SUCCESS',
      metadata: {
        stage: parsed.data.stage,
        result: parsed.data.result,
        isNowCleared: updatedNotice.isCleared,
      },
    });

    revalidatePath('/admin/exit');
    revalidatePath(`/admin/exit/${parsed.data.exitNoticeId}`);

    // If cleared, also invalidate the affected staff's portal
    if (updatedNotice.isCleared) {
      revalidatePath('/staff/exit');
      revalidatePath('/staff/housing');
      revalidatePath('/staff');
    }

    return { success: true, data: updatedNotice };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'EXIT_INSPECTION_UPDATED',
      entityType: 'ExitNotice',
      entityId: typeof parsed.data === 'object' && parsed.data !== null
        ? (parsed.data as { exitNoticeId?: string }).exitNoticeId ?? 'unknown'
        : 'unknown',
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update inspection' };
  }
}

// ---------------------------------------------------------------------------
// Administrative Termination
// ---------------------------------------------------------------------------

export async function adminTerminateExitNoticeAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  
  const adminRoles = ['HOUSING_SECRETARY', 'ESTATE_OFFICER', 'ELECTRICAL_OFFICER', 'SUPER_ADMIN'] as const;
  if (!adminRoles.includes(session.user.role as typeof adminRoles[number])) {
    return { success: false, error: 'Only management roles can terminate exit notices' };
  }

  const parsed = adminTerminateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  if (parsed.data.entityType !== 'ExitNotice') {
    return { success: false, error: 'Invalid entity type for this action' };
  }

  try {
    const notice = await adminTerminateExitNotice({
      exitNoticeId: parsed.data.entityId,
      adminId: session.user.id,
      reason: parsed.data.reason,
    });
    
    // Audit log is already written inside adminTerminateExitNotice
    
    revalidatePath('/admin/exit');
    revalidatePath(`/admin/exit/${parsed.data.entityId}`);
    return { success: true, data: notice };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to terminate exit notice' };
  }
}

// ---------------------------------------------------------------------------
// History Queries
// ---------------------------------------------------------------------------

export async function getExitNoticesForUserAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') return { success: false as const, error: 'Only staff can access their own exit history' };
  try {
    const notices = await getExitNoticesForUser(session.user.id);
    return { success: true as const, data: notices };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch exit notices' };
  }
}

export async function getAllExitNoticesAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  const adminRoles = ['HOUSING_SECRETARY', 'ESTATE_OFFICER', 'ELECTRICAL_OFFICER', 'DVC_ADMIN', 'SUPER_ADMIN'] as const;
  if (!adminRoles.includes(session.user.role as typeof adminRoles[number])) {
    return { success: false as const, error: 'Access denied' };
  }
  try {
    const notices = await getAllExitNotices();
    return { success: true as const, data: notices };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch exit notices' };
  }
}

export async function getExitNoticeWithProfileAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  try {
    const detail = await getExitNoticeWithProfile(id);
    if (!detail) return { success: false as const, error: 'Exit notice not found' };
    return { success: true as const, data: detail };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch exit notice' };
  }
}
