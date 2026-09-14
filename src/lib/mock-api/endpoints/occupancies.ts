// =============================================================================
// Mock API — Occupancies Endpoint
// Covers: list (paginated, filtered, searched), details, revoke, trigger exit, update
// =============================================================================

import {
  mockDB,
  Occupancy,
  OccupancyStatus,
  ExitReason,
  HousingUnit,
  HousingType,
  User,
  StaffProfile,
  TenancyAgreement,
  Allocation,
  ExitNotice,
  BQ,
  BQOccupant,
} from '../db';

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Enriched Occupancy Row — used in list view
// ---------------------------------------------------------------------------

export interface OccupancyRow {
  occupancy: Occupancy;
  user: User | null;
  profile: StaffProfile | null;
  unit: HousingUnit | null;
  housingType: HousingType | null;
  tenancyAgreement: TenancyAgreement | null;
}

// ---------------------------------------------------------------------------
// Enriched Occupancy Details — used in detail view
// ---------------------------------------------------------------------------

export interface OccupancyDetails {
  occupancy: Occupancy;
  user: User | null;
  profile: StaffProfile | null;
  unit: HousingUnit | null;
  housingType: HousingType | null;
  tenancyAgreement: TenancyAgreement | null;
  allocation: Allocation | null;
  exitNotices: ExitNotice[];
  bqs: BQ[];
  bqOccupants: BQOccupant[];
}

// ---------------------------------------------------------------------------
// Paginated list params
// ---------------------------------------------------------------------------

export interface GetPaginatedOccupanciesParams {
  search?: string;
  status?: OccupancyStatus | '';
  housingTypeId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOccupanciesResult {
  data: OccupancyRow[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

export interface OccupancyStats {
  total: number;
  active: number;
  exited: number;
  bqCount: number;
}

// ===========================================================================
// QUERIES
// ===========================================================================

/** Get summary counts for the list page header stats */
export async function getOccupancyStats(): Promise<OccupancyStats> {
  await delay(100);
  const total = mockDB.occupancies.length;
  const active = mockDB.occupancies.filter(o => o.status === 'ACTIVE').length;
  const exited = mockDB.occupancies.filter(o => o.status === 'EXITED').length;
  // Count distinct units that have BQs and currently have active occupancy
  const activeUnitIds = mockDB.occupancies
    .filter(o => o.status === 'ACTIVE')
    .map(o => o.housingUnitId);
  const bqCount = mockDB.bqs.filter(b => activeUnitIds.includes(b.housingUnitId)).length;
  return { total, active, exited, bqCount };
}

/** Server-side paginated + filtered + searched occupancy list */
export async function getPaginatedOccupancies(
  params: GetPaginatedOccupanciesParams
): Promise<PaginatedOccupanciesResult> {
  await delay(300);

  const { search = '', status = '', housingTypeId = '', page = 1, limit = 10 } = params;
  const lowerSearch = search.toLowerCase().trim();

  // 1. Build enriched rows
  let rows: OccupancyRow[] = mockDB.occupancies.map(occ => {
    const user = mockDB.findUserById(occ.userId) ?? null;
    const profile = user ? (mockDB.staffProfiles.find(p => p.userId === user.id) ?? null) : null;
    const unit = mockDB.findUnitById(occ.housingUnitId) ?? null;
    const housingType = unit ? (mockDB.housingTypes.find(t => t.id === unit.housingTypeId) ?? null) : null;
    const tenancyAgreement = mockDB.tenancyAgreements.find(t => t.occupancyId === occ.id) ?? null;
    return { occupancy: occ, user, profile, unit, housingType, tenancyAgreement };
  });

  // 2. Filter by status
  if (status) {
    rows = rows.filter(r => r.occupancy.status === status);
  }

  // 3. Filter by housing type
  if (housingTypeId) {
    rows = rows.filter(r => r.unit?.housingTypeId === housingTypeId);
  }

  // 4. Filter by search query
  if (lowerSearch) {
    rows = rows.filter(r => {
      const fullName = `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.toLowerCase();
      const staffId = (r.profile?.staffId ?? '').toLowerCase();
      const department = (r.profile?.department ?? '').toLowerCase();
      const unitName = (r.unit?.name ?? '').toLowerCase();
      const houseNumber = (r.unit?.houseNumber ?? '').toLowerCase();
      const roadNumber = (r.unit?.roadNumber ?? '').toLowerCase();
      const typeName = (r.housingType?.name ?? '').toLowerCase();
      return (
        fullName.includes(lowerSearch) ||
        staffId.includes(lowerSearch) ||
        department.includes(lowerSearch) ||
        unitName.includes(lowerSearch) ||
        houseNumber.includes(lowerSearch) ||
        roadNumber.includes(lowerSearch) ||
        typeName.includes(lowerSearch)
      );
    });
  }

  // 5. Sort: most recent check-in first
  rows.sort((a, b) => {
    const aDate = new Date(a.occupancy.checkInDate).getTime();
    const bDate = new Date(b.occupancy.checkInDate).getTime();
    return bDate - aDate;
  });

  // 6. Paginate
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const data = rows.slice(start, start + limit);

  return { data, total, page: safePage, totalPages, limit };
}

/** Get full occupancy details by occupancy ID */
export async function getOccupancyDetails(id: string): Promise<OccupancyDetails | null> {
  await delay(300);

  const occupancy = mockDB.occupancies.find(o => o.id === id);
  if (!occupancy) return null;

  const user = mockDB.findUserById(occupancy.userId) ?? null;
  const profile = user ? (mockDB.staffProfiles.find(p => p.userId === user.id) ?? null) : null;
  const unit = mockDB.findUnitById(occupancy.housingUnitId) ?? null;
  const housingType = unit ? (mockDB.housingTypes.find(t => t.id === unit.housingTypeId) ?? null) : null;
  const tenancyAgreement = mockDB.tenancyAgreements.find(t => t.occupancyId === occupancy.id) ?? null;

  // Find the allocation that created this occupancy (by user + unit, ACCEPTED)
  const allocation =
    mockDB.allocations.find(
      a => a.userId === occupancy.userId && a.housingUnitId === occupancy.housingUnitId && a.status === 'ACCEPTED'
    ) ?? null;

  // All exit notices for this occupant + unit
  const exitNotices = mockDB.exitNotices.filter(
    e => e.userId === occupancy.userId && e.housingUnitId === occupancy.housingUnitId
  );

  // BQs and BQ occupants for this unit
  const bqs = mockDB.getBQsForUnit(occupancy.housingUnitId);
  const bqOccupants = bqs.flatMap(bq => mockDB.getBQOccupantsForBQ(bq.id));

  return {
    occupancy,
    user,
    profile,
    unit,
    housingType,
    tenancyAgreement,
    allocation,
    exitNotices,
    bqs,
    bqOccupants,
  };
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

/** Revoke an active occupancy — frees the unit, resets staff housing status */
export async function revokeOccupancy(params: {
  occupancyId: string;
  reason: string;
}): Promise<Occupancy> {
  await delay(600);

  const idx = mockDB.occupancies.findIndex(o => o.id === params.occupancyId);
  if (idx === -1) throw new Error('Occupancy record not found');

  const occ = mockDB.occupancies[idx];
  if (occ.status !== 'ACTIVE') {
    throw new Error('Only ACTIVE occupancies can be revoked');
  }

  const now = new Date().toISOString();

  // 1. Mark occupancy as EXITED
  mockDB.occupancies[idx] = {
    ...occ,
    status: 'EXITED',
    checkOutDate: now.split('T')[0],
    updatedAt: now,
  };

  // 2. Free the housing unit
  const unitIdx = mockDB.housingUnits.findIndex(u => u.id === occ.housingUnitId);
  if (unitIdx !== -1) {
    mockDB.housingUnits[unitIdx] = {
      ...mockDB.housingUnits[unitIdx],
      status: 'VACANT',
      currentOccupantId: null,
      updatedAt: now,
    };
  }

  // 3. Reset staff profile housing status
  const profileIdx = mockDB.staffProfiles.findIndex(p => p.userId === occ.userId);
  if (profileIdx !== -1) {
    mockDB.staffProfiles[profileIdx] = {
      ...mockDB.staffProfiles[profileIdx],
      currentHousingStatus: 'NO_ALLOCATION',
      updatedAt: now,
    };
  }

  return mockDB.occupancies[idx];
}

/** Estate Officer: Trigger exit for an occupant (creates ExitNotice) */
export async function triggerOccupantExit(params: {
  occupancyId: string;
  reason: ExitReason;
  customReason?: string;
  additionalNotes?: string;
}): Promise<ExitNotice> {
  await delay(600);

  const occ = mockDB.occupancies.find(o => o.id === params.occupancyId);
  if (!occ) throw new Error('Occupancy record not found');
  if (occ.status !== 'ACTIVE') throw new Error('Only ACTIVE occupancies can have an exit triggered');

  // Check no existing active exit notice
  const existing = mockDB.findActiveExitNoticeByUserId(occ.userId);
  if (existing) throw new Error('This occupant already has an active exit notice in progress');

  const now = new Date().toISOString();
  const notice: ExitNotice = {
    id: mockDB.generateId('exit'),
    userId: occ.userId,
    housingUnitId: occ.housingUnitId,
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

/** Update occupancy metadata (check-in date, check-out date) */
export async function updateOccupancy(params: {
  occupancyId: string;
  checkInDate?: string;
  checkOutDate?: string | null;
}): Promise<Occupancy> {
  await delay(400);

  const idx = mockDB.occupancies.findIndex(o => o.id === params.occupancyId);
  if (idx === -1) throw new Error('Occupancy record not found');

  const now = new Date().toISOString();
  const updates: Partial<Occupancy> = { updatedAt: now };

  if (params.checkInDate !== undefined) updates.checkInDate = params.checkInDate;
  if (params.checkOutDate !== undefined) updates.checkOutDate = params.checkOutDate;

  mockDB.occupancies[idx] = { ...mockDB.occupancies[idx], ...updates };
  return mockDB.occupancies[idx];
}
