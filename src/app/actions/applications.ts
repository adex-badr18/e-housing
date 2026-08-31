'use server';

// =============================================================================
// Server Actions — Applications & Allocations
// =============================================================================

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  submitApplication,
  reviewApplication,
  createAllocation,
  respondToAllocation,
  getApplicationsForRole,
  getApplicationsForUser,
  getApplicationDetail,
  getApplicationWithProfile,
  getVacantUnitsForApplication,
  requeueApplication,
} from '@/lib/mock-api/endpoints/applications';
import {
  applicationSubmitSchema,
  applicationReviewSchema,
  allocationResponseSchema,
  requeueApplicationSchema,
} from '@/lib/validations/housing';
import { writeAuditEntry } from '@/lib/mock-api/endpoints/audit';
import type { PointsBreakdown } from '@/lib/mock-api/db';
import { calculateScore, toPointsBreakdown, type ScoringResult } from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Management: Auto-score an application (Housing Secretary helper)
// Returns a suggested ScoringResult without persisting anything.
// The Housing Secretary can review / adjust before submitting the review.
// ---------------------------------------------------------------------------

export async function autoScoreApplicationAction(
  applicationId: string
): Promise<{ success: true; data: ScoringResult } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'HOUSING_SECRETARY' && session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only Housing Secretary can auto-score applications' };
  }

  try {
    const detail = await getApplicationWithProfile(applicationId);
    if (!detail) return { success: false, error: 'Application not found' };
    if (!detail.applicantProfile) {
      return { success: false, error: 'Staff profile not found for this applicant — manual scoring required' };
    }

    const { applicantProfile } = detail;
    const result = calculateScore({
      rank:               applicantProfile.rank,
      salaryGradeLevel:   applicantProfile.salaryGradeLevel,
      employmentDate:     applicantProfile.employmentDate,
      numberOfDependents: applicantProfile.numberOfDependents,
      maritalStatus:      applicantProfile.maritalStatus,
    });

    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to calculate score',
    };
  }
}

// ---------------------------------------------------------------------------
// Management: Fetch rich application detail for the review screen
// ---------------------------------------------------------------------------

export async function getApplicationWithProfileAction(applicationId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const allowedRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const detail = await getApplicationWithProfile(applicationId);
    if (!detail) return { success: false, error: 'Application not found' };
    return { success: true, data: detail };
  } catch {
    return { success: false, error: 'Failed to fetch application detail' };
  }
}



// ---------------------------------------------------------------------------
// Staff: Submit a housing application
// ---------------------------------------------------------------------------

export async function submitApplicationAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff members can submit housing applications' };
  }

  const parsed = applicationSubmitSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const application = await submitApplication(session.user.id, parsed.data);
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'HousingApplication',
      entityId: application.id,
      status: 'SUCCESS',
      metadata: { preferredTypes: parsed.data.preferredHousingTypeIds },
    });
    revalidatePath('/staff/applications');
    revalidatePath('/staff');
    return { success: true, data: application };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'HousingApplication',
      entityId: 'unknown',
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit application' };
  }
}

// ---------------------------------------------------------------------------
// Staff: View own applications
// ---------------------------------------------------------------------------

export async function getMyApplicationsAction() {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff can access this endpoint' };
  }

  try {
    const applications = await getApplicationsForUser(session.user.id);
    return { success: true, data: applications };
  } catch {
    return { success: false, error: 'Failed to fetch applications' };
  }
}

// ---------------------------------------------------------------------------
// Management: List applications filtered by caller's role
// ---------------------------------------------------------------------------

export async function getApplicationsForRoleAction() {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const allowedRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const applications = await getApplicationsForRole(session.user.role);
    return { success: true, data: applications };
  } catch {
    return { success: false, error: 'Failed to fetch applications' };
  }
}

// ---------------------------------------------------------------------------
// Management: Fetch a single application with review history
// ---------------------------------------------------------------------------

export async function getApplicationDetailAction(applicationId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const allowedRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return { success: false, error: 'Access denied' };
  }

  try {
    const detail = await getApplicationDetail(applicationId);
    if (!detail) return { success: false, error: 'Application not found' };
    return { success: true, data: detail };
  } catch {
    return { success: false, error: 'Failed to fetch application detail' };
  }
}

// ---------------------------------------------------------------------------
// Management: Stage-gated Review
// ---------------------------------------------------------------------------

export async function reviewApplicationAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const reviewRoles = ['HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'] as const;
  if (!reviewRoles.includes(session.user.role as typeof reviewRoles[number])) {
    return { success: false, error: 'You do not have permission to review applications' };
  }

  const parsed = applicationReviewSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  // Build points breakdown if Housing Secretary is scoring
  const pointsBreakdown: PointsBreakdown | null =
    parsed.data.stage === 'HOUSING' &&
    parsed.data.baseTypePoints != null
      ? {
          baseTypePoints: parsed.data.baseTypePoints ?? 0,
          seniorityBonus: parsed.data.seniorityBonus ?? 0,
          dependentsBonus: parsed.data.dependentsBonus ?? 0,
          maritalStatusBonus: parsed.data.maritalStatusBonus ?? 0,
          totalPoints:
            (parsed.data.baseTypePoints ?? 0) +
            (parsed.data.seniorityBonus ?? 0) +
            (parsed.data.dependentsBonus ?? 0) +
            (parsed.data.maritalStatusBonus ?? 0),
        }
      : null;

  try {
    const { application, review } = await reviewApplication({
      applicationId: parsed.data.applicationId,
      reviewerId: session.user.id,
      reviewerRole: session.user.role,
      stage: parsed.data.stage,
      decision: parsed.data.decision,
      comments: parsed.data.comments,
      score: parsed.data.score ?? null,
      pointsBreakdown,
      allocatedUnitId: parsed.data.allocatedUnitId ?? null,
    });

    await writeAuditEntry({
      actorId: session.user.id,
      action: 'APPLICATION_REVIEWED',
      entityType: 'HousingApplication',
      entityId: parsed.data.applicationId,
      status: 'SUCCESS',
      metadata: {
        stage: parsed.data.stage,
        decision: parsed.data.decision,
        reviewId: review.id,
        allocatedUnitId: parsed.data.allocatedUnitId ?? null,
      },
    });

    revalidatePath('/management/applications');
    revalidatePath(`/management/applications/${parsed.data.applicationId}`);
    return { success: true, data: { application, review } };
  } catch (err) {
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'APPLICATION_REVIEWED',
      entityType: 'HousingApplication',
      entityId: parsed.data.applicationId,
      status: 'FAILURE',
      metadata: { error: String(err) },
    });
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit review' };
  }
}

// ---------------------------------------------------------------------------
// Estate Officer: Fetch vacant housing units for an application
// ---------------------------------------------------------------------------

export async function getVacantUnitsForApplicationAction(applicationId: string) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  if (session.user.role !== 'ESTATE_OFFICER' && session.user.role !== 'SUPER_ADMIN') {
    return { success: false as const, error: 'Only Estate Officer can fetch vacant units' };
  }

  try {
    const units = await getVacantUnitsForApplication(applicationId);
    return { success: true as const, data: units };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to fetch vacant units' };
  }
}

// ---------------------------------------------------------------------------
// Estate Officer: Re-activate a queued application with a selected unit
// ---------------------------------------------------------------------------

export async function requeueApplicationAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'ESTATE_OFFICER' && session.user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Only Estate Officer can re-activate queued applications' };
  }

  const parsed = requeueApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const application = await requeueApplication(
      parsed.data.applicationId,
      parsed.data.allocatedUnitId
    );
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'APPLICATION_REQUEUED',
      entityType: 'HousingApplication',
      entityId: parsed.data.applicationId,
      status: 'SUCCESS',
      metadata: { allocatedUnitId: parsed.data.allocatedUnitId },
    });
    revalidatePath('/management/applications');
    revalidatePath(`/management/applications/${parsed.data.applicationId}`);
    return { success: true, data: application };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to re-activate application' };
  }
}

// ---------------------------------------------------------------------------
// Management: Create Allocation (post-DVC approval)
// ---------------------------------------------------------------------------

export async function createAllocationAction(
  applicationId: string,
  userId: string,
  housingUnitId: string
) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const allowedRoles = ['SUPER_ADMIN', 'HOUSING_SECRETARY'] as const;
  if (!allowedRoles.includes(session.user.role as typeof allowedRoles[number])) {
    return { success: false, error: 'Only Housing Secretary or Super Admin can create allocations' };
  }

  try {
    const allocation = await createAllocation({ applicationId, userId, housingUnitId });
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'ALLOCATION_CREATED',
      entityType: 'Allocation',
      entityId: allocation.id,
      status: 'SUCCESS',
      metadata: { userId, housingUnitId },
    });
    revalidatePath('/admin/allocations');
    revalidatePath('/management/applications');
    return { success: true, data: allocation };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create allocation' };
  }
}

// ---------------------------------------------------------------------------
// Staff: Respond to Allocation (Accept / Reject)
// ---------------------------------------------------------------------------

export async function respondToAllocationAction(data: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Only staff can respond to allocations' };
  }

  const parsed = allocationResponseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    const allocation = await respondToAllocation(
      parsed.data.allocationId,
      session.user.id,
      parsed.data.response
    );
    await writeAuditEntry({
      actorId: session.user.id,
      action: 'ALLOCATION_RESPONDED',
      entityType: 'Allocation',
      entityId: parsed.data.allocationId,
      status: 'SUCCESS',
      metadata: { response: parsed.data.response },
    });
    revalidatePath('/staff/housing');
    revalidatePath('/staff');
    return { success: true, data: allocation };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to respond to allocation' };
  }
}
