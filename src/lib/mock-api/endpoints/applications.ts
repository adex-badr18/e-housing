// =============================================================================
// Mock API — Applications Endpoint
// Covers: application submission, per-stage review, allocation, review queries
// =============================================================================
// Review stage gate rules (PRD §3.5, ARCHITECTURE §5.3):
//   HOUSING stage  → HOUSING_SECRETARY only
//   ESTATE stage   → ESTATE_OFFICER only, requires HOUSING = FORWARDED/APPROVED
//   DVC stage      → DVC_ADMIN only, requires ESTATE = FORWARDED/APPROVED
// =============================================================================

import {
  mockDB,
  HousingApplication,
  ApplicationReview,
  Allocation,
  PointsBreakdown,
  Role,
  ApplicationStage,
  ReviewDecision,
} from '../db';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** All applications — visible to management roles */
export async function getAllApplications(): Promise<HousingApplication[]> {
  await delay(300);
  return [...mockDB.housingApplications].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

/**
 * Role-filtered application list.
 * - HOUSING_SECRETARY: sees PENDING (awaiting Stage 1)
 * - ESTATE_OFFICER: sees applications at ESTATE stage
 * - DVC_ADMIN: sees applications at DVC stage
 */
export async function getApplicationsForRole(role: Role): Promise<HousingApplication[]> {
  await delay(300);
  switch (role) {
    case 'HOUSING_SECRETARY':
      return mockDB.housingApplications.filter(a => a.currentStage === 'HOUSING');
    case 'ESTATE_OFFICER':
      return mockDB.housingApplications.filter(a => a.currentStage === 'ESTATE');
    case 'DVC_ADMIN':
      return mockDB.housingApplications.filter(a => a.currentStage === 'DVC');
    case 'SUPER_ADMIN':
      return [...mockDB.housingApplications];
    default:
      return [];
  }
}

/** Application with its review history and linked allocation (if any) */
export async function getApplicationDetail(applicationId: string): Promise<{
  application: HousingApplication;
  reviews: ApplicationReview[];
  allocation: Allocation | null;
} | null> {
  await delay(300);
  const application = mockDB.findApplicationById(applicationId);
  if (!application) return null;

  const reviews = mockDB.getReviewsForApplication(applicationId);
  const allocation = mockDB.allocations.find(a => a.applicationId === applicationId) ?? null;

  return { application: { ...application }, reviews: [...reviews], allocation };
}

/** Staff: fetch their own application history */
export async function getApplicationsForUser(userId: string): Promise<HousingApplication[]> {
  await delay(300);
  return mockDB.housingApplications
    .filter(a => a.userId === userId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

// ---------------------------------------------------------------------------
// Staff: Submit Application
// ---------------------------------------------------------------------------

export async function submitApplication(
  userId: string,
  data: {
    preferredHousingTypeIds: string[];
    additionalNotes?: string;
  }
): Promise<HousingApplication> {
  await delay(600);

  // Enforce: one active application at a time
  const existing = mockDB.getActiveApplicationForUser(userId);
  if (existing) {
    throw new Error(
      'You already have an active application in progress. Please wait for it to be resolved before submitting a new one.'
    );
  }

  // Validate preferred housing type IDs exist
  for (const htId of data.preferredHousingTypeIds) {
    const ht = mockDB.housingTypes.find(h => h.id === htId && h.isActive);
    if (!ht) throw new Error(`Housing type ${htId} is not available`);
  }

  const now = new Date().toISOString();
  const application: HousingApplication = {
    id: mockDB.generateId('app'),
    userId,
    preferredHousingTypeIds: data.preferredHousingTypeIds,
    status: 'PENDING',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    additionalNotes: data.additionalNotes,
    submittedAt: now,
    updatedAt: now,
  };
  mockDB.housingApplications.push(application);
  return application;
}

// ---------------------------------------------------------------------------
// Management: Stage-Gated Application Review
// ---------------------------------------------------------------------------

/**
 * Applies a review to an application and advances it through the workflow.
 * Enforces sequential stage rules from the PRD:
 *   HOUSING → ESTATE → DVC → COMPLETED
 */
export async function reviewApplication(params: {
  applicationId: string;
  reviewerId: string;
  reviewerRole: Role;
  stage: Exclude<ApplicationStage, 'COMPLETED'>;
  decision: ReviewDecision;
  comments: string;
  score?: number | null;
  pointsBreakdown?: PointsBreakdown | null;
}): Promise<{ application: HousingApplication; review: ApplicationReview }> {
  await delay(700);

  const application = mockDB.findApplicationById(params.applicationId);
  if (!application) throw new Error('Application not found');

  // ---- Stage gate: ensure the application is at the expected stage ----
  if (application.currentStage !== params.stage) {
    throw new Error(
      `Application is at stage "${application.currentStage}", not "${params.stage}". Reviews must be sequential.`
    );
  }

  // ---- Role gate ----
  const stageRoleMap: Record<Exclude<ApplicationStage, 'COMPLETED'>, Role> = {
    HOUSING: 'HOUSING_SECRETARY',
    ESTATE: 'ESTATE_OFFICER',
    DVC: 'DVC_ADMIN',
  };
  if (stageRoleMap[params.stage] !== params.reviewerRole) {
    throw new Error(`Only ${stageRoleMap[params.stage]} can review at the ${params.stage} stage`);
  }

  // ---- DVC cannot FORWARD ----
  if (params.stage === 'DVC' && params.decision === 'FORWARDED') {
    throw new Error('DVC Admin must make a final APPROVED or REJECTED decision');
  }

  // ---- Record the review ----
  const now = new Date().toISOString();
  const review: ApplicationReview = {
    id: mockDB.generateId('rev'),
    applicationId: params.applicationId,
    reviewerId: params.reviewerId,
    reviewerRole: params.reviewerRole,
    stage: params.stage,
    score: params.score ?? null,
    decision: params.decision,
    comments: params.comments,
    reviewedAt: now,
  };
  mockDB.applicationReviews.push(review);

  // ---- Advance application state ----
  const appIdx = mockDB.housingApplications.findIndex(a => a.id === params.applicationId);

  if (params.decision === 'REJECTED') {
    mockDB.housingApplications[appIdx] = {
      ...application,
      status: 'REJECTED',
      currentStage: params.stage,
      updatedAt: now,
    };
  } else if (params.decision === 'FORWARDED') {
    const nextStageMap: Partial<Record<ApplicationStage, ApplicationStage>> = {
      HOUSING: 'ESTATE',
      ESTATE: 'DVC',
    };
    const nextStage = nextStageMap[params.stage]!;
    mockDB.housingApplications[appIdx] = {
      ...application,
      status: 'UNDER_REVIEW',
      currentStage: nextStage,
      pointsBreakdown: params.pointsBreakdown ?? application.pointsBreakdown,
      updatedAt: now,
    };
  } else if (params.decision === 'APPROVED' && params.stage === 'DVC') {
    // Final approval — mark COMPLETED
    mockDB.housingApplications[appIdx] = {
      ...application,
      status: 'APPROVED',
      currentStage: 'COMPLETED',
      updatedAt: now,
    };
    // In a real system we'd trigger allocation creation and email here
  }

  // Update points breakdown if provided (set during Housing stage)
  if (params.pointsBreakdown) {
    mockDB.housingApplications[appIdx].pointsBreakdown = params.pointsBreakdown;
  }

  return {
    application: { ...mockDB.housingApplications[appIdx] },
    review,
  };
}

// ---------------------------------------------------------------------------
// Allocation
// ---------------------------------------------------------------------------

export async function createAllocation(params: {
  applicationId: string;
  userId: string;
  housingUnitId: string;
}): Promise<Allocation> {
  await delay(500);

  const application = mockDB.findApplicationById(params.applicationId);
  if (!application || application.status !== 'APPROVED') {
    throw new Error('Allocation can only be created for APPROVED applications');
  }

  const unit = mockDB.findUnitById(params.housingUnitId);
  if (!unit || unit.status !== 'VACANT') {
    throw new Error('The selected housing unit is not available');
  }

  const now = new Date().toISOString();
  // Allocation expires in 14 days
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const allocation: Allocation = {
    id: mockDB.generateId('alc'),
    applicationId: params.applicationId,
    userId: params.userId,
    housingUnitId: params.housingUnitId,
    status: 'PENDING',
    allocatedAt: now,
    respondedAt: null,
    expiresAt,
  };
  mockDB.allocations.push(allocation);
  return allocation;
}

export async function respondToAllocation(
  allocationId: string,
  userId: string,
  response: 'ACCEPTED' | 'REJECTED'
): Promise<Allocation> {
  await delay(500);

  const idx = mockDB.allocations.findIndex(
    a => a.id === allocationId && a.userId === userId && a.status === 'PENDING'
  );
  if (idx === -1) throw new Error('Allocation not found or has already been responded to');

  const now = new Date().toISOString();
  mockDB.allocations[idx] = {
    ...mockDB.allocations[idx],
    status: response,
    respondedAt: now,
  };

  if (response === 'ACCEPTED') {
    // Create occupancy record
    const alloc = mockDB.allocations[idx];
    const occupancy = {
      id: mockDB.generateId('occ'),
      userId,
      housingUnitId: alloc.housingUnitId,
      checkInDate: now.split('T')[0],
      checkOutDate: null,
      status: 'ACTIVE' as const,
      createdAt: now,
      updatedAt: now,
    };
    mockDB.occupancies.push(occupancy);

    // Update housing unit status
    const unitIdx = mockDB.housingUnits.findIndex(u => u.id === alloc.housingUnitId);
    if (unitIdx !== -1) {
      mockDB.housingUnits[unitIdx] = {
        ...mockDB.housingUnits[unitIdx],
        status: 'OCCUPIED',
        currentOccupantId: userId,
        updatedAt: now,
      };
    }

    // Update staff profile housing status
    const profileIdx = mockDB.staffProfiles.findIndex(p => p.userId === userId);
    if (profileIdx !== -1) {
      mockDB.staffProfiles[profileIdx] = {
        ...mockDB.staffProfiles[profileIdx],
        currentHousingStatus: 'HAS_ALLOCATION',
        updatedAt: now,
      };
    }

    // Create tenancy agreement (mock)
    mockDB.tenancyAgreements.push({
      id: mockDB.generateId('tena'),
      occupancyId: occupancy.id,
      documentUrl: `/documents/tenancy/${occupancy.id}-agreement.pdf`,
      signed: false,
      createdAt: now,
    });
  }

  return mockDB.allocations[idx];
}
