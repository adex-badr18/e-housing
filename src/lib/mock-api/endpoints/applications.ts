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
  HousingUnit,
  HousingType,
  HousingCategory,
  QuitRequest,
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
 * - ESTATE_OFFICER: sees applications at ESTATE stage + QUEUED applications
 * - DVC_ADMIN: sees applications at DVC stage
 */
export async function getApplicationsForRole(role: Role): Promise<HousingApplication[]> {
  await delay(300);
  switch (role) {
    case 'HOUSING_SECRETARY':
      return mockDB.housingApplications.filter(a => a.currentStage === 'HOUSING');
    case 'ESTATE_OFFICER':
      // Estate Officer sees both active ESTATE-stage apps AND queued apps
      return mockDB.housingApplications.filter(
        a => a.currentStage === 'ESTATE' || a.status === 'QUEUED'
      );
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

/**
 * Rich detail for the review screen: application + reviews + allocation +
 * the applicant's User and StaffProfile (for scoring and display).
 */
export async function getApplicationWithProfile(applicationId: string): Promise<{
  application: HousingApplication;
  reviews: ApplicationReview[];
  allocation: Allocation | null;
  applicantUser: import('../db').User | null;
  applicantProfile: import('../db').StaffProfile | null;
} | null> {
  await delay(300);
  const application = mockDB.findApplicationById(applicationId);
  if (!application) return null;

  const reviews       = mockDB.getReviewsForApplication(applicationId);
  const allocation    = mockDB.allocations.find(a => a.applicationId === applicationId) ?? null;
  const applicantUser = mockDB.findUserById(application.userId) ?? null;
  const applicantProfile = applicantUser
    ? (mockDB.staffProfiles.find(p => p.userId === applicantUser.id) ?? null)
    : null;

  return {
    application:      { ...application },
    reviews:          [...reviews],
    allocation,
    applicantUser:    applicantUser ? { ...applicantUser } : null,
    applicantProfile: applicantProfile ? { ...applicantProfile } : null,
  };
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
 *
 * Estate Officer extensions:
 *   - FORWARDED: may include an `allocatedUnitId` (pre-selected unit)
 *   - QUEUED: application is held at ESTATE stage awaiting a vacant unit
 */
export async function reviewApplication(params: {
  applicationId: string;
  reviewerId: string;
  reviewerRole: Role;
  stage: Exclude<ApplicationStage, 'COMPLETED'>;
  decision: ReviewDecision | 'QUEUED';
  comments: string;
  score?: number | null;
  pointsBreakdown?: PointsBreakdown | null;
  allocatedUnitId?: string | null;
}): Promise<{ application: HousingApplication; review: ApplicationReview }> {
  await delay(700);

  const application = mockDB.findApplicationById(params.applicationId);
  if (!application) throw new Error('Application not found');

  // ---- For QUEUED re-activation: allow ESTATE_OFFICER to act when status is QUEUED ----
  if (params.decision !== 'QUEUED' && application.status === 'QUEUED') {
    // Re-activating a queued application — allowed at ESTATE stage only
    if (params.stage !== 'ESTATE' || params.reviewerRole !== 'ESTATE_OFFICER') {
      throw new Error('Only the Estate Officer can re-activate a queued application');
    }
  } else if (application.status !== 'QUEUED') {
    // Normal stage gate: ensure the application is at the expected stage
    if (application.currentStage !== params.stage) {
      throw new Error(
        `Application is at stage "${application.currentStage}", not "${params.stage}". Reviews must be sequential.`
      );
    }
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

  // ---- Estate Officer: FORWARDED requires a unit selection ----
  if (params.stage === 'ESTATE' && params.decision === 'FORWARDED' && !params.allocatedUnitId) {
    throw new Error('Please select a housing unit before forwarding to DVC Admin');
  }

  // ---- Validate the pre-selected unit is still vacant ----
  if (params.allocatedUnitId) {
    const unit = mockDB.findUnitById(params.allocatedUnitId);
    if (!unit || unit.status !== 'VACANT') {
      throw new Error('The selected housing unit is no longer available. Please choose another.');
    }
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
    decision: params.decision === 'QUEUED' ? 'FORWARDED' : params.decision, // store as FORWARDED internally
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
  } else if (params.decision === 'QUEUED') {
    // Hold application at ESTATE stage with QUEUED status
    mockDB.housingApplications[appIdx] = {
      ...application,
      status: 'QUEUED',
      currentStage: 'ESTATE',
      allocatedUnitId: null, // Clear any prior selection
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
      allocatedUnitId: params.allocatedUnitId ?? application.allocatedUnitId,
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

// ---------------------------------------------------------------------------
// Estate Officer: Fetch all vacant units (with housing type info)
// ---------------------------------------------------------------------------

function getStaffCategory(salaryGradeLevel: string): HousingCategory {
  if (salaryGradeLevel.toUpperCase().includes('CONUASS')) return 'SENIOR';
  const match = salaryGradeLevel.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10) >= 6 ? 'SENIOR' : 'JUNIOR';
  }
  return 'SENIOR'; // Fallback
}

export async function getVacantUnitsForApplication(
  applicationId: string
): Promise<{ 
  unit: HousingUnit; 
  housingType: HousingType | null;
  isEligible: boolean;
  matchesPreference: boolean;
  matchesCategory: boolean;
}[]> {
  await delay(300);

  const application = mockDB.findApplicationById(applicationId);
  if (!application) throw new Error('Application not found');

  const profile = mockDB.staffProfiles.find(p => p.userId === application.userId);
  const staffCategory = profile ? getStaffCategory(profile.salaryGradeLevel) : 'SENIOR';

  // Return ALL vacant units explicitly
  const allVacant = mockDB.housingUnits.filter(u => u.status === 'VACANT');

  return allVacant.map(unit => {
    const housingType = mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId) ?? null;
    const matchesPreference = application.preferredHousingTypeIds.includes(unit.housingTypeId);
    const matchesCategory = housingType?.category === staffCategory;
    const isEligible = matchesPreference && matchesCategory;

    return {
      unit: { ...unit },
      housingType,
      isEligible,
      matchesPreference,
      matchesCategory
    };
  });
}

// ---------------------------------------------------------------------------
// Estate Officer: Re-activate a queued application
// ---------------------------------------------------------------------------

export async function requeueApplication(
  applicationId: string,
  allocatedUnitId: string
): Promise<HousingApplication> {
  await delay(500);

  const application = mockDB.findApplicationById(applicationId);
  if (!application) throw new Error('Application not found');
  if (application.status !== 'QUEUED') {
    throw new Error('Only QUEUED applications can be re-activated');
  }

  const unit = mockDB.findUnitById(allocatedUnitId);
  if (!unit || unit.status !== 'VACANT') {
    throw new Error('The selected housing unit is not available');
  }

  const now = new Date().toISOString();
  const appIdx = mockDB.housingApplications.findIndex(a => a.id === applicationId);
  mockDB.housingApplications[appIdx] = {
    ...application,
    status: 'UNDER_REVIEW',
    currentStage: 'DVC',
    allocatedUnitId,
    updatedAt: now,
  };

  // Record this as an ESTATE review (re-activation)
  mockDB.applicationReviews.push({
    id: mockDB.generateId('rev'),
    applicationId,
    reviewerId: 'system',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'FORWARDED',
    comments: `Re-activated from queue. Unit ${unit.name} selected and forwarded to DVC Admin.`,
    reviewedAt: now,
  });

  return { ...mockDB.housingApplications[appIdx] };
}

// ---------------------------------------------------------------------------
// Quit Requests & Termination
// ---------------------------------------------------------------------------

export async function submitQuitRequest(params: {
  userId: string;
  entityType: 'HousingApplication' | 'ExitNotice';
  entityId: string;
  reason: string;
}): Promise<QuitRequest> {
  await delay(500);

  // Check if a pending request already exists
  const existing = mockDB.quitRequests.find(
    q => q.entityId === params.entityId && q.entityType === params.entityType && q.status === 'PENDING'
  );
  if (existing) {
    throw new Error('A quit request is already pending for this application.');
  }

  let application: HousingApplication | undefined;
  let exitNotice: any | undefined; // using any here to avoid importing ExitNotice for now if it's not available, actually we can import it or just find it. We'll find it dynamically.
  
  if (params.entityType === 'HousingApplication') {
    application = mockDB.findApplicationById(params.entityId);
    if (!application) throw new Error('Application not found');
    if (application.userId !== params.userId) throw new Error('Not authorized to withdraw this application');
    if (['APPROVED', 'REJECTED', 'WITHDRAWN', 'TERMINATED'].includes(application.status)) {
      throw new Error(`Cannot withdraw an application in ${application.status} state`);
    }
  } else {
    exitNotice = mockDB.findExitNoticeById(params.entityId);
    if (!exitNotice) throw new Error('Exit notice not found');
    if (exitNotice.userId !== params.userId) throw new Error('Not authorized to withdraw this exit notice');
    if (exitNotice.isCleared || exitNotice.isWithdrawn) {
      throw new Error('Cannot withdraw a cleared or already withdrawn exit notice');
    }
  }

  const now = new Date().toISOString();
  const request: QuitRequest = {
    id: mockDB.generateId('quit'),
    entityType: params.entityType,
    entityId: params.entityId,
    requestedById: params.userId,
    reason: params.reason,
    status: 'PENDING',
    createdAt: now,
  };
  
  mockDB.quitRequests.push(request);

  if (params.entityType === 'HousingApplication' && application) {
    const appIdx = mockDB.housingApplications.findIndex(a => a.id === application.id);
    mockDB.housingApplications[appIdx] = {
      ...application,
      status: 'QUIT_REQUESTED',
      updatedAt: now,
    };
  }

  return request;
}

export async function reviewQuitRequest(params: {
  quitRequestId: string;
  reviewerId: string;
  decision: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}): Promise<QuitRequest> {
  await delay(500);

  const reqIdx = mockDB.quitRequests.findIndex(q => q.id === params.quitRequestId);
  if (reqIdx === -1) throw new Error('Quit request not found');
  
  const request = mockDB.quitRequests[reqIdx];
  if (request.status !== 'PENDING') throw new Error('Request already processed');

  const now = new Date().toISOString();
  
  mockDB.quitRequests[reqIdx] = {
    ...request,
    status: params.decision,
    reviewedById: params.reviewerId,
    reviewedAt: now,
    reviewNotes: params.reviewNotes,
    updatedAt: now,
  };

  if (request.entityType === 'HousingApplication') {
    const appIdx = mockDB.housingApplications.findIndex(a => a.id === request.entityId);
    if (appIdx !== -1) {
      if (params.decision === 'APPROVED') {
        // Clear allocated unit and expire any pending allocation
        const pendingAllocIdx = mockDB.allocations.findIndex(
          a => a.applicationId === request.entityId && a.status === 'PENDING'
        );
        if (pendingAllocIdx !== -1) {
          mockDB.allocations[pendingAllocIdx] = { ...mockDB.allocations[pendingAllocIdx], status: 'REJECTED', respondedAt: now };
        }
        mockDB.housingApplications[appIdx] = {
          ...mockDB.housingApplications[appIdx],
          status: 'WITHDRAWN',
          allocatedUnitId: null,
          updatedAt: now,
        };
      } else {
        // Rejected quit request — revert to active status based on stage
        const prevStatus = mockDB.housingApplications[appIdx].currentStage === 'HOUSING' ? 'PENDING' : 'UNDER_REVIEW';
        mockDB.housingApplications[appIdx] = {
          ...mockDB.housingApplications[appIdx],
          status: prevStatus,
          updatedAt: now,
        };
      }
    }
  } else if (request.entityType === 'ExitNotice') {
    const exitIdx = mockDB.exitNotices.findIndex(e => e.id === request.entityId);
    if (exitIdx !== -1 && params.decision === 'APPROVED') {
      mockDB.exitNotices[exitIdx] = {
        ...mockDB.exitNotices[exitIdx],
        isWithdrawn: true,
        withdrawnAt: now,
        updatedAt: now,
      };
    }
  }

  return mockDB.quitRequests[reqIdx];
}

export async function adminTerminateApplication(params: {
  applicationId: string;
  adminId: string;
  reason: string;
}): Promise<HousingApplication> {
  await delay(500);

  const appIdx = mockDB.housingApplications.findIndex(a => a.id === params.applicationId);
  if (appIdx === -1) throw new Error('Application not found');
  
  const application = mockDB.housingApplications[appIdx];
  if (['APPROVED', 'REJECTED', 'WITHDRAWN', 'TERMINATED'].includes(application.status)) {
    throw new Error(`Cannot terminate an application in ${application.status} state`);
  }

  const now = new Date().toISOString();

  // Clear allocated unit and expire any pending allocation
  const pendingAllocIdx = mockDB.allocations.findIndex(
    a => a.applicationId === params.applicationId && a.status === 'PENDING'
  );
  if (pendingAllocIdx !== -1) {
    mockDB.allocations[pendingAllocIdx] = { ...mockDB.allocations[pendingAllocIdx], status: 'REJECTED', respondedAt: now };
  }

  mockDB.housingApplications[appIdx] = {
    ...application,
    status: 'TERMINATED',
    allocatedUnitId: null,
    updatedAt: now,
  };

  // Add a review entry to explain the termination
  mockDB.applicationReviews.push({
    id: mockDB.generateId('rev'),
    applicationId: params.applicationId,
    reviewerId: params.adminId,
    reviewerRole: 'SUPER_ADMIN',
    stage: application.currentStage !== 'COMPLETED' ? application.currentStage : 'HOUSING',
    score: null,
    decision: 'REJECTED',
    comments: `Administratively terminated: ${params.reason}`,
    reviewedAt: now,
  });

  return mockDB.housingApplications[appIdx];
}

export async function getQuitRequests(): Promise<QuitRequest[]> {
  await delay(300);
  return [...mockDB.quitRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
