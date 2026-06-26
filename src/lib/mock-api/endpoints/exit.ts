// =============================================================================
// Mock API — Exit Notice Endpoint
// Covers: exit submission, 3-stage inspection pipeline, cascading clearance
// =============================================================================
// Sequential inspection rules (PRD §3.10, DATA_MODEL §Workflow Rules):
//   Stage 1: Housing inspection  → HOUSING_SECRETARY
//   Stage 2: Electrical inspection → ELECTRICAL_OFFICER (unlocked after Stage 1 PASSED)
//   Stage 3: Estate inspection   → ESTATE_OFFICER (unlocked after Stage 2 PASSED)
//
// On full clearance (all three PASSED):
//   1. ExitNotice.isCleared = true, clearedAt = now
//   2. Occupancy → EXITED
//   3. HousingUnit → VACANT, currentOccupantId = null
//   4. All unit BQs → VACANT
//   5. All BQOccupants for those BQs → purged
//   6. StaffProfile.currentHousingStatus → NO_ALLOCATION
//   7. AuditLog entry written
// =============================================================================

import { mockDB, ExitNotice, InspectionStatus, Role } from '../db';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Type for stage-specific inspection update payloads
// ---------------------------------------------------------------------------

type InspectionStage = 'HOUSING' | 'ELECTRICAL' | 'ESTATE';

const stageRoleMap: Record<InspectionStage, Role> = {
  HOUSING: 'HOUSING_SECRETARY',
  ELECTRICAL: 'ELECTRICAL_OFFICER',
  ESTATE: 'ESTATE_OFFICER',
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAllExitNotices(): Promise<ExitNotice[]> {
  await delay(300);
  return [...mockDB.exitNotices].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

/**
 * Role-filtered exit notices:
 *  - HOUSING_SECRETARY: all submitted notices (stage 1 queue)
 *  - ELECTRICAL_OFFICER: notices where housing = PASSED (stage 2 queue)
 *  - ESTATE_OFFICER: notices where housing + electrical = PASSED (stage 3 queue)
 *  - SUPER_ADMIN: all
 */
export async function getExitNoticesForRole(role: Role): Promise<ExitNotice[]> {
  await delay(300);
  switch (role) {
    case 'HOUSING_SECRETARY':
      return mockDB.exitNotices.filter(e => !e.isCleared);
    case 'ELECTRICAL_OFFICER':
      return mockDB.exitNotices.filter(
        e => e.housingInspectionStatus === 'PASSED' && !e.isCleared
      );
    case 'ESTATE_OFFICER':
      return mockDB.exitNotices.filter(
        e =>
          e.housingInspectionStatus === 'PASSED' &&
          e.electricalInspectionStatus === 'PASSED' &&
          !e.isCleared
      );
    case 'SUPER_ADMIN':
      return [...mockDB.exitNotices];
    default:
      return [];
  }
}

export async function getExitNoticeById(id: string): Promise<ExitNotice | null> {
  await delay(200);
  return mockDB.exitNotices.find(e => e.id === id) ?? null;
}

export async function getActiveExitNoticeForUser(userId: string): Promise<ExitNotice | null> {
  await delay(200);
  return mockDB.findActiveExitNoticeByUserId(userId) ?? null;
}

// ---------------------------------------------------------------------------
// Staff: Submit Exit Notice
// ---------------------------------------------------------------------------

export async function submitExitNotice(params: {
  userId: string;
  housingUnitId: string;
  reason: ExitNotice['reason'];
  customReason?: string;
  additionalNotes?: string;
}): Promise<ExitNotice> {
  await delay(600);

  // User must have an active occupancy for the given unit
  const occupancy = mockDB.findActiveOccupancyByUserId(params.userId);
  if (!occupancy) {
    throw new Error('You do not have an active housing occupancy to exit from');
  }
  if (occupancy.housingUnitId !== params.housingUnitId) {
    throw new Error('The specified housing unit does not match your current occupancy');
  }

  // Prevent duplicate active exit notices
  const existing = mockDB.findActiveExitNoticeByUserId(params.userId);
  if (existing) {
    throw new Error('You already have an active exit notice in progress');
  }

  const now = new Date().toISOString();
  const notice: ExitNotice = {
    id: mockDB.generateId('exit'),
    userId: params.userId,
    housingUnitId: params.housingUnitId,
    reason: params.reason,
    customReason: params.customReason ?? null,
    additionalNotes: params.additionalNotes ?? null,

    housingInspectionStatus: 'PENDING',
    housingInspectedById: null,
    housingInspectionDate: null,

    electricalInspectionStatus: 'PENDING',
    electricalInspectedById: null,
    electricalInspectionDate: null,

    estateInspectionStatus: 'PENDING',
    estateInspectedById: null,
    estateInspectionDate: null,

    isCleared: false,
    clearedAt: null,
    clearanceCertificateUrl: null,

    submittedAt: now,
    updatedAt: now,
  };
  mockDB.exitNotices.push(notice);
  return notice;
}

// ---------------------------------------------------------------------------
// Management: Update Inspection Stage
// ---------------------------------------------------------------------------

export async function updateExitInspection(params: {
  exitNoticeId: string;
  stage: InspectionStage;
  inspectorId: string;
  inspectorRole: Role;
  result: Extract<InspectionStatus, 'PASSED' | 'FAILED'>;
}): Promise<ExitNotice> {
  await delay(600);

  const noticeIdx = mockDB.exitNotices.findIndex(e => e.id === params.exitNoticeId);
  if (noticeIdx === -1) throw new Error('Exit notice not found');
  const notice = mockDB.exitNotices[noticeIdx];

  if (notice.isCleared) {
    throw new Error('This exit has already been cleared — no further updates allowed');
  }

  // ---- Role gate ----
  const requiredRole = stageRoleMap[params.stage];
  if (params.inspectorRole !== requiredRole && params.inspectorRole !== 'SUPER_ADMIN') {
    throw new Error(`Only ${requiredRole} can update the ${params.stage} inspection`);
  }

  // ---- Sequential stage gate ----
  if (params.stage === 'ELECTRICAL' && notice.housingInspectionStatus !== 'PASSED') {
    throw new Error('Housing inspection must be PASSED before Electrical inspection can proceed');
  }
  if (
    params.stage === 'ESTATE' &&
    (notice.housingInspectionStatus !== 'PASSED' || notice.electricalInspectionStatus !== 'PASSED')
  ) {
    throw new Error('Both Housing and Electrical inspections must be PASSED before Estate inspection can proceed');
  }

  const now = new Date().toISOString();
  const updated: ExitNotice = { ...notice, updatedAt: now };

  if (params.stage === 'HOUSING') {
    updated.housingInspectionStatus = params.result;
    updated.housingInspectedById = params.inspectorId;
    updated.housingInspectionDate = now;
  } else if (params.stage === 'ELECTRICAL') {
    updated.electricalInspectionStatus = params.result;
    updated.electricalInspectedById = params.inspectorId;
    updated.electricalInspectionDate = now;
  } else {
    updated.estateInspectionStatus = params.result;
    updated.estateInspectedById = params.inspectorId;
    updated.estateInspectionDate = now;
  }

  mockDB.exitNotices[noticeIdx] = updated;

  // ---- Check if all three stages are now PASSED → trigger cascade ----
  if (
    updated.housingInspectionStatus === 'PASSED' &&
    updated.electricalInspectionStatus === 'PASSED' &&
    updated.estateInspectionStatus === 'PASSED'
  ) {
    await finalizeExitClearance(params.exitNoticeId, params.inspectorId);
  }

  return mockDB.exitNotices[noticeIdx];
}

// ---------------------------------------------------------------------------
// Internal: Cascading Clearance Logic
// ---------------------------------------------------------------------------

/**
 * Called internally when all 3 inspections PASS.
 * Executes the full cascade:
 *   ExitNotice → cleared
 *   Occupancy  → EXITED
 *   HousingUnit → VACANT
 *   BQs → VACANT
 *   BQOccupants → purged
 *   StaffProfile → NO_ALLOCATION
 *   AuditLog → written
 */
async function finalizeExitClearance(exitNoticeId: string, clearedByActorId: string) {
  const noticeIdx = mockDB.exitNotices.findIndex(e => e.id === exitNoticeId);
  if (noticeIdx === -1) return;
  const notice = mockDB.exitNotices[noticeIdx];

  const now = new Date().toISOString();
  const certUrl = `/documents/clearance/${exitNoticeId}-certificate.pdf`;

  // 1. Mark the exit notice as cleared
  mockDB.exitNotices[noticeIdx] = {
    ...notice,
    isCleared: true,
    clearedAt: now,
    clearanceCertificateUrl: certUrl,
    updatedAt: now,
  };

  // 2. Mark the active occupancy as EXITED
  const occIdx = mockDB.occupancies.findIndex(
    o => o.userId === notice.userId && o.housingUnitId === notice.housingUnitId && o.status === 'ACTIVE'
  );
  if (occIdx !== -1) {
    mockDB.occupancies[occIdx] = {
      ...mockDB.occupancies[occIdx],
      status: 'EXITED',
      checkOutDate: now.split('T')[0],
      updatedAt: now,
    };
  }

  // 3. Reset the housing unit to VACANT
  const unitIdx = mockDB.housingUnits.findIndex(u => u.id === notice.housingUnitId);
  if (unitIdx !== -1) {
    mockDB.housingUnits[unitIdx] = {
      ...mockDB.housingUnits[unitIdx],
      status: 'VACANT',
      currentOccupantId: null,
      updatedAt: now,
    };
  }

  // 4. Reset all BQs in the unit to VACANT
  const unitBQIds: string[] = [];
  mockDB.bqs = mockDB.bqs.map(bq => {
    if (bq.housingUnitId === notice.housingUnitId) {
      unitBQIds.push(bq.id);
      return { ...bq, status: 'VACANT' as const, updatedAt: now };
    }
    return bq;
  });

  // 5. Purge all BQ occupants attached to those BQs
  const purgedCount = mockDB.bqOccupants.filter(o => unitBQIds.includes(o.bqId)).length;
  mockDB.bqOccupants = mockDB.bqOccupants.filter(o => !unitBQIds.includes(o.bqId));

  // 6. Update the staff profile housing status
  const profileIdx = mockDB.staffProfiles.findIndex(p => p.userId === notice.userId);
  if (profileIdx !== -1) {
    mockDB.staffProfiles[profileIdx] = {
      ...mockDB.staffProfiles[profileIdx],
      currentHousingStatus: 'NO_ALLOCATION',
      updatedAt: now,
    };
  }

  // 7. Write cascade audit log
  mockDB.writeAuditLog({
    actorId: clearedByActorId,
    action: 'EXIT_CLEARANCE_FINALIZED',
    entityType: 'ExitNotice',
    entityId: exitNoticeId,
    status: 'SUCCESS',
    metadata: {
      userId: notice.userId,
      housingUnitId: notice.housingUnitId,
      bqsReset: unitBQIds.length,
      bqOccupantsPurged: purgedCount,
      clearanceCertificateUrl: certUrl,
    },
  });
}
