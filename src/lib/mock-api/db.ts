// =============================================================================
// OAU E-Housing — In-Memory Mock Database
// =============================================================================
// All domain types, seed data, and the singleton MockDB class live here.
// The globalThis singleton pattern ensures state persists across Next.js
// hot-reloads in development.
// =============================================================================

// ---------------------------------------------------------------------------
// Primitive / Shared Enums
// ---------------------------------------------------------------------------

export type Role =
  | 'SUPER_ADMIN'
  | 'HOUSING_SECRETARY'
  | 'ESTATE_OFFICER'
  | 'DVC_ADMIN'
  | 'ELECTRICAL_OFFICER'
  | 'STAFF';

export type ParkingSpace = 'Garage' | 'Car Park' | 'Nil';
export type BuildingType = 'BUNGALOW' | 'STOREY';
export type UnitStatus = 'VACANT' | 'OCCUPIED' | 'UNDER_MAINTENANCE';
export type BQStatus = 'VACANT' | 'OCCUPIED';
export type CurrentHousingStatus = 'HAS_ALLOCATION' | 'NO_ALLOCATION';
export type Gender = 'MALE' | 'FEMALE';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type OccupancyStatus = 'ACTIVE' | 'EXITED';
export type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'QUEUED' | 'QUIT_REQUESTED' | 'WITHDRAWN' | 'TERMINATED';
export type ApplicationStage = 'HOUSING' | 'ESTATE' | 'DVC' | 'COMPLETED';
export type ReviewDecision = 'APPROVED' | 'REJECTED' | 'FORWARDED';
export type AllocationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type InspectionStatus = 'PENDING' | 'PASSED' | 'FAILED';
export type ExitReason =
  | 'RETIREMENT'
  | 'DEATH'
  | 'RESIGNATION'
  | 'RELOCATION'
  | 'TRANSFER'
  | 'OTHER';
export type AuditStatus = 'SUCCESS' | 'FAILURE';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

// ---------------------------------------------------------------------------
// 1. USER
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  password?: string | null;
  role: Role;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 2. STAFF PROFILE
// ---------------------------------------------------------------------------

export interface StaffProfile {
  id: string;
  userId: string;
  staffId: string;
  middleName?: string;
  gender?: Gender;
  department: string;
  faculty: string;
  rank: string;
  salaryGradeLevel: string;
  employmentDate: string;
  maritalStatus: MaritalStatus;
  numberOfDependents: number;
  /** System-managed — never set directly via user-facing forms */
  currentHousingStatus: CurrentHousingStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 3. HOUSING TYPE
// ---------------------------------------------------------------------------

export interface HousingType {
  id: string;
  name: string;
  buildingType: BuildingType;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  numberOfToilets: number;
  hasStudyRoom: boolean;
  parkingSpace: ParkingSpace;
  hasBQ: boolean;
  numberOfBQ: number;
  hasCourtyard: boolean;
  /** Base points used in the allocation scoring formula */
  allocationPoints: number;
  annualRent: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 4. BOYS QUARTERS (BQ) — Sub-entity of HousingUnit
// ---------------------------------------------------------------------------

export interface BQ {
  id: string;
  housingUnitId: string;
  /** Human-readable label, e.g. "BQ 1" */
  label: string;
  status: BQStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 5. BQ OCCUPANT — Managed by the main house occupant, NOT request-based
// ---------------------------------------------------------------------------

export interface BQOccupant {
  id: string;
  bqId: string;
  /** FK → User (the main occupant who is responsible for this BQ) */
  mainOccupantId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  /** e.g. "Domestic Staff", "Family Member" */
  relationship: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 6. HOUSING UNIT
// ---------------------------------------------------------------------------

export interface HousingUnit {
  id: string;
  /** Human-readable name / code, e.g. "Qtrs 14" */
  name: string;
  housingTypeId: string;
  status: UnitStatus;
  /** Set when the unit is OCCUPIED — cleared on exit clearance */
  currentOccupantId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 7. OCCUPANCY — Tracks the main-unit occupancy lifecycle
// ---------------------------------------------------------------------------

export interface Occupancy {
  id: string;
  /** FK → User */
  userId: string;
  /** FK → HousingUnit */
  housingUnitId: string;
  checkInDate: string;
  checkOutDate?: string | null;
  status: OccupancyStatus;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 8. HOUSING APPLICATION
// ---------------------------------------------------------------------------

/** Granular breakdown of how allocation points were derived */
export interface PointsBreakdown {
  baseTypePoints: number;
  seniorityBonus: number;
  dependentsBonus: number;
  maritalStatusBonus: number;
  totalPoints: number;
}

export interface HousingApplication {
  id: string;
  /** FK → User */
  userId: string;
  /** IDs of housing types the applicant would prefer */
  preferredHousingTypeIds: string[];
  status: ApplicationStatus;
  /** Tracks which review stage the application is currently at */
  currentStage: ApplicationStage;
  /** Populated by Housing Secretary at Stage 1 */
  pointsBreakdown?: PointsBreakdown | null;
  additionalNotes?: string;
  /**
   * Pre-selected by Estate Officer during Stage 2 review.
   * Stored here so the DVC Admin can see the proposed unit.
   * The formal Allocation record is created only after DVC approval.
   */
  allocatedUnitId?: string | null;
  submittedAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 9. APPLICATION REVIEW — One record per stage per application
// ---------------------------------------------------------------------------

export interface ApplicationReview {
  id: string;
  /** FK → HousingApplication */
  applicationId: string;
  /** FK → User (the reviewer) */
  reviewerId: string;
  reviewerRole: Role;
  stage: Exclude<ApplicationStage, 'COMPLETED'>;
  /** Only set by Housing Secretary at Stage 1 */
  score?: number | null;
  decision: ReviewDecision;
  comments: string;
  reviewedAt: string;
}

// ---------------------------------------------------------------------------
// 10. ALLOCATION — Assignment of a housing unit after DVC approval
// ---------------------------------------------------------------------------

export interface Allocation {
  id: string;
  /** FK → HousingApplication */
  applicationId: string;
  /** FK → User */
  userId: string;
  /** FK → HousingUnit */
  housingUnitId: string;
  status: AllocationStatus;
  allocatedAt: string;
  respondedAt?: string | null;
  /** ISO date after which the allocation auto-expires if not accepted */
  expiresAt?: string | null;
}

// ---------------------------------------------------------------------------
// 11. TENANCY AGREEMENT
// ---------------------------------------------------------------------------

export interface TenancyAgreement {
  id: string;
  /** FK → Occupancy */
  occupancyId: string;
  /** Mock URL for the generated PDF */
  documentUrl: string;
  signed: boolean;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// 12. HOUSING EXIT NOTICE (replaces HousingExitRequest)
// ---------------------------------------------------------------------------

export interface ExitNotice {
  id: string;
  /** FK → User */
  userId: string;
  /** FK → HousingUnit */
  housingUnitId: string;
  reason: ExitReason;
  /** Populated when reason === 'OTHER' */
  customReason?: string | null;
  additionalNotes?: string | null;

  // ---- Housing Inspection (Stage 1) ----
  housingInspectionStatus: InspectionStatus;
  /** FK → User (HOUSING_SECRETARY who performed it) */
  housingInspectedById?: string | null;
  housingInspectionDate?: string | null;

  // ---- Electrical Inspection (Stage 2) — unlocked after Housing PASSED ----
  electricalInspectionStatus: InspectionStatus;
  /** FK → User (ELECTRICAL_OFFICER who performed it) */
  electricalInspectedById?: string | null;
  electricalInspectionDate?: string | null;

  // ---- Estate Inspection (Stage 3) — unlocked after Electrical PASSED ----
  estateInspectionStatus: InspectionStatus;
  /** FK → User (ESTATE_OFFICER who performed it) */
  estateInspectedById?: string | null;
  estateInspectionDate?: string | null;

  // ---- Final Completion ----
  isCleared: boolean;
  clearedAt?: string | null;
  clearanceCertificateUrl?: string | null;

  // ---- Withdrawal / Termination ----
  isWithdrawn?: boolean;
  withdrawnAt?: string | null;

  submittedAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 13. AUDIT LOG
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  /** FK → User (actor who triggered the action) */
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  status: AuditStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 14. QUIT REQUEST (Staff withdrawal request)
// ---------------------------------------------------------------------------

export type QuitRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface QuitRequest {
  id: string;
  entityType: 'HousingApplication' | 'ExitNotice';
  /** ID of the HousingApplication or ExitNotice */
  entityId: string;
  /** FK -> User (the applicant) */
  requestedById: string;
  reason: string;
  status: QuitRequestStatus;
  
  /** FK -> User (Housing Secretary who reviewed it) */
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 15. INCIDENT TICKET (Complaints)
// ---------------------------------------------------------------------------

export interface IncidentTicket {
  id: string;
  /** FK → User (submitting staff) */
  userId: string;
  title: string;
  description: string;
  status: IncidentStatus;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// SEED DATA
// =============================================================================

const initialUsers: User[] = [
  {
    id: 'u-1',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'super@oauife.edu.ng',
    password: 'password',
    role: 'SUPER_ADMIN',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08000000001',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'u-2',
    firstName: 'Housing',
    lastName: 'Secretary',
    email: 'hsec@oauife.edu.ng',
    password: 'password',
    role: 'HOUSING_SECRETARY',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08000000002',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'u-3',
    firstName: 'Estate',
    lastName: 'Officer',
    email: 'estate@oauife.edu.ng',
    password: 'password',
    role: 'ESTATE_OFFICER',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08000000003',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'u-4',
    firstName: 'DVC',
    lastName: 'Admin',
    email: 'dvc@oauife.edu.ng',
    password: 'password',
    role: 'DVC_ADMIN',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08000000004',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'u-5',
    firstName: 'Electrical',
    lastName: 'Officer',
    email: 'elec@oauife.edu.ng',
    password: 'password',
    role: 'ELECTRICAL_OFFICER',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08000000005',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'u-6',
    firstName: 'Adeyemi',
    lastName: 'Bakare',
    email: 'staff@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08012345678',
    createdAt: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 'u-7',
    firstName: 'Ngozi',
    lastName: 'Okonkwo',
    email: 'staff2@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08087654321',
    createdAt: '2024-02-15T00:00:00.000Z',
  },
  {
    id: 'u-8',
    firstName: 'Chukwuemeka',
    lastName: 'Nwachukwu',
    email: 'staff3@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08031122334',
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'u-9',
    firstName: 'Amina',
    lastName: 'Yusuf',
    email: 'staff4@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08055667788',
    createdAt: '2024-03-20T00:00:00.000Z',
  },
  {
    id: 'u-10',
    firstName: 'Babatunde',
    lastName: 'Adeleke',
    email: 'staff5@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    phoneNumber: '08099001122',
    createdAt: '2024-04-10T00:00:00.000Z',
  },
  {
    id: 'u-11',
    firstName: 'Fatima',
    lastName: 'Ibrahim',
    email: 'staff6@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: false,
    mustChangePassword: false,
    phoneNumber: '08044556677',
    createdAt: '2024-05-05T00:00:00.000Z',
  },
];

const initialStaffProfiles: StaffProfile[] = [
  {
    id: 'sp-1',
    userId: 'u-6',
    staffId: 'STF-001',
    middleName: 'Oluwaseun',
    gender: 'MALE',
    department: 'Computer Science',
    faculty: 'Technology',
    rank: 'Senior Lecturer',
    salaryGradeLevel: 'CONUASS 5',
    employmentDate: '2015-08-01',
    maritalStatus: 'MARRIED',
    numberOfDependents: 3,
    // u-6 currently has a housing allocation (occupancy occ-1)
    currentHousingStatus: 'HAS_ALLOCATION',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'sp-2',
    userId: 'u-7',
    staffId: 'STF-002',
    middleName: 'Chioma',
    gender: 'FEMALE',
    department: 'Biochemistry',
    faculty: 'Science',
    rank: 'Lecturer I',
    salaryGradeLevel: 'CONUASS 3',
    employmentDate: '2019-03-15',
    maritalStatus: 'SINGLE',
    numberOfDependents: 0,
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-02-15T00:00:00.000Z',
  },
  {
    id: 'sp-3',
    userId: 'u-8',
    staffId: 'STF-003',
    gender: 'MALE',
    department: 'Electrical Engineering',
    faculty: 'Technology',
    rank: 'Professor',
    salaryGradeLevel: 'CONUASS 7',
    employmentDate: '2010-01-15',
    maritalStatus: 'MARRIED',
    numberOfDependents: 4,
    currentHousingStatus: 'HAS_ALLOCATION',
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2025-03-10T00:00:00.000Z',
  },
  {
    id: 'sp-4',
    userId: 'u-9',
    staffId: 'STF-004',
    gender: 'FEMALE',
    department: 'Economics',
    faculty: 'Social Sciences',
    rank: 'Lecturer II',
    salaryGradeLevel: 'CONUASS 2',
    employmentDate: '2021-09-01',
    maritalStatus: 'MARRIED',
    numberOfDependents: 1,
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-03-20T00:00:00.000Z',
    updatedAt: '2024-03-20T00:00:00.000Z',
  },
  {
    id: 'sp-5',
    userId: 'u-10',
    staffId: 'STF-005',
    gender: 'MALE',
    department: 'History',
    faculty: 'Arts',
    rank: 'Associate Professor',
    salaryGradeLevel: 'CONUASS 6',
    employmentDate: '2012-04-01',
    maritalStatus: 'DIVORCED',
    numberOfDependents: 2,
    currentHousingStatus: 'HAS_ALLOCATION',
    createdAt: '2024-04-10T00:00:00.000Z',
    updatedAt: '2025-05-20T00:00:00.000Z',
  },
  {
    id: 'sp-6',
    userId: 'u-11',
    staffId: 'STF-006',
    gender: 'FEMALE',
    department: 'Nursing',
    faculty: 'Health Sciences',
    rank: 'Senior Lecturer',
    salaryGradeLevel: 'CONUASS 5',
    employmentDate: '2017-06-15',
    maritalStatus: 'SINGLE',
    numberOfDependents: 0,
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-05-05T00:00:00.000Z',
    updatedAt: '2024-05-05T00:00:00.000Z',
  },
];

const initialHousingTypes: HousingType[] = [
  {
    id: 'ht-1',
    name: 'A1',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 4,
    numberOfBathrooms: 3,
    numberOfToilets: 4,
    hasStudyRoom: true,
    parkingSpace: 'Garage',
    hasBQ: true,
    numberOfBQ: 2,
    hasCourtyard: true,
    allocationPoints: 70,
    annualRent: 220000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-2',
    name: 'B1/2',
    buildingType: 'STOREY',
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    numberOfToilets: 3,
    hasStudyRoom: true,
    parkingSpace: 'Car Park',
    hasBQ: false,
    numberOfBQ: 0,
    hasCourtyard: false,
    allocationPoints: 50,
    annualRent: 150000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-3',
    name: 'E1 Modified',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    numberOfToilets: 3,
    hasStudyRoom: false,
    parkingSpace: 'Garage',
    hasBQ: true,
    numberOfBQ: 1,
    hasCourtyard: true,
    allocationPoints: 55,
    annualRent: 160000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-4',
    name: 'H',
    buildingType: 'STOREY',
    numberOfBedrooms: 2,
    numberOfBathrooms: 1,
    numberOfToilets: 2,
    hasStudyRoom: false,
    parkingSpace: 'Nil',
    hasBQ: false,
    numberOfBQ: 0,
    hasCourtyard: false,
    allocationPoints: 30,
    annualRent: 90000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-5',
    name: 'LG House',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 2,
    numberOfBathrooms: 2,
    numberOfToilets: 2,
    hasStudyRoom: false,
    parkingSpace: 'Car Park',
    hasBQ: true,
    numberOfBQ: 1,
    hasCourtyard: false,
    allocationPoints: 35,
    annualRent: 100000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-6',
    name: 'JSQ 1',
    buildingType: 'STOREY',
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    numberOfToilets: 1,
    hasStudyRoom: false,
    parkingSpace: 'Nil',
    hasBQ: false,
    numberOfBQ: 0,
    hasCourtyard: false,
    allocationPoints: 20,
    annualRent: 60000,
    isActive: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const initialHousingUnits: HousingUnit[] = [
  {
    id: 'hu-1',
    name: 'Qtrs 14',
    housingTypeId: 'ht-1',
    status: 'OCCUPIED',
    currentOccupantId: 'u-6',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'hu-2',
    name: 'Qtrs 15',
    housingTypeId: 'ht-1',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-3',
    name: 'Blk A1',
    housingTypeId: 'ht-2',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-4',
    name: 'Blk A2',
    housingTypeId: 'ht-2',
    status: 'UNDER_MAINTENANCE',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
  },
  {
    id: 'hu-5',
    name: 'Prof Qtrs 01',
    housingTypeId: 'ht-3',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-6',
    name: 'Prof Qtrs 02',
    housingTypeId: 'ht-3',
    status: 'OCCUPIED',
    currentOccupantId: 'u-8',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-03-10T00:00:00.000Z',
  },
  {
    id: 'hu-7',
    name: 'Qtrs 16',
    housingTypeId: 'ht-1',
    status: 'OCCUPIED',
    currentOccupantId: 'u-10',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-05-20T00:00:00.000Z',
  },
  {
    id: 'hu-8',
    name: 'Blk B1',
    housingTypeId: 'ht-2',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-9',
    name: 'Blk B2',
    housingTypeId: 'ht-2',
    status: 'UNDER_MAINTENANCE',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-04-12T00:00:00.000Z',
  },
  {
    id: 'hu-10',
    name: 'Qtrs 17',
    housingTypeId: 'ht-1',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
];

// BQs exist under hu-1 (2 BQs per ht-1 type) and hu-5 (1 BQ per ht-3)
const initialBQs: BQ[] = [
  {
    id: 'bq-1',
    housingUnitId: 'hu-1',
    label: 'BQ 1',
    status: 'OCCUPIED', // has an occupant
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'bq-2',
    housingUnitId: 'hu-1',
    label: 'BQ 2',
    status: 'VACANT',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'bq-3',
    housingUnitId: 'hu-5',
    label: 'BQ 1',
    status: 'VACANT',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
];

const initialBQOccupants: BQOccupant[] = [
  {
    id: 'bqo-1',
    bqId: 'bq-1',
    mainOccupantId: 'u-6',
    fullName: 'Emmanuel Afolabi',
    phoneNumber: '08099887766',
    email: 'e.afolabi@gmail.com',
    relationship: 'Domestic Staff',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
  },
];

const initialOccupancies: Occupancy[] = [
  {
    id: 'occ-1',
    userId: 'u-6',
    housingUnitId: 'hu-1',
    checkInDate: '2025-01-10',
    checkOutDate: null,
    status: 'ACTIVE',
    createdAt: '2025-01-10T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'occ-2',
    userId: 'u-8',
    housingUnitId: 'hu-6',
    checkInDate: '2025-03-10',
    checkOutDate: null,
    status: 'ACTIVE',
    createdAt: '2025-03-10T00:00:00.000Z',
    updatedAt: '2025-03-10T00:00:00.000Z',
  },
  {
    id: 'occ-3',
    userId: 'u-10',
    housingUnitId: 'hu-7',
    checkInDate: '2025-05-20',
    checkOutDate: '2026-05-25',
    status: 'EXITED',
    createdAt: '2025-05-20T00:00:00.000Z',
    updatedAt: '2026-05-25T11:30:00.000Z',
  },
];

const initialHousingApplications: HousingApplication[] = [
  {
    // app-1 has been fully approved by DVC — allocation now pending with u-7
    id: 'app-1',
    userId: 'u-7',
    preferredHousingTypeIds: ['ht-2', 'ht-1'],
    status: 'APPROVED',
    currentStage: 'COMPLETED',
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 5,
      dependentsBonus: 0,
      maritalStatusBonus: 0,
      totalPoints: 25,
    },
    additionalNotes: 'Requesting junior housing close to Science faculty.',
    submittedAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-06-27T08:00:00.000Z',
  },
  {
    // Freshly submitted application — waiting for Housing Secretary
    id: 'app-2',
    userId: 'u-6',
    preferredHousingTypeIds: ['ht-1'],
    status: 'PENDING',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    additionalNotes: 'Requesting upgrade from current allocation.',
    submittedAt: '2026-06-20T11:00:00.000Z',
    updatedAt: '2026-06-20T11:00:00.000Z',
  },
  {
    // Application scored and forwarded to Estate Officer
    id: 'app-3',
    userId: 'u-9',
    preferredHousingTypeIds: ['ht-2'],
    status: 'UNDER_REVIEW',
    currentStage: 'ESTATE',
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 2,
      dependentsBonus: 5,
      maritalStatusBonus: 10,
      totalPoints: 37,
    },
    additionalNotes: 'Needs accommodation close to Social Sciences.',
    submittedAt: '2026-06-01T08:30:00.000Z',
    updatedAt: '2026-06-10T14:00:00.000Z',
  },
  {
    // Application at DVC stage awaiting final decision
    id: 'app-4',
    userId: 'u-11',
    preferredHousingTypeIds: ['ht-2', 'ht-1'],
    status: 'UNDER_REVIEW',
    currentStage: 'DVC',
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 8,
      dependentsBonus: 0,
      maritalStatusBonus: 0,
      totalPoints: 28,
    },
    additionalNotes: undefined,
    submittedAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-06-18T09:00:00.000Z',
  },
  {
    // Rejected application
    id: 'app-5',
    userId: 'u-8',
    preferredHousingTypeIds: ['ht-3'],
    status: 'REJECTED',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    additionalNotes: 'Already has an active allocation (Prof Qtrs 02).',
    submittedAt: '2026-03-01T07:00:00.000Z',
    updatedAt: '2026-03-05T11:00:00.000Z',
  },
  {
    // Another housing-stage application
    id: 'app-6',
    userId: 'u-10',
    preferredHousingTypeIds: ['ht-1', 'ht-3'],
    status: 'PENDING',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    additionalNotes: 'Requesting transfer to larger unit.',
    submittedAt: '2026-06-28T09:15:00.000Z',
    updatedAt: '2026-06-28T09:15:00.000Z',
  },
  {
    // Queued application (Approved by DVC, waiting for vacant unit)
    id: 'app-7',
    userId: 'u-7',
    preferredHousingTypeIds: ['ht-1'],
    status: 'QUEUED',
    currentStage: 'COMPLETED',
    pointsBreakdown: {
      baseTypePoints: 50,
      seniorityBonus: 10,
      dependentsBonus: 0,
      maritalStatusBonus: 0,
      totalPoints: 60,
    },
    additionalNotes: 'Approved by DVC, placed on queue for senior bungalow.',
    submittedAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-06-25T16:00:00.000Z',
  },
  {
    // Quit Requested application
    id: 'app-8',
    userId: 'u-9',
    preferredHousingTypeIds: ['ht-2'],
    status: 'QUIT_REQUESTED',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    additionalNotes: 'Requested withdrawal after job transfer.',
    submittedAt: '2026-06-22T14:30:00.000Z',
    updatedAt: '2026-06-26T09:00:00.000Z',
  },
  {
    // Withdrawn application
    id: 'app-9',
    userId: 'u-11',
    preferredHousingTypeIds: ['ht-1'],
    status: 'WITHDRAWN',
    currentStage: 'HOUSING',
    allocatedUnitId: null,
    pointsBreakdown: null,
    additionalNotes: 'Application voluntarily withdrawn.',
    submittedAt: '2026-04-10T11:00:00.000Z',
    updatedAt: '2026-04-15T15:00:00.000Z',
  },
  {
    // Terminated application
    id: 'app-10',
    userId: 'u-8',
    preferredHousingTypeIds: ['ht-2', 'ht-3'],
    status: 'TERMINATED',
    currentStage: 'ESTATE',
    allocatedUnitId: null,
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 15,
      dependentsBonus: 5,
      maritalStatusBonus: 10,
      totalPoints: 50,
    },
    additionalNotes: 'Administratively terminated.',
    submittedAt: '2026-03-12T09:00:00.000Z',
    updatedAt: '2026-03-20T12:00:00.000Z',
  },
];

const initialApplicationReviews: ApplicationReview[] = [
  {
    // Housing Secretary completed Stage 1 for app-1
    id: 'rev-1',
    applicationId: 'app-1',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 25,
    decision: 'FORWARDED',
    comments: 'Application meets junior staff eligibility. Scored and forwarded to Estate Office.',
    reviewedAt: '2026-05-15T10:00:00.000Z',
  },
  {
    // Estate Officer completed Stage 2 for app-1
    id: 'rev-2',
    applicationId: 'app-1',
    reviewerId: 'u-3',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'FORWARDED',
    comments: 'Housing conditions verified. Blk A1 available and suitable. Forwarding to DVC for final decision.',
    reviewedAt: '2026-06-01T14:30:00.000Z',
  },
  {
    // DVC approved app-1
    id: 'rev-3',
    applicationId: 'app-1',
    reviewerId: 'u-4',
    reviewerRole: 'DVC_ADMIN',
    stage: 'DVC',
    score: null,
    decision: 'APPROVED',
    comments: 'Approved. Allocation issued for Blk A1.',
    reviewedAt: '2026-06-27T08:00:00.000Z',
  },
  {
    // Housing Secretary scored and forwarded app-3 to Estate
    id: 'rev-4',
    applicationId: 'app-3',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 37,
    decision: 'FORWARDED',
    comments: 'Eligible. Score reflects marital status and dependant bonus.',
    reviewedAt: '2026-06-10T14:00:00.000Z',
  },
  {
    // Housing Secretary rejected app-5
    id: 'rev-5',
    applicationId: 'app-5',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: null,
    decision: 'REJECTED',
    comments: 'Applicant already holds an active allocation. Policy does not permit dual allocation.',
    reviewedAt: '2026-03-05T11:00:00.000Z',
  },
  {
    // Estate Officer forwarded app-4 to DVC
    id: 'rev-6',
    applicationId: 'app-4',
    reviewerId: 'u-3',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'FORWARDED',
    comments: 'Estate conditions verified. Blk A1 or B1 suitable. Forwarding to DVC.',
    reviewedAt: '2026-06-18T09:00:00.000Z',
  },
  {
    // DVC approved app-7 into QUEUED state
    id: 'rev-7',
    applicationId: 'app-7',
    reviewerId: 'u-4',
    reviewerRole: 'DVC_ADMIN',
    stage: 'DVC',
    score: null,
    decision: 'APPROVED',
    comments: 'Approved for allocation when senior bungalow becomes vacant.',
    reviewedAt: '2026-06-25T16:00:00.000Z',
  },
  {
    // Super Admin terminated app-10
    id: 'rev-8',
    applicationId: 'app-10',
    reviewerId: 'u-1',
    reviewerRole: 'SUPER_ADMIN',
    stage: 'ESTATE',
    score: null,
    decision: 'REJECTED',
    comments: 'Administratively terminated: Non-compliance with university quarters regulations.',
    reviewedAt: '2026-03-20T12:00:00.000Z',
  },
];

const initialAllocations: Allocation[] = [
  {
    // The allocation that resulted in u-6's current occupancy of hu-1
    id: 'alc-1',
    applicationId: 'app-ref-1', // Refers to a historical app no longer in active list
    userId: 'u-6',
    housingUnitId: 'hu-1',
    status: 'ACCEPTED',
    allocatedAt: '2024-12-20T08:00:00.000Z',
    respondedAt: '2024-12-22T11:00:00.000Z',
    expiresAt: '2025-01-05T00:00:00.000Z',
  },
  {
    // PENDING allocation for u-7 (Ngozi Okonkwo) following DVC approval of app-1
    // Expires in ~72 hours from seeding — demonstrates the countdown timer
    id: 'alc-2',
    applicationId: 'app-1',
    userId: 'u-7',
    housingUnitId: 'hu-3', // Blk A1 — VACANT 2-bedroom junior storey
    status: 'PENDING',
    allocatedAt: '2026-06-27T08:00:00.000Z',
    respondedAt: null,
    expiresAt: '2026-06-30T08:00:00.000Z', // 72-hour response window
  },
];

const initialTenancyAgreements: TenancyAgreement[] = [
  {
    id: 'tena-1',
    occupancyId: 'occ-1',
    documentUrl: '/documents/tenancy/occ-1-agreement.pdf',
    signed: true,
    createdAt: '2025-01-10T00:00:00.000Z',
  },
];

const initialExitNotices: ExitNotice[] = [
  {
    // Mid-pipeline: Housing PASSED, Electrical still PENDING
    id: 'exit-1',
    userId: 'u-6',
    housingUnitId: 'hu-1',
    reason: 'RELOCATION',
    additionalNotes: 'Moving to personal residence in Ibadan.',

    housingInspectionStatus: 'PASSED',
    housingInspectedById: 'u-2',
    housingInspectionDate: '2026-06-15T10:00:00.000Z',

    electricalInspectionStatus: 'PENDING',
    electricalInspectedById: null,
    electricalInspectionDate: null,

    estateInspectionStatus: 'PENDING',
    estateInspectedById: null,
    estateInspectionDate: null,

    isCleared: false,
    clearedAt: null,
    clearanceCertificateUrl: null,

    submittedAt: '2026-06-10T08:00:00.000Z',
    updatedAt: '2026-06-15T10:00:00.000Z',
  },
  {
    // Early pipeline: All three inspections PENDING
    id: 'exit-2',
    userId: 'u-8',
    housingUnitId: 'hu-6',
    reason: 'RETIREMENT',
    additionalNotes: 'Retiring after 16 years of service.',

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

    submittedAt: '2026-06-25T07:30:00.000Z',
    updatedAt: '2026-06-25T07:30:00.000Z',
  },
  {
    // Fully cleared exit — historical record
    id: 'exit-3',
    userId: 'u-10',
    housingUnitId: 'hu-7',
    reason: 'RESIGNATION',
    additionalNotes: null,

    housingInspectionStatus: 'PASSED',
    housingInspectedById: 'u-2',
    housingInspectionDate: '2026-05-20T10:00:00.000Z',

    electricalInspectionStatus: 'PASSED',
    electricalInspectedById: 'u-5',
    electricalInspectionDate: '2026-05-22T14:00:00.000Z',

    estateInspectionStatus: 'PASSED',
    estateInspectedById: 'u-3',
    estateInspectionDate: '2026-05-25T11:00:00.000Z',

    isCleared: true,
    clearedAt: '2026-05-25T11:30:00.000Z',
    clearanceCertificateUrl: '/documents/clearance/exit-3-certificate.pdf',

    submittedAt: '2026-05-15T09:00:00.000Z',
    updatedAt: '2026-05-25T11:30:00.000Z',
  },
  {
    // Stage 3 Exit Notice: Housing PASSED, Electrical PASSED, Estate PENDING
    id: 'exit-4',
    userId: 'u-10',
    housingUnitId: 'hu-7',
    reason: 'TRANSFER',
    additionalNotes: 'Transferring to Lagos campus.',
    housingInspectionStatus: 'PASSED',
    housingInspectedById: 'u-2',
    housingInspectionDate: '2026-06-12T09:00:00.000Z',
    electricalInspectionStatus: 'PASSED',
    electricalInspectedById: 'u-5',
    electricalInspectionDate: '2026-06-14T11:30:00.000Z',
    estateInspectionStatus: 'PENDING',
    estateInspectedById: null,
    estateInspectionDate: null,
    isCleared: false,
    clearedAt: null,
    clearanceCertificateUrl: null,
    submittedAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-14T11:30:00.000Z',
  },
  {
    // Withdrawn Exit Notice
    id: 'exit-5',
    userId: 'u-7',
    housingUnitId: 'hu-3',
    reason: 'OTHER',
    customReason: 'Personal Reasons',
    additionalNotes: 'Decided to extend stay.',
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
    isWithdrawn: true,
    withdrawnAt: '2026-06-20T14:00:00.000Z',
    clearanceCertificateUrl: null,
    submittedAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-20T14:00:00.000Z',
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    actorId: 'u-1',
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: 'u-2',
    status: 'SUCCESS',
    metadata: { role: 'HOUSING_SECRETARY' },
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 'audit-2',
    actorId: 'u-2',
    action: 'APPLICATION_REVIEWED',
    entityType: 'HousingApplication',
    entityId: 'app-1',
    status: 'SUCCESS',
    metadata: { stage: 'HOUSING', decision: 'FORWARDED', score: 25 },
    createdAt: '2026-05-15T10:00:00.000Z',
  },
  {
    id: 'audit-3',
    actorId: 'u-3',
    action: 'APPLICATION_REVIEWED',
    entityType: 'HousingApplication',
    entityId: 'app-1',
    status: 'SUCCESS',
    metadata: { stage: 'ESTATE', decision: 'FORWARDED' },
    createdAt: '2026-06-01T14:30:00.000Z',
  },
  {
    id: 'audit-4',
    actorId: 'u-6',
    action: 'EXIT_NOTICE_SUBMITTED',
    entityType: 'ExitNotice',
    entityId: 'exit-1',
    status: 'SUCCESS',
    metadata: { reason: 'RELOCATION', housingUnitId: 'hu-1' },
    createdAt: '2026-06-10T08:00:00.000Z',
  },
  {
    id: 'audit-5',
    actorId: 'u-2',
    action: 'EXIT_INSPECTION_UPDATED',
    entityType: 'ExitNotice',
    entityId: 'exit-1',
    status: 'SUCCESS',
    metadata: { stage: 'HOUSING', result: 'PASSED' },
    createdAt: '2026-06-15T10:00:00.000Z',
  },
  {
    id: 'audit-6',
    actorId: 'u-4',
    action: 'APPLICATION_REVIEWED',
    entityType: 'HousingApplication',
    entityId: 'app-1',
    status: 'SUCCESS',
    metadata: { stage: 'DVC', decision: 'APPROVED' },
    createdAt: '2026-06-27T08:00:00.000Z',
  },
  {
    id: 'audit-7',
    actorId: 'u-8',
    action: 'EXIT_NOTICE_SUBMITTED',
    entityType: 'ExitNotice',
    entityId: 'exit-2',
    status: 'SUCCESS',
    metadata: { reason: 'RETIREMENT', housingUnitId: 'hu-6' },
    createdAt: '2026-06-25T07:30:00.000Z',
  },
  {
    id: 'audit-8',
    actorId: 'u-2',
    action: 'APPLICATION_REVIEWED',
    entityType: 'HousingApplication',
    entityId: 'app-3',
    status: 'SUCCESS',
    metadata: { stage: 'HOUSING', decision: 'FORWARDED', score: 37 },
    createdAt: '2026-06-10T14:00:00.000Z',
  },
  {
    id: 'audit-9',
    actorId: 'u-1',
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: 'u-11',
    status: 'SUCCESS',
    metadata: { reason: 'Sabbatical leave' },
    createdAt: '2026-06-20T09:00:00.000Z',
  },
  {
    id: 'audit-10',
    actorId: 'u-3',
    action: 'EXIT_CLEARANCE_FINALIZED',
    entityType: 'ExitNotice',
    entityId: 'exit-3',
    status: 'SUCCESS',
    metadata: { userId: 'u-10', housingUnitId: 'hu-7', bqsReset: 0, bqOccupantsPurged: 0, clearanceCertificateUrl: '/documents/clearance/exit-3-certificate.pdf' },
    createdAt: '2026-05-25T11:30:00.000Z',
  },
  {
    id: 'audit-11',
    actorId: 'u-2',
    action: 'APPLICATION_REVIEWED',
    entityType: 'HousingApplication',
    entityId: 'app-5',
    status: 'SUCCESS',
    metadata: { stage: 'HOUSING', decision: 'REJECTED' },
    createdAt: '2026-03-05T11:00:00.000Z',
  },
];

const initialIncidentTickets: IncidentTicket[] = [
  {
    id: 'inc-1',
    userId: 'u-6',
    title: 'Leaking Roof — Main Bedroom',
    description: 'The main bedroom ceiling has been leaking water during rainfall for the past two weeks. Urgent attention required.',
    status: 'IN_PROGRESS',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-05T14:00:00.000Z',
  },
  {
    id: 'inc-2',
    userId: 'u-7',
    title: 'No Electricity for 3 Days',
    description: 'The apartment block (Blk A1) has been without electricity since Monday. NEPA token also not working.',
    status: 'OPEN',
    createdAt: '2026-06-24T07:30:00.000Z',
    updatedAt: '2026-06-24T07:30:00.000Z',
  },
  {
    id: 'inc-3',
    userId: 'u-8',
    title: 'Broken Perimeter Fence — Prof Qtrs 02',
    description: 'Section of perimeter fence near Prof Qtrs 02 collapsed. Security risk for residents in the block.',
    status: 'OPEN',
    createdAt: '2026-06-22T10:15:00.000Z',
    updatedAt: '2026-06-22T10:15:00.000Z',
  },
  {
    id: 'inc-4',
    userId: 'u-10',
    title: 'Water Supply Disruption — Qtrs 16',
    description: 'No running water in Qtrs 16 for the past 5 days. Water board has not responded to complaints.',
    status: 'RESOLVED',
    createdAt: '2026-06-10T08:00:00.000Z',
    updatedAt: '2026-06-14T16:00:00.000Z',
  },
  {
    id: 'inc-5',
    userId: 'u-9',
    title: 'Faulty Door Lock — Blk A3',
    description: 'Main entrance door lock is faulty and cannot be secured from outside. Safety concern.',
    status: 'IN_PROGRESS',
    createdAt: '2026-06-26T11:00:00.000Z',
    updatedAt: '2026-06-27T09:00:00.000Z',
  },
];

// =============================================================================
// MockDB CLASS
const initialQuitRequests: QuitRequest[] = [
  {
    id: 'quit-1',
    entityType: 'HousingApplication',
    entityId: 'app-8',
    requestedById: 'u-9',
    reason: 'Inter-university transfer, no longer require housing.',
    status: 'PENDING',
    createdAt: '2026-06-26T09:00:00.000Z',
  },
  {
    id: 'quit-2',
    entityType: 'HousingApplication',
    entityId: 'app-9',
    requestedById: 'u-11',
    reason: 'Secured off-campus private accommodation.',
    status: 'APPROVED',
    reviewedById: 'u-2',
    reviewedAt: '2026-04-15T15:00:00.000Z',
    reviewNotes: 'Approved withdrawal request.',
    createdAt: '2026-04-12T10:00:00.000Z',
    updatedAt: '2026-04-15T15:00:00.000Z',
  },
];

export class MockDB {
  public users: User[];
  public staffProfiles: StaffProfile[];
  public housingTypes: HousingType[];
  public housingUnits: HousingUnit[];
  public bqs: BQ[];
  public bqOccupants: BQOccupant[];
  public occupancies: Occupancy[];
  public housingApplications: HousingApplication[];
  public applicationReviews: ApplicationReview[];
  public allocations: Allocation[];
  public tenancyAgreements: TenancyAgreement[];
  public exitNotices: ExitNotice[];
  public auditLogs: AuditLog[];
  public incidentTickets: IncidentTicket[];
  public quitRequests: QuitRequest[];

  constructor() {
    this.users = [...initialUsers];
    this.staffProfiles = [...initialStaffProfiles];
    this.housingTypes = [...initialHousingTypes];
    this.housingUnits = [...initialHousingUnits];
    this.bqs = [...initialBQs];
    this.bqOccupants = [...initialBQOccupants];
    this.occupancies = [...initialOccupancies];
    this.housingApplications = [...initialHousingApplications];
    this.applicationReviews = [...initialApplicationReviews];
    this.allocations = [...initialAllocations];
    this.tenancyAgreements = [...initialTenancyAgreements];
    this.exitNotices = [...initialExitNotices];
    this.auditLogs = [...initialAuditLogs];
    this.incidentTickets = [...initialIncidentTickets];
    this.quitRequests = [...initialQuitRequests];
  }

  // -------------------------------------------------------------------------
  // User helpers
  // -------------------------------------------------------------------------

  findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  findUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  // -------------------------------------------------------------------------
  // Staff Profile helpers
  // -------------------------------------------------------------------------

  findProfileByUserId(userId: string): StaffProfile | undefined {
    return this.staffProfiles.find(p => p.userId === userId);
  }

  // -------------------------------------------------------------------------
  // Housing Unit helpers
  // -------------------------------------------------------------------------

  findUnitById(id: string): HousingUnit | undefined {
    return this.housingUnits.find(u => u.id === id);
  }

  getBQsForUnit(housingUnitId: string): BQ[] {
    return this.bqs.filter(b => b.housingUnitId === housingUnitId);
  }

  getBQOccupantsForBQ(bqId: string): BQOccupant[] {
    return this.bqOccupants.filter(o => o.bqId === bqId);
  }

  // -------------------------------------------------------------------------
  // Application helpers
  // -------------------------------------------------------------------------

  findApplicationById(id: string): HousingApplication | undefined {
    return this.housingApplications.find(a => a.id === id);
  }

  getReviewsForApplication(applicationId: string): ApplicationReview[] {
    return this.applicationReviews.filter(r => r.applicationId === applicationId);
  }

  getActiveApplicationForUser(userId: string): HousingApplication | undefined {
    return this.housingApplications.find(
      a => a.userId === userId && 
      a.status !== 'APPROVED' && 
      a.status !== 'REJECTED' &&
      a.status !== 'WITHDRAWN' &&
      a.status !== 'TERMINATED'
    );
  }

  /** All vacant housing units — optionally filtered to a set of housingTypeIds */
  getVacantUnits(housingTypeIds?: string[]): HousingUnit[] {
    return this.housingUnits.filter(
      u => u.status === 'VACANT' &&
        (housingTypeIds == null || housingTypeIds.length === 0 || housingTypeIds.includes(u.housingTypeId))
    );
  }

  // -------------------------------------------------------------------------
  // Occupancy helpers
  // -------------------------------------------------------------------------

  findActiveOccupancyByUserId(userId: string): Occupancy | undefined {
    return this.occupancies.find(o => o.userId === userId && o.status === 'ACTIVE');
  }

  findActiveOccupancyByUnitId(housingUnitId: string): Occupancy | undefined {
    return this.occupancies.find(o => o.housingUnitId === housingUnitId && o.status === 'ACTIVE');
  }

  // -------------------------------------------------------------------------
  // Exit Notice helpers
  // -------------------------------------------------------------------------

  findActiveExitNoticeByUserId(userId: string): ExitNotice | undefined {
    return this.exitNotices.find(e => e.userId === userId && !e.isCleared);
  }

  findExitNoticeById(id: string): ExitNotice | undefined {
    return this.exitNotices.find(e => e.id === id);
  }

  // -------------------------------------------------------------------------
  // Audit Log helper
  // -------------------------------------------------------------------------

  writeAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.push(log);
    return log;
  }

  // -------------------------------------------------------------------------
  // ID generator utility
  // -------------------------------------------------------------------------

  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

// =============================================================================
// Singleton — survives Next.js hot-reloads in development
// =============================================================================

const globalForDb = globalThis as unknown as { mockDB: MockDB | undefined };
export const mockDB = globalForDb.mockDB ?? new MockDB();

// Patch for HMR to ensure new arrays and seed data exist on older instances
if (!mockDB.quitRequests) {
  mockDB.quitRequests = [...initialQuitRequests];
} else if (mockDB.quitRequests.length === 0) {
  mockDB.quitRequests = [...initialQuitRequests];
}

// Sync missing applications into hot-reloaded singleton
for (const app of initialHousingApplications) {
  if (!mockDB.housingApplications.some(a => a.id === app.id)) {
    mockDB.housingApplications.push(app);
  }
}

// Sync missing reviews into hot-reloaded singleton
for (const rev of initialApplicationReviews) {
  if (!mockDB.applicationReviews.some(r => r.id === rev.id)) {
    mockDB.applicationReviews.push(rev);
  }
}

// Sync missing exit notices into hot-reloaded singleton
for (const exit of initialExitNotices) {
  if (!mockDB.exitNotices.some(e => e.id === exit.id)) {
    mockDB.exitNotices.push(exit);
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mockDB = mockDB;
}
