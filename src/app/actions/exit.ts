'use server';

// =============================================================================
// Server Actions — Exit Notices & Inspection Pipeline
// =============================================================================
// Phase 3 (refactored):
//   - Exit initiation is Estate Officer-only (estateOfficerInitiateExitAction)
//   - submitExitNoticeAction is deprecated (STAFF role returns 403)
//   - Housing and Electrical clearances are parallel (no sequential gate)
//   - Estate stage accepts inspectionNotes for on-site observations
//   - Re-submission (FAILED → PASSED) is allowed without extra guards
//   - Grace period extension action added (extendGracePeriodAction)
//   - DVC_ADMIN added to all read-only action gates
//   - Audit log query action added (getExitNoticeAuditLogAction)
//   - All per-event audit writes are now owned by the endpoint layer;
//     action layer only writes a failure audit entry when the endpoint throws.
// =============================================================================

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  estateOfficerInitiateExit,
  submitExitNotice,
  updateExitInspection,
  extendGracePeriod,
  adminTerminateExitNotice,
  getActiveExitNoticeForUser,
  getExitNoticesForRole,
  getExitNoticeById,
  getExitNoticesForUser,
  getAllExitNotices,
  getExitNoticeWithProfile,
  getExitNoticeAuditLog,
} from '@/lib/mock-api/endpoints/exit';
import {
  managementInitiateExitSchema,
  extendGracePeriodSchema,
  exitInspectionSchema,
  adminTerminateSchema,
} from '@/lib/validations/housing';
import { writeAuditEntry } from '@/lib/mock-api/endpoints/audit';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MANAGEMENT_ROLES = [
  'SUPER_ADMIN',
  'HOUSING_SECRETARY',
  'ELECTRICAL_OFFICER',
  'ESTATE_OFFICER',
  'DVC_ADMIN',
] as const;

type ManagementRole = typeof MANAGEMENT_ROLES[number];

/** Revalidates all cached paths related to an exit notice. */
function revalidateExitPaths(exitNoticeId?: string) {
  revalidatePath('/management/exit');
  if (exitNoticeId) {
    revalidatePath(`/management/exit/${exitNoticeId}`);
    revalidatePath(`/management/exit/${exitNoticeId}/audit`);
  }
}

// ---------------------------------------------------------------------------
// Step 12 — Estate Officer: Initiate Exit (NEW)
// ---------------------------------------------------------------------------

/**
 * Creates a new exit notice on behalf of an occupant.
 * The occupant must physically visit the Estate Office.
 * Only ESTATE_OFFICER (or SUPER_ADMIN) may call this action.
 *
 * Validates against managementInitiateExitSchema, which derives
 * the staff user ID and housing unit ID from the occupancyId.
 */
export async function estateOfficerInitiateExitAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  const allowedRoles = ['ESTATE_OFFICER', 'SUPER_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return {
      success: false as const,
      error: 'Only Estate Officers can initiate an exit notice',
    };
  }

  const parsed = managementInitiateExitSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const notice = await estateOfficerInitiateExit({
      initiatedByUserId: session.user.id,
      initiatedByRole: session.user.role as 'ESTATE_OFFICER' | 'SUPER_ADMIN',
      occupancyId: parsed.data.occupancyId,
      reason: parsed.data.reason,
      customReason: parsed.data.customReason ?? undefined,
      additionalNotes: parsed.data.additionalNotes,
    });

    // Audit log is written inside estateOfficerInitiateExit (EXIT_NOTICE_INITIATED)
    revalidateExitPaths(notice.id);
    // Also invalidate the occupant's staff portal so they see the new notice
    revalidatePath('/staff/exit');
    revalidatePath('/staff');
    // And the occupancy detail page (the "Initiate Exit" button source)
    revalidatePath('/management/occupancies');

    return { success: true as const, data: notice };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'EXIT_NOTICE_INITIATED',
      entityType: 'ExitNotice',
      entityId: 'unknown',
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to initiate exit notice',
    };
  }
}

// ---------------------------------------------------------------------------
// Step 11 — Staff: Submit Exit Notice (DEPRECATED)
// ---------------------------------------------------------------------------

/**
 * @deprecated Staff can no longer self-initiate exits.
 * Use estateOfficerInitiateExitAction instead.
 *
 * This action now returns a 403 for STAFF callers, preserving the
 * function signature so existing import references compile during the
 * Phase 1→6 transition. It will be removed entirely in Phase 6.
 */
export async function submitExitNoticeAction(_data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  // Staff self-service is no longer permitted
  if (session.user.role === 'STAFF') {
    return {
      success: false as const,
      error:
        'Self-service exit submission has been discontinued. ' +
        'Please visit the Estate Office in person to initiate an exit.',
    };
  }

  return { success: false as const, error: 'Action deprecated — use estateOfficerInitiateExitAction' };
}

// ---------------------------------------------------------------------------
// Step 16 — Read: Active exit notice for the calling staff member
// ---------------------------------------------------------------------------

export async function getMyExitNoticeAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const notice = await getActiveExitNoticeForUser(session.user.id);
    return { success: true as const, data: notice };
  } catch {
    return { success: false as const, error: 'Failed to fetch exit notice' };
  }
}

// ---------------------------------------------------------------------------
// Step 16 — Management: List exit notices filtered by caller's role
// ---------------------------------------------------------------------------

/**
 * Returns exit notices visible to the current user's role.
 * DVC_ADMIN now included (read-only, sees all notices).
 */
export async function getExitNoticesForRoleAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  if (!MANAGEMENT_ROLES.includes(session.user.role as ManagementRole)) {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const notices = await getExitNoticesForRole(session.user.role);
    return { success: true as const, data: notices };
  } catch {
    return { success: false as const, error: 'Failed to fetch exit notices' };
  }
}

// ---------------------------------------------------------------------------
// Management: Fetch a single exit notice by ID
// ---------------------------------------------------------------------------

export async function getExitNoticeDetailAction(exitNoticeId: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  if (!MANAGEMENT_ROLES.includes(session.user.role as ManagementRole)) {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const notice = await getExitNoticeById(exitNoticeId);
    if (!notice) return { success: false as const, error: 'Exit notice not found' };
    return { success: true as const, data: notice };
  } catch {
    return { success: false as const, error: 'Failed to fetch exit notice' };
  }
}

// ---------------------------------------------------------------------------
// Step 13 — Management: Update Inspection Stage (refactored)
// ---------------------------------------------------------------------------

/**
 * Submits a clearance result for one of the three inspection stages.
 *
 * Stage semantics:
 *   HOUSING    → Housing Payment Clearance (HOUSING_SECRETARY)
 *   ELECTRICAL → Electrical Fittings Clearance (ELECTRICAL_OFFICER)
 *   ESTATE     → Pre-Vacation Site Inspection (ESTATE_OFFICER)
 *
 * Key changes vs. the old action:
 *   - inspectionNotes is now forwarded to the endpoint (used by ESTATE stage)
 *   - Sequential gate between HOUSING and ELECTRICAL has been removed
 *   - Re-submission from FAILED to PASSED is allowed
 *   - Per-event audit writes are now owned by the endpoint layer
 */
export async function updateExitInspectionAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  const inspectorRoles = [
    'HOUSING_SECRETARY',
    'ELECTRICAL_OFFICER',
    'ESTATE_OFFICER',
    'SUPER_ADMIN',
  ] as const;
  if (!inspectorRoles.includes(session.user.role as typeof inspectorRoles[number])) {
    return {
      success: false as const,
      error: 'You do not have permission to submit clearance results',
    };
  }

  const parsed = exitInspectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const updatedNotice = await updateExitInspection({
      exitNoticeId: parsed.data.exitNoticeId,
      stage: parsed.data.stage,
      inspectorId: session.user.id,
      inspectorRole: session.user.role,
      result: parsed.data.result,
      // Forward inspection notes — endpoint stores them only for the ESTATE stage
      inspectionNotes: parsed.data.inspectionNotes,
    });

    // Per-event audit is written inside updateExitInspection
    revalidateExitPaths(parsed.data.exitNoticeId);

    // If the exit is now fully cleared, invalidate the occupant's portal too
    if (updatedNotice.isCleared) {
      revalidatePath('/staff/exit');
      revalidatePath('/staff/housing');
      revalidatePath('/staff');
      revalidatePath('/management/occupancies');
    }

    return { success: true as const, data: updatedNotice };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'EXIT_INSPECTION_UPDATED',
      entityType: 'ExitNotice',
      entityId: parsed.data.exitNoticeId,
      status: 'FAILURE',
      metadata: { stage: parsed.data.stage, error: String(err) },
    });
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to submit clearance result',
    };
  }
}

// ---------------------------------------------------------------------------
// Step 14 — Grace Period Extension (NEW)
// ---------------------------------------------------------------------------

/**
 * Extends the grace period deadline on an active exit notice.
 * Only ESTATE_OFFICER or SUPER_ADMIN may call this action.
 * The extension is added to the current deadline, not from today.
 */
export async function extendGracePeriodAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  const allowedRoles = ['ESTATE_OFFICER', 'SUPER_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return {
      success: false as const,
      error: 'Only Estate Officers can extend the grace period',
    };
  }

  const parsed = extendGracePeriodSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const notice = await extendGracePeriod({
      exitNoticeId: parsed.data.exitNoticeId,
      additionalDays: parsed.data.additionalDays,
      reason: parsed.data.reason,
      extendedByUserId: session.user.id,
      extendedByRole: session.user.role as 'ESTATE_OFFICER' | 'SUPER_ADMIN',
    });

    // Audit log is written inside extendGracePeriod (EXIT_GRACE_PERIOD_EXTENDED)
    revalidateExitPaths(parsed.data.exitNoticeId);
    // The staff portal shows the countdown — revalidate so they see the update
    revalidatePath('/staff/exit');

    return { success: true as const, data: notice };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to extend grace period',
    };
  }
}

// ---------------------------------------------------------------------------
// Step 15 — Administrative Termination (updated)
// ---------------------------------------------------------------------------

/**
 * Estate Officer (or Super Admin) administratively closes an exit notice.
 * Uses isAdminTerminated fields — does not touch isWithdrawn.
 */
export async function adminTerminateExitNoticeAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  const allowedRoles = ['ESTATE_OFFICER', 'SUPER_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return {
      success: false as const,
      error: 'Only Estate Officers can administratively terminate exit notices',
    };
  }

  const parsed = adminTerminateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: 'Validation failed', details: parsed.error.format() };
  }

  if (parsed.data.entityType !== 'ExitNotice') {
    return { success: false as const, error: 'Invalid entity type for this action' };
  }

  try {
    const notice = await adminTerminateExitNotice({
      exitNoticeId: parsed.data.entityId,
      adminId: session.user.id,
      adminRole: session.user.role as 'ESTATE_OFFICER' | 'SUPER_ADMIN',
      reason: parsed.data.reason,
    });

    // Audit log is written inside adminTerminateExitNotice (EXIT_NOTICE_ADMIN_TERMINATED)
    revalidateExitPaths(parsed.data.entityId);
    revalidatePath('/staff/exit');

    return { success: true as const, data: notice };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to terminate exit notice',
    };
  }
}

// ---------------------------------------------------------------------------
// Step 17 — Audit Log Query (NEW)
// ---------------------------------------------------------------------------

/**
 * Returns the full audit trail for a specific exit notice.
 * Accessible to: ESTATE_OFFICER | DVC_ADMIN | SUPER_ADMIN
 */
export async function getExitNoticeAuditLogAction(exitNoticeId: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  const allowedRoles = ['ESTATE_OFFICER', 'DVC_ADMIN', 'SUPER_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return {
      success: false as const,
      error: 'Access denied: audit logs are restricted to Estate Officers, DVC Admin, and Super Admins',
    };
  }

  try {
    const logs = await getExitNoticeAuditLog(exitNoticeId, session.user.role);
    return { success: true as const, data: logs };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to fetch audit log',
    };
  }
}

// ---------------------------------------------------------------------------
// History Queries
// ---------------------------------------------------------------------------

/** Returns all exit notices for the calling staff member (historical view). */
export async function getExitNoticesForUserAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false as const, error: 'Only staff can access their own exit history' };
  }
  try {
    const notices = await getExitNoticesForUser(session.user.id);
    return { success: true as const, data: notices };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to fetch exit notices',
    };
  }
}

/**
 * Returns all exit notices (unfiltered).
 * DVC_ADMIN included for full oversight.
 */
export async function getAllExitNoticesAction() {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  if (!MANAGEMENT_ROLES.includes(session.user.role as ManagementRole)) {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const notices = await getAllExitNotices();
    return { success: true as const, data: notices };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to fetch exit notices',
    };
  }
}

/** Returns a single exit notice with full occupant + unit profile data. */
export async function getExitNoticeWithProfileAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };

  if (!MANAGEMENT_ROLES.includes(session.user.role as ManagementRole)) {
    return { success: false as const, error: 'Access denied' };
  }

  try {
    const detail = await getExitNoticeWithProfile(id);
    if (!detail) return { success: false as const, error: 'Exit notice not found' };
    return { success: true as const, data: detail };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Failed to fetch exit notice',
    };
  }
}
