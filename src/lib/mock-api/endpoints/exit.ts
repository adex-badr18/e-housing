// =============================================================================
// Mock API — Exit Notice Endpoint
// Covers: Estate Officer initiation, parallel A/B clearance stages, cascading
//         clearance, grace period management, and administrative termination.
// =============================================================================
// Stage model (post-refactor, Phase 1+):
//   Stage A: Housing Payment Clearance → HOUSING_SECRETARY
//            (parallel with Stage B — no sequential lock between A and B)
//   Stage B: Electrical Fittings Clearance → ELECTRICAL_OFFICER
//            (parallel with Stage A — no sequential lock between A and B)
//   Stage C: Pre-Vacation Site Inspection → ESTATE_OFFICER
//            (unlocked ONLY when both Stage A and Stage B are PASSED)
//
// Grace period: 90 days from submittedAt — universal for ALL exit reasons.
//
// On full clearance (A + B + C all PASSED):
//   1. ExitNotice.isCleared = true, clearedAt = now
//   2. Occupancy → EXITED
//   3. HousingUnit → VACANT, currentOccupantId = null
//   4. All unit BQs → VACANT
//   5. All BQOccupants for those BQs → purged
//   6. StaffProfile.currentHousingStatus → NO_ALLOCATION
//   7. AuditLog entry written
// =============================================================================

import {
  mockDB,
  ExitNotice,
  InspectionStatus,
  Role,
  ExitReason,
  User,
  StaffProfile,
  HousingUnit,
  HousingType,
} from '../db';

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
// Grace Period Helper — universal, applies to ALL exit reasons
// ---------------------------------------------------------------------------

/**
 * Computes the 90-day grace period deadline from a given starting date.
 * Applied universally to every exit notice regardless of reason.
 *
 * @param from - The initiation/submission timestamp (defaults to now)
 * @returns ISO 8601 date string representing submittedAt + 90 calendar days
 */
export function computeGracePeriodDeadline(from: Date = new Date()): string {
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + 90);
  return deadline.toISOString();
}

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
 * Role-filtered exit notices (post Phase 2 refactor):
 *
 * - HOUSING_SECRETARY  : all active (uncleared) notices — Stage A is always open
 * - ELECTRICAL_OFFICER : all active (uncleared) notices — Stage B is always open (parallel to A)
 * - ESTATE_OFFICER     : all notices (active + cleared) — they manage the full lifecycle
 * - DVC_ADMIN          : all notices (active + cleared) — read-only oversight
 * - SUPER_ADMIN        : all notices
 */
export async function getExitNoticesForRole(role: Role): Promise<ExitNotice[]> {
  await delay(300);
  switch (role) {
    case 'HOUSING_SECRETARY':
      // Stage A is always open — return all active (non-cleared) notices
      return mockDB.exitNotices
        .filter(e => !e.isCleared && !e.isAdminTerminated && !e.isWithdrawn)
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    case 'ELECTRICAL_OFFICER':
      // Stage B is parallel to A — return all active (non-cleared) notices
      return mockDB.exitNotices
        .filter(e => !e.isCleared && !e.isAdminTerminated && !e.isWithdrawn)
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    case 'ESTATE_OFFICER':
      // Estate Officer oversees the full lifecycle including cleared notices
      return [...mockDB.exitNotices].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

    case 'DVC_ADMIN':
      // Full read-only access — same visibility as SUPER_ADMIN
      return [...mockDB.exitNotices].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

    case 'SUPER_ADMIN':
      return [...mockDB.exitNotices].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

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

export async function getExitNoticesForUser(userId: string): Promise<ExitNotice[]> {
  await delay(300);
  return [...mockDB.exitNotices]
    .filter(e => e.userId === userId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getExitNoticeWithProfile(id: string): Promise<{
  notice: ExitNotice;
  applicantUser: import('../db').User | null;
  applicantProfile: import('../db').StaffProfile | null;
  unit: import('../db').HousingUnit | null;
} | null> {
  await delay(300);
  const notice = mockDB.exitNotices.find(e => e.id === id);
  if (!notice) return null;
  const applicantUser = mockDB.findUserById(notice.userId) ?? null;
  const applicantProfile = applicantUser
    ? (mockDB.staffProfiles.find(p => p.userId === applicantUser.id) ?? null)
    : null;
  const unit = mockDB.findUnitById(notice.housingUnitId) ?? null;
  return { notice: { ...notice }, applicantUser, applicantProfile, unit };
}

// ---------------------------------------------------------------------------
// Paginated Query with Server-side Search & Filters
// ---------------------------------------------------------------------------

export interface EnrichedExitNoticeRow {
  notice: ExitNotice;
  staffUser: User | null;
  staffProfile: StaffProfile | null;
  unit: HousingUnit | null;
  housingType: HousingType | null;
  daysRemaining: number | null;
}

export interface PaginatedExitNoticesResult {
  notices: EnrichedExitNoticeRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getPaginatedExitNotices(params: {
  role: Role;
  search?: string;
  status?: string;
  reason?: ExitReason | '';
  page?: number;
  limit?: number;
}): Promise<PaginatedExitNoticesResult> {
  await delay(200);

  // 1. Get base notices — full database accessible for unified management and history ledger
  let baseNotices: ExitNotice[] = [...mockDB.exitNotices];

  // 2. Filter by status
  const now = Date.now();
  if (params.status && params.status !== 'ALL') {
    if (params.status === 'ACTIVE') {
      baseNotices = baseNotices.filter(n => !n.isCleared && !n.isAdminTerminated && !n.isWithdrawn);
    } else if (params.status === 'CLEARED') {
      baseNotices = baseNotices.filter(n => n.isCleared);
    } else if (params.status === 'CLOSED') {
      baseNotices = baseNotices.filter(n => n.isAdminTerminated || n.isWithdrawn);
    } else if (params.status === 'OVERDUE') {
      baseNotices = baseNotices.filter(n => {
        if (n.isCleared || n.isAdminTerminated || n.isWithdrawn || !n.gracePeriodDeadline) return false;
        const diff = new Date(n.gracePeriodDeadline).getTime() - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 0;
      });
    } else if (params.status === 'AWAITING_MY_STAGE') {
      baseNotices = baseNotices.filter(n => {
        if (n.isCleared || n.isAdminTerminated || n.isWithdrawn) return false;
        const h = n.housingPaymentStatus ?? n.housingInspectionStatus ?? 'PENDING';
        const e = n.electricalFittingStatus ?? n.electricalInspectionStatus ?? 'PENDING';
        if (params.role === 'HOUSING_SECRETARY') return h === 'PENDING';
        if (params.role === 'ELECTRICAL_OFFICER') return e === 'PENDING';
        if (params.role === 'ESTATE_OFFICER') return h === 'PASSED' && e === 'PASSED' && n.estateInspectionStatus === 'PENDING';
        return false;
      });
    }
  }

  // 3. Filter by exit reason
  if (params.reason) {
    baseNotices = baseNotices.filter(n => n.reason === params.reason);
  }

  // 4. Enrich & search
  const query = (params.search ?? '').trim().toLowerCase();
  const enriched: EnrichedExitNoticeRow[] = baseNotices.map(notice => {
    const staffUser = mockDB.findUserById(notice.userId) ?? null;
    const staffProfile = staffUser
      ? (mockDB.staffProfiles.find(p => p.userId === staffUser.id) ?? null)
      : null;
    const unit = mockDB.findUnitById(notice.housingUnitId) ?? null;
    const housingType = unit
      ? (mockDB.housingTypes.find(t => t.id === unit.housingTypeId) ?? null)
      : null;
    const daysRemaining = notice.gracePeriodDeadline
      ? Math.ceil((new Date(notice.gracePeriodDeadline).getTime() - now) / (1000 * 60 * 60 * 24))
      : null;

    return { notice, staffUser, staffProfile, unit, housingType, daysRemaining };
  });

  const searched = query
    ? enriched.filter(({ notice, staffUser, staffProfile, unit }) => {
        const fullName = staffUser ? `${staffUser.firstName} ${staffUser.lastName}`.toLowerCase() : '';
        const email = staffUser?.email?.toLowerCase() ?? '';
        const staffId = staffProfile?.staffId?.toLowerCase() ?? '';
        const dept = staffProfile?.department?.toLowerCase() ?? '';
        const rank = staffProfile?.rank?.toLowerCase() ?? '';
        const unitName = unit?.name?.toLowerCase() ?? '';
        const houseNumber = unit?.houseNumber?.toLowerCase() ?? '';
        const roadNumber = unit?.roadNumber?.toLowerCase() ?? '';
        const reason = notice.reason?.toLowerCase() ?? '';
        const customReason = notice.customReason?.toLowerCase() ?? '';
        const notes = notice.additionalNotes?.toLowerCase() ?? '';

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          staffId.includes(query) ||
          dept.includes(query) ||
          rank.includes(query) ||
          unitName.includes(query) ||
          houseNumber.includes(query) ||
          roadNumber.includes(query) ||
          reason.includes(query) ||
          customReason.includes(query) ||
          notes.includes(query)
        );
      })
    : enriched;

  // 5. Default sorting: Active urgent first (earliest deadline), then submittedAt desc
  searched.sort((a, b) => {
    const aActive = !a.notice.isCleared && !a.notice.isAdminTerminated && !a.notice.isWithdrawn;
    const bActive = !b.notice.isCleared && !b.notice.isAdminTerminated && !b.notice.isWithdrawn;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    if (aActive && bActive) {
      const dA = a.daysRemaining ?? 9999;
      const dB = b.daysRemaining ?? 9999;
      if (dA !== dB) return dA - dB;
    }
    return new Date(b.notice.submittedAt).getTime() - new Date(a.notice.submittedAt).getTime();
  });

  // 6. Pagination
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(100, params.limit ?? 10));
  const total = searched.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = searched.slice(startIndex, startIndex + limit);

  return {
    notices: paginatedItems,
    total,
    page,
    limit,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Step 6 — Estate Officer: Initiate Exit Notice
// ---------------------------------------------------------------------------

/**
 * Creates a new exit notice on behalf of an occupant.
 * Only ESTATE_OFFICER (or SUPER_ADMIN) may call this function.
 *
 * The occupant must physically visit the Estate Office; the officer
 * opens the occupant’s occupancy record and fills in the initiation form.
 *
 * Grace period: universally set to submittedAt + 90 days for all exit reasons.
 */
export async function estateOfficerInitiateExit(params: {
  /** ID of the Estate Officer (or Super Admin) initiating the exit. */
  initiatedByUserId: string;
  initiatedByRole: Role;
  /** FK → Occupancy (the active occupancy record for the outgoing occupant). */
  occupancyId: string;
  reason: ExitNotice['reason'];
  customReason?: string;
  additionalNotes?: string;
}): Promise<ExitNotice> {
  await delay(600);

  // ---- Role gate ----
  if (params.initiatedByRole !== 'ESTATE_OFFICER' && params.initiatedByRole !== 'SUPER_ADMIN') {
    throw new Error('Only Estate Officers can initiate an exit notice');
  }

  // ---- Resolve occupancy ----
  const occupancy = mockDB.occupancies.find(o => o.id === params.occupancyId);
  if (!occupancy) throw new Error('Occupancy record not found');
  if (occupancy.status !== 'ACTIVE') {
    throw new Error('Only ACTIVE occupancies can have an exit initiated');
  }

  // ---- Prevent duplicate active exit notices for the same occupant ----
  const existing = mockDB.findActiveExitNoticeByUserId(occupancy.userId);
  if (existing) {
    throw new Error('This occupant already has an active exit notice in progress');
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const notice: ExitNotice = {
    id: mockDB.generateId('exit'),
    userId: occupancy.userId,
    housingUnitId: occupancy.housingUnitId,
    reason: params.reason,
    customReason: params.customReason ?? null,
    additionalNotes: params.additionalNotes ?? null,

    // ---- Initiation metadata ----
    initiatedByUserId: params.initiatedByUserId,

    // ---- Grace period — universal: submittedAt + 90 days ----
    gracePeriodDeadline: computeGracePeriodDeadline(now),

    // ---- Stage A: Housing Payment Clearance (always open) ----
    housingPaymentStatus: 'PENDING',
    housingPaymentClearedById: null,
    housingPaymentClearedAt: null,
    // @deprecated aliases — kept for backward-compat until Phase 6 cleanup
    housingInspectionStatus: 'PENDING',
    housingInspectedById: null,
    housingInspectionDate: null,

    // ---- Stage B: Electrical Fittings Clearance (always open, parallel to A) ----
    electricalFittingStatus: 'PENDING',
    electricalFittingClearedById: null,
    electricalFittingClearedAt: null,
    // @deprecated aliases
    electricalInspectionStatus: 'PENDING',
    electricalInspectedById: null,
    electricalInspectionDate: null,

    // ---- Stage C: Pre-Vacation Site Inspection (locked until A + B pass) ----
    estateInspectionStatus: 'PENDING',
    estateInspectedById: null,
    estateInspectionDate: null,
    estateInspectionNotes: null,

    isCleared: false,
    clearedAt: null,
    clearanceCertificateUrl: null,

    submittedAt: nowIso,
    updatedAt: nowIso,
  };

  mockDB.exitNotices.push(notice);

  // ---- Audit log ----
  mockDB.writeAuditLog({
    actorId: params.initiatedByUserId,
    action: 'EXIT_NOTICE_INITIATED',
    entityType: 'ExitNotice',
    entityId: notice.id,
    status: 'SUCCESS',
    metadata: {
      occupancyId: params.occupancyId,
      staffUserId: occupancy.userId,
      housingUnitId: occupancy.housingUnitId,
      reason: params.reason,
      gracePeriodDeadline: notice.gracePeriodDeadline,
    },
  });

  return notice;
}

// ---------------------------------------------------------------------------
// Legacy: Staff-submitted exit notice (DEPRECATED — remove in Phase 6)
// ---------------------------------------------------------------------------

/**
 * @deprecated Staff can no longer self-initiate exits.
 * Use estateOfficerInitiateExit() instead.
 * Retained only to avoid breaking existing call sites during the
 * Phase 1→2 transition; will be removed in Phase 6.
 */

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

    // New canonical fields (Phase 1)
    housingPaymentStatus: 'PENDING',
    housingPaymentClearedById: null,
    housingPaymentClearedAt: null,

    // @deprecated — kept for backward-compat until Phase 6 cleanup
    housingInspectionStatus: 'PENDING',
    housingInspectedById: null,
    housingInspectionDate: null,

    // New canonical fields (Phase 1)
    electricalFittingStatus: 'PENDING',
    electricalFittingClearedById: null,
    electricalFittingClearedAt: null,

    // @deprecated — kept for backward-compat until Phase 6 cleanup
    electricalInspectionStatus: 'PENDING',
    electricalInspectedById: null,
    electricalInspectionDate: null,

    estateInspectionStatus: 'PENDING',
    estateInspectedById: null,
    estateInspectionDate: null,
    estateInspectionNotes: null,

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
// Step 7 — Management: Update Inspection Stage (refactored)
// ---------------------------------------------------------------------------

export async function updateExitInspection(params: {
  exitNoticeId: string;
  stage: InspectionStage;
  inspectorId: string;
  inspectorRole: Role;
  result: Extract<InspectionStatus, 'PASSED' | 'FAILED'>;
  /** On-site observations — stored only for the ESTATE stage. */
  inspectionNotes?: string;
}): Promise<ExitNotice> {
  await delay(600);

  const noticeIdx = mockDB.exitNotices.findIndex(e => e.id === params.exitNoticeId);
  if (noticeIdx === -1) throw new Error('Exit notice not found');
  const notice = mockDB.exitNotices[noticeIdx];

  if (notice.isCleared) {
    throw new Error('This exit has already been cleared — no further updates allowed');
  }
  if (notice.isAdminTerminated) {
    throw new Error('This exit notice has been administratively terminated');
  }

  // ---- Role gate ----
  const requiredRole = stageRoleMap[params.stage];
  if (params.inspectorRole !== requiredRole && params.inspectorRole !== 'SUPER_ADMIN') {
    throw new Error(`Only ${requiredRole} can update the ${params.stage} stage`);
  }

  // ---- Stage gate: only Stage C (ESTATE) is locked; A and B are always open ----
  if (params.stage === 'ESTATE') {
    const housingOk = (notice.housingPaymentStatus ?? notice.housingInspectionStatus) === 'PASSED';
    const electricalOk = (notice.electricalFittingStatus ?? notice.electricalInspectionStatus) === 'PASSED';
    if (!housingOk || !electricalOk) {
      throw new Error(
        'Both Housing Payment Clearance and Electrical Fittings Clearance must be PASSED ' +
        'before the Pre-Vacation Site Inspection can be submitted'
      );
    }
  }
  // NOTE: No gate for HOUSING or ELECTRICAL — they run in parallel.
  // Re-submission (FAILED → PASSED) is allowed for the same authorised role;
  // no additional guard needed as the role gate above is sufficient.

  const now = new Date().toISOString();
  const updated: ExitNotice = { ...notice, updatedAt: now };

  if (params.stage === 'HOUSING') {
    // Write to both canonical and deprecated alias fields
    updated.housingPaymentStatus     = params.result;
    updated.housingPaymentClearedById = params.inspectorId;
    updated.housingPaymentClearedAt  = now;
    updated.housingInspectionStatus  = params.result;   // @deprecated alias
    updated.housingInspectedById     = params.inspectorId;
    updated.housingInspectionDate    = now;
  } else if (params.stage === 'ELECTRICAL') {
    // Write to both canonical and deprecated alias fields
    updated.electricalFittingStatus      = params.result;
    updated.electricalFittingClearedById  = params.inspectorId;
    updated.electricalFittingClearedAt   = now;
    updated.electricalInspectionStatus   = params.result;   // @deprecated alias
    updated.electricalInspectedById      = params.inspectorId;
    updated.electricalInspectionDate     = now;
  } else {
    // ESTATE stage — also stores the officer’s on-site observations
    updated.estateInspectionStatus  = params.result;
    updated.estateInspectedById     = params.inspectorId;
    updated.estateInspectionDate    = now;
    if (params.inspectionNotes !== undefined) {
      updated.estateInspectionNotes = params.inspectionNotes;
    }
  }

  mockDB.exitNotices[noticeIdx] = updated;

  // ---- Determine the audit action label ----
  const auditAction =
    params.stage === 'HOUSING'     ? 'EXIT_HOUSING_CLEARANCE_UPDATED'
    : params.stage === 'ELECTRICAL' ? 'EXIT_ELECTRICAL_CLEARANCE_UPDATED'
    :                                  'EXIT_ESTATE_INSPECTION_UPDATED';

  mockDB.writeAuditLog({
    actorId: params.inspectorId,
    action: auditAction,
    entityType: 'ExitNotice',
    entityId: params.exitNoticeId,
    status: 'SUCCESS',
    metadata: { stage: params.stage, result: params.result },
  });

  // ---- Check if all three stages are now PASSED → trigger cascade ----
  const latestNotice = mockDB.exitNotices[noticeIdx];
  const housingPassed     = (latestNotice.housingPaymentStatus     ?? latestNotice.housingInspectionStatus)     === 'PASSED';
  const electricalPassed  = (latestNotice.electricalFittingStatus  ?? latestNotice.electricalInspectionStatus)  === 'PASSED';
  const estatePassed      = latestNotice.estateInspectionStatus === 'PASSED';

  if (housingPassed && electricalPassed && estatePassed) {
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

// ---------------------------------------------------------------------------
// Step 8 — Grace Period Extension
// ---------------------------------------------------------------------------

/**
 * Extends the grace period deadline on an active exit notice.
 * Only ESTATE_OFFICER and SUPER_ADMIN may call this.
 *
 * The additionalDays are added to the **current** gracePeriodDeadline
 * (not to today), preserving any prior extensions.
 */
export async function extendGracePeriod(params: {
  exitNoticeId: string;
  additionalDays: number;
  reason: string;
  extendedByUserId: string;
  extendedByRole: Role;
}): Promise<ExitNotice> {
  await delay(400);

  // ---- Role gate ----
  if (params.extendedByRole !== 'ESTATE_OFFICER' && params.extendedByRole !== 'SUPER_ADMIN') {
    throw new Error('Only Estate Officers can extend the grace period');
  }

  const noticeIdx = mockDB.exitNotices.findIndex(e => e.id === params.exitNoticeId);
  if (noticeIdx === -1) throw new Error('Exit notice not found');

  const notice = mockDB.exitNotices[noticeIdx];
  if (notice.isCleared) {
    throw new Error('Cannot extend the grace period on a cleared exit notice');
  }
  if (notice.isAdminTerminated || notice.isWithdrawn) {
    throw new Error('Cannot extend the grace period on a terminated or withdrawn exit notice');
  }

  // Add additionalDays to the current gracePeriodDeadline
  const currentDeadline = notice.gracePeriodDeadline
    ? new Date(notice.gracePeriodDeadline)
    : new Date(notice.submittedAt);
  currentDeadline.setDate(currentDeadline.getDate() + params.additionalDays);
  const newDeadline = currentDeadline.toISOString();

  const now = new Date().toISOString();
  const previousExtensionDays = notice.gracePeriodExtensionDays ?? 0;

  mockDB.exitNotices[noticeIdx] = {
    ...notice,
    gracePeriodDeadline: newDeadline,
    gracePeriodExtended: true,
    gracePeriodExtensionDays: previousExtensionDays + params.additionalDays,
    gracePeriodExtensionReason: params.reason,
    updatedAt: now,
  };

  mockDB.writeAuditLog({
    actorId: params.extendedByUserId,
    action: 'EXIT_GRACE_PERIOD_EXTENDED',
    entityType: 'ExitNotice',
    entityId: params.exitNoticeId,
    status: 'SUCCESS',
    metadata: {
      additionalDays: params.additionalDays,
      newDeadline,
      reason: params.reason,
    },
  });

  return mockDB.exitNotices[noticeIdx];
}

// ---------------------------------------------------------------------------
// Step 9 — Administrative Termination (refactored)
// ---------------------------------------------------------------------------

/**
 * Estate Officer or Super Admin administratively closes an exit notice.
 * Uses the new isAdminTerminated fields instead of overloading isWithdrawn.
 * isWithdrawn is now reserved exclusively for staff QuitRequest approvals.
 */
export async function adminTerminateExitNotice(params: {
  exitNoticeId: string;
  adminId: string;
  adminRole: Role;
  reason: string;
}): Promise<ExitNotice> {
  await delay(500);

  // ---- Role gate ----
  if (params.adminRole !== 'ESTATE_OFFICER' && params.adminRole !== 'SUPER_ADMIN') {
    throw new Error('Only Estate Officers or Super Admins can administratively terminate an exit notice');
  }

  const noticeIdx = mockDB.exitNotices.findIndex(e => e.id === params.exitNoticeId);
  if (noticeIdx === -1) throw new Error('Exit notice not found');

  const notice = mockDB.exitNotices[noticeIdx];
  if (notice.isCleared) {
    throw new Error('Cannot terminate an exit notice that has already been cleared');
  }
  if (notice.isAdminTerminated) {
    throw new Error('This exit notice has already been administratively terminated');
  }
  if (notice.isWithdrawn) {
    throw new Error('Cannot terminate a notice that has already been withdrawn by the occupant');
  }

  const now = new Date().toISOString();
  mockDB.exitNotices[noticeIdx] = {
    ...notice,
    // New dedicated termination fields (distinct from staff withdrawal)
    isAdminTerminated: true,
    adminTerminatedById: params.adminId,
    adminTerminatedAt: now,
    adminTerminatedReason: params.reason,
    updatedAt: now,
  };

  mockDB.writeAuditLog({
    actorId: params.adminId,
    action: 'EXIT_NOTICE_ADMIN_TERMINATED',
    entityType: 'ExitNotice',
    entityId: params.exitNoticeId,
    status: 'SUCCESS',
    metadata: { reason: params.reason },
  });

  return mockDB.exitNotices[noticeIdx];
}

// ---------------------------------------------------------------------------
// Audit Log Query
// ---------------------------------------------------------------------------

/**
 * Returns all audit log entries for a specific exit notice,
 * sorted newest-first.
 *
 * Accessible to: ESTATE_OFFICER | DVC_ADMIN | SUPER_ADMIN
 */
export async function getExitNoticeAuditLog(
  exitNoticeId: string,
  requesterRole: Role
): Promise<import('../db').AuditLog[]> {
  await delay(200);

  if (
    requesterRole !== 'ESTATE_OFFICER' &&
    requesterRole !== 'DVC_ADMIN' &&
    requesterRole !== 'SUPER_ADMIN'
  ) {
    throw new Error('Access denied: audit logs are restricted to Estate Officers, DVC Admin, and Super Admins');
  }

  return mockDB.auditLogs
    .filter(log => log.entityType === 'ExitNotice' && log.entityId === exitNoticeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
