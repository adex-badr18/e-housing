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
export type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'QUEUED' | 'RETURNED' | 'QUIT_REQUESTED' | 'WITHDRAWN' | 'TERMINATED';
export type ApplicationStage = 'HOUSING' | 'ESTATE' | 'DVC' | 'COMPLETED';
export type ReviewDecision = 'APPROVED' | 'REJECTED' | 'FORWARDED' | 'RETURNED' | 'SAVE_DRAFT';
export type AllocationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type InspectionStatus = 'PENDING' | 'PASSED' | 'FAILED';

// Physical inspection scoring types
export type InspectionRating = 'GOOD' | 'FAIR' | 'BAD' | 'NA';
/** metricId → rating. One entry per metric per unit. */
export type UnitInspectionScores = Record<string, InspectionRating>;
/** unitId → { metricId → rating } */
export type InspectionData = Record<string, UnitInspectionScores>;
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
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// 2. STAFF PROFILE
// ---------------------------------------------------------------------------

export interface ChildDependant {
  name: string;
  age: number;
}

export interface StaffDocument {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface PreviousExperience {
  employer: string;
  responsibility?: string;
  period?: string;
}

export interface StaffProfile {
  id: string;
  userId: string;
  staffId: string;
  title?: string;
  middleName?: string;
  phoneNumber?: string;
  gender?: Gender;
  department: string;
  faculty: string;
  rank: string;
  salaryLevel: string;
  salaryStep: string;
  salaryGradeLevel?: string;
  employmentDate: string;
  maritalStatus: MaritalStatus;
  numberOfDependents: number;

  // Additional Onboarding Details
  nationality?: string;
  presentAddress?: string;
  ippisNumber?: string;
  assumptionDate?: string;
  expectedRetirementDate?: string;
  onLeaveWithoutPay?: boolean;
  previousSeniorStaffDate?: string;
  previousExperiences?: PreviousExperience[];
  children?: ChildDependant[];
  spouseName?: string;
  spouseEmployedInOAU?: boolean;
  spouseDepartment?: string;
  spouseEmploymentAddress?: string;

  documents?: {
    appointmentLetter?: StaffDocument;
    assumptionLetter?: StaffDocument;
    promotionLetter?: StaffDocument;
  };

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
  houseNumber?: string;
  roadNumber?: string;
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
   * The final unit confirmed by DVC Admin on approval.
   * For historical applications, this was also set by EO at stage 2.
   */
  allocatedUnitId?: string | null;
  /**
   * When DVC Admin returns the application for modification, the DVC's instructions
   * and optional suggested unit are stored here.
   */
  dvcReturnNote?: string | null;
  dvcSuggestedUnitId?: string | null;
  /**
   * Optional unit suggested by Housing Secretary at Stage 1.
   * The Estate Officer sees this and can either accept it or suggest a different one.
   */
  secretarySuggestedUnitId?: string | null;
  /**
   * Unit selected by the Estate Officer after physical inspection.
   * Required before FORWARDING to DVC. May match secretarySuggestedUnitId (same) or differ.
   */
  estateSuggestedUnitId?: string | null;
  /**
   * Physical inspection scores, keyed by unitId → metricId → rating.
   * If HS and EO suggested different units, both are scored here.
   */
  inspectionData?: InspectionData | null;
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
  /** True when this review was saved as a draft without advancing the stage */
  isDraft?: boolean;
  /** Proposed or suggested unit ID at time of review */
  suggestedUnitId?: string | null;
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
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
    profileCompleted: true,
    phoneNumber: '08044556677',
    createdAt: '2024-05-05T00:00:00.000Z',
  },
  {
    id: 'u-12',
    firstName: 'Olawale',
    lastName: 'Ogundimu',
    email: 'staff7@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08011223344',
    createdAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'u-13',
    firstName: 'Chinwe',
    lastName: 'Eze',
    email: 'staff8@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08022334455',
    createdAt: '2024-06-10T00:00:00.000Z',
  },
  {
    id: 'u-14',
    firstName: 'Musa',
    lastName: 'Danjuma',
    email: 'staff9@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08033445566',
    createdAt: '2024-06-15T00:00:00.000Z',
  },
  {
    id: 'u-15',
    firstName: 'Adaeze',
    lastName: 'Obi',
    email: 'staff10@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08044557788',
    createdAt: '2024-07-01T00:00:00.000Z',
  },
  {
    id: 'u-16',
    firstName: 'Kayode',
    lastName: 'Salawu',
    email: 'staff11@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08055668899',
    createdAt: '2024-07-20T00:00:00.000Z',
  },
  {
    id: 'u-17',
    firstName: 'Bimpe',
    lastName: 'Adesanya',
    email: 'staff12@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08066779900',
    createdAt: '2024-08-05T00:00:00.000Z',
  },
  {
    id: 'u-18',
    firstName: 'Emeka',
    lastName: 'Okafor',
    email: 'staff13@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08077880011',
    createdAt: '2024-08-20T00:00:00.000Z',
  },
  {
    id: 'u-19',
    firstName: 'Zainab',
    lastName: 'Suleiman',
    email: 'staff14@oauife.edu.ng',
    password: 'password',
    role: 'STAFF',
    isActive: true,
    mustChangePassword: false,
    profileCompleted: true,
    phoneNumber: '08088991122',
    createdAt: '2024-09-01T00:00:00.000Z',
  },
];

const initialStaffProfiles: StaffProfile[] = [
  {
    id: 'sp-1',
    userId: 'u-6',
    staffId: 'STF-001',
    ippisNumber: 'IPPIS-883001',
    phoneNumber: '08012345678',
    middleName: 'Oluwaseun',
    gender: 'MALE',
    department: 'Computer Science',
    faculty: 'Technology',
    rank: 'Senior Lecturer',
    salaryLevel: 'CONUASS 5',
    salaryStep: 'Step 3',
    salaryGradeLevel: 'CONUASS 5 Step 3',
    employmentDate: '2015-08-01',
    maritalStatus: 'MARRIED',
    spouseName: 'Dr. (Mrs) Folashade Bakare',
    spouseEmployedInOAU: true,
    spouseDepartment: 'Chemical Engineering',
    spouseEmploymentAddress: 'Department of Chemical Engineering, OAU, Ile-Ife',
    numberOfDependents: 3,
    children: [
      { name: 'Tobi Bakare', age: 12 },
      { name: 'Femi Bakare', age: 9 },
      { name: 'Sola Bakare', age: 5 },
    ],
    // u-6 currently has a housing allocation (occupancy occ-1)
    currentHousingStatus: 'HAS_ALLOCATION',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'sp-2',
    userId: 'u-7',
    staffId: 'STF-002',
    ippisNumber: 'IPPIS-883002',
    phoneNumber: '08087654321',
    middleName: 'Chioma',
    gender: 'FEMALE',
    department: 'Biochemistry',
    faculty: 'Science',
    rank: 'Lecturer I',
    salaryLevel: 'CONUASS 3',
    salaryStep: 'Step 2',
    salaryGradeLevel: 'CONUASS 3 Step 2',
    employmentDate: '2019-03-15',
    maritalStatus: 'SINGLE',
    numberOfDependents: 0,
    children: [],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-02-15T00:00:00.000Z',
  },
  {
    id: 'sp-3',
    userId: 'u-8',
    staffId: 'STF-003',
    ippisNumber: 'IPPIS-883003',
    phoneNumber: '08031122334',
    middleName: 'Chidi',
    gender: 'MALE',
    department: 'Electrical Engineering',
    faculty: 'Technology',
    rank: 'Professor',
    salaryLevel: 'CONUASS 7',
    salaryStep: 'Step 5',
    salaryGradeLevel: 'CONUASS 7 Step 5',
    employmentDate: '2010-01-15',
    maritalStatus: 'MARRIED',
    spouseName: 'Prof. (Mrs) Grace Nwachukwu',
    spouseEmployedInOAU: true,
    spouseDepartment: 'Educational Foundations',
    spouseEmploymentAddress: 'Faculty of Education, OAU, Ile-Ife',
    numberOfDependents: 4,
    children: [
      { name: 'Chidi Nwachukwu Jr.', age: 16 },
      { name: 'Kene Nwachukwu', age: 14 },
      { name: 'Amaka Nwachukwu', age: 11 },
      { name: 'Somto Nwachukwu', age: 8 },
    ],
    currentHousingStatus: 'HAS_ALLOCATION',
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2025-03-10T00:00:00.000Z',
  },
  {
    id: 'sp-4',
    userId: 'u-9',
    staffId: 'STF-004',
    ippisNumber: 'IPPIS-883004',
    phoneNumber: '08055667788',
    middleName: 'Bintou',
    gender: 'FEMALE',
    department: 'Economics',
    faculty: 'Social Sciences',
    rank: 'Lecturer II',
    salaryLevel: 'CONUASS 2',
    salaryStep: 'Step 1',
    salaryGradeLevel: 'CONUASS 2 Step 1',
    employmentDate: '2021-09-01',
    maritalStatus: 'MARRIED',
    spouseName: 'Engr. Kabir Yusuf',
    spouseEmployedInOAU: false,
    spouseEmploymentAddress: 'Federal Ministry of Works, Osogbo Branch',
    numberOfDependents: 1,
    children: [
      { name: 'Zahra Yusuf', age: 4 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-03-20T00:00:00.000Z',
    updatedAt: '2024-03-20T00:00:00.000Z',
  },
  {
    id: 'sp-5',
    userId: 'u-10',
    staffId: 'STF-005',
    ippisNumber: 'IPPIS-883005',
    phoneNumber: '08099001122',
    middleName: 'Funmilayo',
    gender: 'FEMALE',
    department: 'History',
    faculty: 'Arts',
    rank: 'Associate Professor',
    salaryLevel: 'CONUASS 6',
    salaryStep: 'Step 4',
    salaryGradeLevel: 'CONUASS 6 Step 4',
    employmentDate: '2012-04-01',
    maritalStatus: 'DIVORCED',
    numberOfDependents: 2,
    children: [
      { name: 'Yetunde Adeleke', age: 13 },
      { name: 'Kehinde Adeleke', age: 10 },
    ],
    currentHousingStatus: 'HAS_ALLOCATION',
    createdAt: '2024-04-10T00:00:00.000Z',
    updatedAt: '2025-05-20T00:00:00.000Z',
  },
  {
    id: 'sp-6',
    userId: 'u-11',
    staffId: 'STF-006',
    ippisNumber: 'IPPIS-883006',
    phoneNumber: '08044556677',
    middleName: 'Amina',
    gender: 'FEMALE',
    department: 'Nursing',
    faculty: 'Health Sciences',
    rank: 'Senior Lecturer',
    salaryLevel: 'CONUASS 5',
    salaryStep: 'Step 2',
    salaryGradeLevel: 'CONUASS 5 Step 2',
    employmentDate: '2017-06-15',
    maritalStatus: 'SINGLE',
    numberOfDependents: 0,
    children: [],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-05-05T00:00:00.000Z',
    updatedAt: '2024-05-05T00:00:00.000Z',
  },
  {
    id: 'sp-7',
    userId: 'u-12',
    staffId: 'STF-007',
    ippisNumber: 'IPPIS-883007',
    phoneNumber: '08011223344',
    middleName: 'Olanrewaju',
    gender: 'MALE',
    department: 'Physics',
    faculty: 'Science',
    rank: 'Lecturer II',
    salaryLevel: 'CONUASS 2',
    salaryStep: 'Step 3',
    salaryGradeLevel: 'CONUASS 2 Step 3',
    employmentDate: '2020-10-01',
    maritalStatus: 'MARRIED',
    spouseName: 'Dr. (Mrs) Funke Ogundimu',
    spouseEmployedInOAU: true,
    spouseDepartment: 'Botany',
    spouseEmploymentAddress: 'Department of Botany, OAU, Ile-Ife',
    numberOfDependents: 2,
    children: [
      { name: 'Dayo Ogundimu', age: 7 },
      { name: 'Bisi Ogundimu', age: 4 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'sp-8',
    userId: 'u-13',
    staffId: 'STF-008',
    ippisNumber: 'IPPIS-883008',
    phoneNumber: '08022334455',
    middleName: 'Adanna',
    gender: 'FEMALE',
    department: 'Law',
    faculty: 'Law',
    rank: 'Senior Lecturer',
    salaryLevel: 'CONUASS 5',
    salaryStep: 'Step 1',
    salaryGradeLevel: 'CONUASS 5 Step 1',
    employmentDate: '2016-03-01',
    maritalStatus: 'WIDOWED',
    numberOfDependents: 3,
    children: [
      { name: 'Obinna Eze', age: 15 },
      { name: 'Nneka Eze', age: 12 },
      { name: 'Uche Eze', age: 9 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-06-10T00:00:00.000Z',
    updatedAt: '2024-06-10T00:00:00.000Z',
  },
  {
    id: 'sp-9',
    userId: 'u-14',
    staffId: 'STF-009',
    ippisNumber: 'IPPIS-883009',
    phoneNumber: '08033445566',
    middleName: 'Shehu',
    gender: 'MALE',
    department: 'Civil Engineering',
    faculty: 'Technology',
    rank: 'Associate Professor',
    salaryLevel: 'CONUASS 6',
    salaryStep: 'Step 2',
    salaryGradeLevel: 'CONUASS 6 Step 2',
    employmentDate: '2013-08-01',
    maritalStatus: 'MARRIED',
    spouseName: 'Hajiya Halima Danjuma',
    spouseEmployedInOAU: false,
    spouseEmploymentAddress: 'OAU International School, Ile-Ife',
    numberOfDependents: 4,
    children: [
      { name: 'Usman Danjuma', age: 14 },
      { name: 'Aisha Danjuma', age: 12 },
      { name: 'Ibrahim Danjuma', age: 9 },
      { name: 'Fatima Danjuma', age: 6 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-06-15T00:00:00.000Z',
    updatedAt: '2024-06-15T00:00:00.000Z',
  },
  {
    id: 'sp-10',
    userId: 'u-15',
    staffId: 'STF-010',
    ippisNumber: 'IPPIS-883010',
    phoneNumber: '08044557788',
    middleName: 'Nkechi',
    gender: 'FEMALE',
    department: 'Microbiology',
    faculty: 'Science',
    rank: 'Lecturer I',
    salaryLevel: 'CONUASS 3',
    salaryStep: 'Step 4',
    salaryGradeLevel: 'CONUASS 3 Step 4',
    employmentDate: '2018-01-15',
    maritalStatus: 'MARRIED',
    spouseName: 'Dr. Chinedu Obi',
    spouseEmployedInOAU: true,
    spouseDepartment: 'Pharmacology',
    spouseEmploymentAddress: 'Faculty of Pharmacy, OAU, Ile-Ife',
    numberOfDependents: 1,
    children: [
      { name: 'Chidera Obi', age: 3 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-07-01T00:00:00.000Z',
    updatedAt: '2024-07-01T00:00:00.000Z',
  },
  {
    id: 'sp-11',
    userId: 'u-16',
    staffId: 'STF-011',
    ippisNumber: 'IPPIS-883011',
    phoneNumber: '08055668899',
    middleName: 'Babatunde',
    gender: 'MALE',
    department: 'Mathematics',
    faculty: 'Science',
    rank: 'Professor',
    salaryLevel: 'CONUASS 7',
    salaryStep: 'Step 3',
    salaryGradeLevel: 'CONUASS 7 Step 3',
    employmentDate: '2009-05-01',
    maritalStatus: 'MARRIED',
    spouseName: 'Mrs. Ronke Salawu',
    spouseEmployedInOAU: false,
    spouseEmploymentAddress: 'First Bank Nigeria, Ife Branch',
    numberOfDependents: 5,
    children: [
      { name: 'Gboyega Salawu', age: 18 },
      { name: 'Segun Salawu', age: 15 },
      { name: 'Toyin Salawu', age: 13 },
      { name: 'Kunle Salawu', age: 10 },
      { name: 'Niyi Salawu', age: 7 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-07-20T00:00:00.000Z',
    updatedAt: '2024-07-20T00:00:00.000Z',
  },
  {
    id: 'sp-12',
    userId: 'u-17',
    staffId: 'STF-012',
    ippisNumber: 'IPPIS-883012',
    phoneNumber: '08066779900',
    middleName: 'Eniola',
    gender: 'FEMALE',
    department: 'Pharmacy',
    faculty: 'Pharmaceutical Sciences',
    rank: 'Lecturer I',
    salaryLevel: 'CONUASS 3',
    salaryStep: 'Step 2',
    salaryGradeLevel: 'CONUASS 3 Step 2',
    employmentDate: '2019-09-01',
    maritalStatus: 'SINGLE',
    numberOfDependents: 0,
    children: [],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-08-05T00:00:00.000Z',
    updatedAt: '2024-08-05T00:00:00.000Z',
  },
  {
    id: 'sp-13',
    userId: 'u-18',
    staffId: 'STF-013',
    ippisNumber: 'IPPIS-883013',
    phoneNumber: '08077880011',
    middleName: 'Chukwudi',
    gender: 'MALE',
    department: 'Architecture',
    faculty: 'Environmental Design',
    rank: 'Associate Professor',
    salaryLevel: 'CONUASS 6',
    salaryStep: 'Step 5',
    salaryGradeLevel: 'CONUASS 6 Step 5',
    employmentDate: '2011-11-01',
    maritalStatus: 'MARRIED',
    spouseName: 'Barr. (Mrs) Ngozi Okafor',
    spouseEmployedInOAU: true,
    spouseDepartment: 'Jurisprudence & International Law',
    spouseEmploymentAddress: 'Faculty of Law, OAU, Ile-Ife',
    numberOfDependents: 3,
    children: [
      { name: 'Kenechukwu Okafor', age: 11 },
      { name: 'Chidimma Okafor', age: 8 },
      { name: 'Ifeanyi Okafor', age: 5 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-08-20T00:00:00.000Z',
    updatedAt: '2024-08-20T00:00:00.000Z',
  },
  {
    id: 'sp-14',
    userId: 'u-19',
    staffId: 'STF-014',
    ippisNumber: 'IPPIS-883014',
    phoneNumber: '08088991122',
    middleName: 'Hadiza',
    gender: 'FEMALE',
    department: 'Agricultural Economics',
    faculty: 'Agriculture',
    rank: 'Senior Lecturer',
    salaryLevel: 'CONUASS 5',
    salaryStep: 'Step 4',
    salaryGradeLevel: 'CONUASS 5 Step 4',
    employmentDate: '2014-07-01',
    maritalStatus: 'DIVORCED',
    numberOfDependents: 2,
    children: [
      { name: 'Hamza Suleiman', age: 10 },
      { name: 'Safiya Suleiman', age: 7 },
    ],
    currentHousingStatus: 'NO_ALLOCATION',
    createdAt: '2024-09-01T00:00:00.000Z',
    updatedAt: '2024-09-01T00:00:00.000Z',
  },
];

const initialHousingTypes: HousingType[] = [
  {
    id: 'ht-1',
    name: 'A1',
    buildingType: 'STOREY',
    numberOfBedrooms: 5,
    numberOfBathrooms: 4,
    numberOfToilets: 4,
    hasStudyRoom: true,
    parkingSpace: 'Garage',
    hasBQ: true,
    hasCourtyard: false,
    allocationPoints: 36,
    annualRent: 220000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-2',
    name: 'B1/2',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    numberOfToilets: 2,
    hasStudyRoom: true,
    parkingSpace: 'Garage',
    hasBQ: true,
    hasCourtyard: true,
    allocationPoints: 33,
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
    numberOfToilets: 2,
    hasStudyRoom: true,
    parkingSpace: 'Car Park',
    hasBQ: true,
    hasCourtyard: true,
    allocationPoints: 32,
    annualRent: 160000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-4',
    name: 'H',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 2,
    numberOfBathrooms: 2,
    numberOfToilets: 2,
    hasStudyRoom: true,
    parkingSpace: 'Garage',
    hasBQ: true,
    hasCourtyard: false,
    allocationPoints: 32,
    annualRent: 90000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-5',
    name: 'LG House',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    numberOfToilets: 2,
    hasStudyRoom: false,
    parkingSpace: 'Car Park',
    hasBQ: true,
    hasCourtyard: false,
    allocationPoints: 24,
    annualRent: 100000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'ht-6',
    name: 'JSQ 1',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 3,
    numberOfBathrooms: 0,
    numberOfToilets: 1,
    hasStudyRoom: false,
    parkingSpace: 'Nil',
    hasBQ: false,
    hasCourtyard: true,
    allocationPoints: 0,
    annualRent: 60000,
    isActive: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const initialHousingUnits: HousingUnit[] = [
  {
    id: 'hu-1',
    name: 'Qtrs 14',
    houseNumber: '14',
    roadNumber: '1',
    housingTypeId: 'ht-1',
    status: 'OCCUPIED',
    currentOccupantId: 'u-6',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'hu-2',
    name: 'Qtrs 15',
    houseNumber: '15',
    roadNumber: '1',
    housingTypeId: 'ht-1',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-3',
    name: 'Blk A1',
    houseNumber: '7A',
    roadNumber: '7A',
    housingTypeId: 'ht-2',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-4',
    name: 'Blk A2',
    houseNumber: '8A',
    roadNumber: '8A',
    housingTypeId: 'ht-2',
    status: 'UNDER_MAINTENANCE',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
  },
  {
    id: 'hu-5',
    name: 'Prof Qtrs 01',
    houseNumber: '12B',
    roadNumber: '12B Circle',
    housingTypeId: 'ht-3',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-6',
    name: 'Prof Qtrs 02',
    houseNumber: '14',
    roadNumber: '14 Close',
    housingTypeId: 'ht-3',
    status: 'OCCUPIED',
    currentOccupantId: 'u-8',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-03-10T00:00:00.000Z',
  },
  {
    id: 'hu-7',
    name: 'Qtrs 16',
    houseNumber: '20D',
    roadNumber: '20D',
    housingTypeId: 'ht-1',
    status: 'OCCUPIED',
    currentOccupantId: 'u-10',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-05-20T00:00:00.000Z',
  },
  {
    id: 'hu-8',
    name: 'Blk B1',
    houseNumber: '24',
    roadNumber: '24',
    housingTypeId: 'ht-2',
    status: 'VACANT',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'hu-9',
    name: 'Blk B2',
    houseNumber: '25',
    roadNumber: '24',
    housingTypeId: 'ht-2',
    status: 'UNDER_MAINTENANCE',
    currentOccupantId: null,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2025-04-12T00:00:00.000Z',
  },
  {
    id: 'hu-10',
    name: 'Qtrs 17',
    houseNumber: '17',
    roadNumber: '1',
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

// ---------------------------------------------------------------------------
// Helper: canonical inspection data for seed applications
// ---------------------------------------------------------------------------

const sampleInspectionData_hu2: InspectionData = {
  'hu-2': {
    'str-walls':     'GOOD',
    'str-roof':      'FAIR',
    'str-floors':    'GOOD',
    'str-windows':   'GOOD',
    'util-water':    'GOOD',
    'util-drainage': 'GOOD',
    'util-sanitary': 'FAIR',
    'env-compound':  'GOOD',
    'env-waste':     'GOOD',
    'bq-cond':       'NA',
  },
};

const sampleInspectionData_hu8: InspectionData = {
  'hu-8': {
    'str-walls':     'GOOD',
    'str-roof':      'GOOD',
    'str-floors':    'GOOD',
    'str-windows':   'FAIR',
    'util-water':    'FAIR',
    'util-drainage': 'GOOD',
    'util-sanitary': 'GOOD',
    'env-compound':  'FAIR',
    'env-waste':     'GOOD',
    'bq-cond':       'GOOD',
  },
};

const sampleInspectionData_hu10: InspectionData = {
  'hu-10': {
    'str-walls':     'GOOD',
    'str-roof':      'GOOD',
    'str-floors':    'FAIR',
    'str-windows':   'GOOD',
    'util-water':    'GOOD',
    'util-drainage': 'FAIR',
    'util-sanitary': 'GOOD',
    'env-compound':  'GOOD',
    'env-waste':     'GOOD',
    'bq-cond':       'NA',
  },
};

// Dual-unit inspection: HS suggested hu-5, EO selected hu-8 (different)
const sampleInspectionData_dual_hu5_hu8: InspectionData = {
  'hu-5': {
    'str-walls':     'GOOD',
    'str-roof':      'FAIR',
    'str-floors':    'GOOD',
    'str-windows':   'GOOD',
    'util-water':    'FAIR',
    'util-drainage': 'GOOD',
    'util-sanitary': 'GOOD',
    'env-compound':  'GOOD',
    'env-waste':     'FAIR',
    'bq-cond':       'GOOD',
  },
  'hu-8': {
    'str-walls':     'GOOD',
    'str-roof':      'GOOD',
    'str-floors':    'FAIR',
    'str-windows':   'GOOD',
    'util-water':    'GOOD',
    'util-drainage': 'GOOD',
    'util-sanitary': 'FAIR',
    'env-compound':  'GOOD',
    'env-waste':     'GOOD',
    'bq-cond':       'GOOD',
  },
};

// Dual-unit inspection: HS suggested hu-2, EO selected hu-10 (different)
const sampleInspectionData_dual_hu2_hu10: InspectionData = {
  'hu-2': {
    'str-walls':     'GOOD',
    'str-roof':      'FAIR',
    'str-floors':    'GOOD',
    'str-windows':   'GOOD',
    'util-water':    'GOOD',
    'util-drainage': 'FAIR',
    'util-sanitary': 'GOOD',
    'env-compound':  'GOOD',
    'env-waste':     'GOOD',
    'bq-cond':       'NA',
  },
  'hu-10': {
    'str-walls':     'GOOD',
    'str-roof':      'GOOD',
    'str-floors':    'GOOD',
    'str-windows':   'FAIR',
    'util-water':    'GOOD',
    'util-drainage': 'GOOD',
    'util-sanitary': 'GOOD',
    'env-compound':  'FAIR',
    'env-waste':     'GOOD',
    'bq-cond':       'NA',
  },
};

const initialHousingApplications: HousingApplication[] = [
  {
    // app-1: APPROVED — HS suggested hu-3, EO accepted same, DVC approved
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
    allocatedUnitId: 'hu-3',
    secretarySuggestedUnitId: 'hu-3',
    estateSuggestedUnitId: 'hu-3',
    inspectionData: {
      'hu-3': {
        'str-walls':     'GOOD',
        'str-roof':      'GOOD',
        'str-floors':    'GOOD',
        'str-windows':   'GOOD',
        'util-water':    'GOOD',
        'util-drainage': 'GOOD',
        'util-sanitary': 'GOOD',
        'env-compound':  'FAIR',
        'env-waste':     'GOOD',
        'bq-cond':       'GOOD',
      },
    },
    additionalNotes: 'Requesting junior housing close to Science faculty.',
    submittedAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-06-27T08:00:00.000Z',
  },
  {
    // app-2: PENDING — freshly submitted, HS has not reviewed yet
    id: 'app-2',
    userId: 'u-6',
    preferredHousingTypeIds: ['ht-1'],
    status: 'PENDING',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    secretarySuggestedUnitId: null,
    additionalNotes: 'Requesting upgrade from current allocation.',
    submittedAt: '2026-06-20T11:00:00.000Z',
    updatedAt: '2026-06-20T11:00:00.000Z',
  },
  {
    // app-3: ESTATE stage — HS suggested hu-8, EO has not yet acted
    // EO will decide whether to accept or suggest a different unit
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
    secretarySuggestedUnitId: 'hu-8',
    estateSuggestedUnitId: null,
    inspectionData: null,
    additionalNotes: 'Needs accommodation close to Social Sciences.',
    submittedAt: '2026-06-01T08:30:00.000Z',
    updatedAt: '2026-06-10T14:00:00.000Z',
  },
  {
    // app-4: DVC stage — HS suggested hu-2, EO selected hu-10 (DIFFERENT → dual inspection)
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
    secretarySuggestedUnitId: 'hu-2',
    estateSuggestedUnitId: 'hu-10',
    inspectionData: sampleInspectionData_dual_hu2_hu10,
    additionalNotes: undefined,
    submittedAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-06-18T09:00:00.000Z',
  },
  {
    // app-5: REJECTED at Stage 1
    id: 'app-5',
    userId: 'u-8',
    preferredHousingTypeIds: ['ht-3'],
    status: 'REJECTED',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    secretarySuggestedUnitId: null,
    additionalNotes: 'Already has an active allocation (Prof Qtrs 02).',
    submittedAt: '2026-03-01T07:00:00.000Z',
    updatedAt: '2026-03-05T11:00:00.000Z',
  },
  {
    // app-6: PENDING at Stage 1 — freshly submitted
    id: 'app-6',
    userId: 'u-10',
    preferredHousingTypeIds: ['ht-1', 'ht-3'],
    status: 'PENDING',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    secretarySuggestedUnitId: null,
    additionalNotes: 'Requesting transfer to larger unit.',
    submittedAt: '2026-06-28T09:15:00.000Z',
    updatedAt: '2026-06-28T09:15:00.000Z',
  },
  {
    // app-7: QUEUED at ESTATE — HS suggested hu-2; EO placed in queue (no unit available)
    id: 'app-7',
    userId: 'u-7',
    preferredHousingTypeIds: ['ht-1'],
    status: 'QUEUED',
    currentStage: 'ESTATE',
    pointsBreakdown: {
      baseTypePoints: 50,
      seniorityBonus: 10,
      dependentsBonus: 0,
      maritalStatusBonus: 0,
      totalPoints: 60,
    },
    secretarySuggestedUnitId: 'hu-2',
    estateSuggestedUnitId: null,
    inspectionData: null,
    additionalNotes: 'Preferred senior bungalow still occupied. Placed in queue.',
    submittedAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-06-25T16:00:00.000Z',
  },
  {
    // app-8: QUIT_REQUESTED at Stage 1
    id: 'app-8',
    userId: 'u-9',
    preferredHousingTypeIds: ['ht-2'],
    status: 'QUIT_REQUESTED',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    secretarySuggestedUnitId: null,
    additionalNotes: 'Requested withdrawal after job transfer.',
    submittedAt: '2026-06-22T14:30:00.000Z',
    updatedAt: '2026-06-26T09:00:00.000Z',
  },
  {
    // app-9: WITHDRAWN
    id: 'app-9',
    userId: 'u-11',
    preferredHousingTypeIds: ['ht-1'],
    status: 'WITHDRAWN',
    currentStage: 'HOUSING',
    allocatedUnitId: null,
    secretarySuggestedUnitId: null,
    pointsBreakdown: null,
    additionalNotes: 'Application voluntarily withdrawn.',
    submittedAt: '2026-04-10T11:00:00.000Z',
    updatedAt: '2026-04-15T15:00:00.000Z',
  },
  {
    // app-10: TERMINATED
    id: 'app-10',
    userId: 'u-8',
    preferredHousingTypeIds: ['ht-2', 'ht-3'],
    status: 'TERMINATED',
    currentStage: 'ESTATE',
    allocatedUnitId: null,
    secretarySuggestedUnitId: null,
    estateSuggestedUnitId: null,
    inspectionData: null,
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
  // ── NEW APPLICATIONS FOR THOROUGH TESTING ──────────────────────────────────

  {
    // app-11: PENDING at Stage 1 — freshly submitted by Olawale
    id: 'app-11',
    userId: 'u-12',
    preferredHousingTypeIds: ['ht-4', 'ht-2'],
    status: 'PENDING',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    secretarySuggestedUnitId: null,
    additionalNotes: 'Requesting accommodation near the Physics laboratory.',
    submittedAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  },
  {
    // app-12: UNDER_REVIEW at Stage 1 — HS saved a draft, suggested hu-8
    id: 'app-12',
    userId: 'u-13',
    preferredHousingTypeIds: ['ht-2', 'ht-5'],
    status: 'UNDER_REVIEW',
    currentStage: 'HOUSING',
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 8,
      dependentsBonus: 15,
      maritalStatusBonus: 5,
      totalPoints: 48,
    },
    secretarySuggestedUnitId: 'hu-8',
    estateSuggestedUnitId: null,
    inspectionData: null,
    additionalNotes: 'Widowed with 3 dependants — priority case.',
    submittedAt: '2026-06-28T10:30:00.000Z',
    updatedAt: '2026-07-02T09:00:00.000Z',
  },
  {
    // app-13: ESTATE stage — HS suggested hu-5, EO has not yet acted
    id: 'app-13',
    userId: 'u-14',
    preferredHousingTypeIds: ['ht-1', 'ht-3'],
    status: 'UNDER_REVIEW',
    currentStage: 'ESTATE',
    pointsBreakdown: {
      baseTypePoints: 33,
      seniorityBonus: 13,
      dependentsBonus: 10,
      maritalStatusBonus: 10,
      totalPoints: 66,
    },
    secretarySuggestedUnitId: 'hu-5',
    estateSuggestedUnitId: null,
    inspectionData: null,
    additionalNotes: 'Senior engineering staff. Requesting accommodation on main campus.',
    submittedAt: '2026-06-15T09:00:00.000Z',
    updatedAt: '2026-07-05T14:00:00.000Z',
  },
  {
    // app-14: QUEUED at Stage 2 — no suitable unit; HS did not suggest one
    id: 'app-14',
    userId: 'u-15',
    preferredHousingTypeIds: ['ht-2'],
    status: 'QUEUED',
    currentStage: 'ESTATE',
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 6,
      dependentsBonus: 5,
      maritalStatusBonus: 10,
      totalPoints: 41,
    },
    secretarySuggestedUnitId: null,
    estateSuggestedUnitId: null,
    inspectionData: null,
    additionalNotes: 'Preferred unit still under maintenance.',
    submittedAt: '2026-06-10T11:00:00.000Z',
    updatedAt: '2026-07-03T16:00:00.000Z',
  },
  {
    // app-15: DVC stage — HS suggested hu-2, EO accepted same (SAME → single inspection card)
    id: 'app-15',
    userId: 'u-16',
    preferredHousingTypeIds: ['ht-1'],
    status: 'UNDER_REVIEW',
    currentStage: 'DVC',
    pointsBreakdown: {
      baseTypePoints: 36,
      seniorityBonus: 17,
      dependentsBonus: 15,
      maritalStatusBonus: 10,
      totalPoints: 78,
    },
    secretarySuggestedUnitId: 'hu-2',
    estateSuggestedUnitId: 'hu-2',
    inspectionData: sampleInspectionData_hu2,
    additionalNotes: 'Professor with 5 dependants. Highest priority score this cycle.',
    submittedAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    // app-16: RETURNED — HS suggested hu-5, EO selected hu-8 (different); DVC returned
    id: 'app-16',
    userId: 'u-17',
    preferredHousingTypeIds: ['ht-3', 'ht-2'],
    status: 'RETURNED',
    currentStage: 'ESTATE',
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 5,
      dependentsBonus: 0,
      maritalStatusBonus: 0,
      totalPoints: 25,
    },
    secretarySuggestedUnitId: 'hu-5',
    estateSuggestedUnitId: 'hu-8',
    inspectionData: sampleInspectionData_dual_hu5_hu8,
    dvcReturnNote: 'The proposed unit (hu-8) is unsuitable — please inspect hu-10 as an alternative and resubmit.',
    dvcSuggestedUnitId: 'hu-10',
    additionalNotes: 'Requesting accommodation near the Pharmacy faculty.',
    submittedAt: '2026-05-28T09:00:00.000Z',
    updatedAt: '2026-07-06T11:00:00.000Z',
  },
  {
    // app-17: APPROVED — HS suggested hu-10, EO accepted same, DVC approved
    id: 'app-17',
    userId: 'u-18',
    preferredHousingTypeIds: ['ht-1', 'ht-3'],
    status: 'APPROVED',
    currentStage: 'COMPLETED',
    pointsBreakdown: {
      baseTypePoints: 33,
      seniorityBonus: 12,
      dependentsBonus: 10,
      maritalStatusBonus: 10,
      totalPoints: 65,
    },
    allocatedUnitId: 'hu-10',
    secretarySuggestedUnitId: 'hu-10',
    estateSuggestedUnitId: 'hu-10',
    inspectionData: sampleInspectionData_hu10,
    additionalNotes: 'Architecture dept. senior staff.',
    submittedAt: '2026-04-30T10:00:00.000Z',
    updatedAt: '2026-06-20T14:00:00.000Z',
  },
  {
    // app-18: REJECTED — rejected at Stage 1
    id: 'app-18',
    userId: 'u-19',
    preferredHousingTypeIds: ['ht-2'],
    status: 'REJECTED',
    currentStage: 'HOUSING',
    pointsBreakdown: null,
    secretarySuggestedUnitId: null,
    additionalNotes: 'Requesting accommodation near the farm institute.',
    submittedAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-05T10:00:00.000Z',
  },
  {
    // app-19: ESTATE stage — HS did not suggest; EO has not yet selected
    id: 'app-19',
    userId: 'u-12',
    preferredHousingTypeIds: ['ht-4'],
    status: 'UNDER_REVIEW',
    currentStage: 'ESTATE',
    pointsBreakdown: {
      baseTypePoints: 20,
      seniorityBonus: 4,
      dependentsBonus: 5,
      maritalStatusBonus: 10,
      totalPoints: 39,
    },
    secretarySuggestedUnitId: null,
    estateSuggestedUnitId: null,
    inspectionData: null,
    additionalNotes: 'Second application after initial withdrawal.',
    submittedAt: '2026-06-25T09:30:00.000Z',
    updatedAt: '2026-07-07T15:00:00.000Z',
  },
  {
    // app-20: RETURNED at Stage 1 (HOUSING) — DVC returned all the way back
    id: 'app-20',
    userId: 'u-14',
    preferredHousingTypeIds: ['ht-3', 'ht-2'],
    status: 'RETURNED',
    currentStage: 'HOUSING',
    pointsBreakdown: {
      baseTypePoints: 33,
      seniorityBonus: 13,
      dependentsBonus: 10,
      maritalStatusBonus: 10,
      totalPoints: 66,
    },
    secretarySuggestedUnitId: null,
    estateSuggestedUnitId: null,
    inspectionData: null,
    dvcReturnNote: 'Please re-verify the seniority bonus and confirm the applicant\'s current grade level before resubmitting. Also select a confirmed vacant unit.',
    dvcSuggestedUnitId: 'hu-10',
    additionalNotes: 'Associate Professor in Engineering.',
    submittedAt: '2026-05-05T10:00:00.000Z',
    updatedAt: '2026-07-04T09:00:00.000Z',
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
  // ── REVIEWS FOR NEW APPLICATIONS ──────────────────────────────────────────
  {
    // app-12: Stage 1 Draft saved by Housing Secretary
    id: 'rev-9',
    applicationId: 'app-12',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 48,
    decision: 'SAVE_DRAFT',
    comments: 'Draft score computed (48 pts). Priority case noted. Suggesting hu-8 provisionally.',
    suggestedUnitId: 'hu-8',
    isDraft: true,
    reviewedAt: '2026-07-02T09:00:00.000Z',
  },
  {
    // app-13: Stage 1 Completed by Housing Secretary, forwarded to Estate
    id: 'rev-10',
    applicationId: 'app-13',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 66,
    decision: 'FORWARDED',
    comments: 'High priority score (66 pts). Proposing hu-5 (Senior storey building). Forwarding to Estate Officer.',
    suggestedUnitId: 'hu-5',
    reviewedAt: '2026-07-02T11:00:00.000Z',
  },
  {
    // app-15: Stage 1 & 2 completed, sitting at Stage 3 (DVC)
    id: 'rev-11',
    applicationId: 'app-15',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 78,
    decision: 'FORWARDED',
    comments: 'Highest priority score this cycle (78 pts). Proposing hu-2.',
    suggestedUnitId: 'hu-2',
    reviewedAt: '2026-06-28T09:00:00.000Z',
  },
  {
    // app-15: Stage 2 Estate Officer review
    id: 'rev-12',
    applicationId: 'app-15',
    reviewerId: 'u-3',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'FORWARDED',
    comments: 'Physical inspection completed. hu-2 is vacant and ready for immediate occupancy. Good physical condition.',
    suggestedUnitId: 'hu-2',
    reviewedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    // app-16: Stage 1 & 2 completed, then RETURNED by DVC Admin
    id: 'rev-13',
    applicationId: 'app-16',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 25,
    decision: 'FORWARDED',
    comments: 'Score calculated: 25 pts.',
    suggestedUnitId: 'hu-5',
    reviewedAt: '2026-06-15T09:00:00.000Z',
  },
  {
    id: 'rev-14',
    applicationId: 'app-16',
    reviewerId: 'u-3',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'FORWARDED',
    comments: 'Proposed hu-5.',
    suggestedUnitId: 'hu-5',
    reviewedAt: '2026-06-20T14:00:00.000Z',
  },
  {
    id: 'rev-15',
    applicationId: 'app-16',
    reviewerId: 'u-4',
    reviewerRole: 'DVC_ADMIN',
    stage: 'DVC',
    score: null,
    decision: 'RETURNED',
    comments: 'The proposed unit (hu-5) was allocated to another staff offline. Please select an alternative vacant unit and resubmit.',
    suggestedUnitId: 'hu-8',
    reviewedAt: '2026-07-06T11:00:00.000Z',
  },
  {
    // app-17: Fully reviewed and APPROVED by DVC
    id: 'rev-16',
    applicationId: 'app-17',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 65,
    decision: 'FORWARDED',
    comments: 'Architecture dept senior staff, 65 pts. Suggested hu-10.',
    suggestedUnitId: 'hu-10',
    reviewedAt: '2026-05-10T10:00:00.000Z',
  },
  {
    id: 'rev-17',
    applicationId: 'app-17',
    reviewerId: 'u-3',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'FORWARDED',
    comments: 'hu-10 physical inspection passed (Good rating across structural and electrical).',
    suggestedUnitId: 'hu-10',
    reviewedAt: '2026-05-25T11:30:00.000Z',
  },
  {
    id: 'rev-18',
    applicationId: 'app-17',
    reviewerId: 'u-4',
    reviewerRole: 'DVC_ADMIN',
    stage: 'DVC',
    score: null,
    decision: 'APPROVED',
    comments: 'Approved allocation of hu-10.',
    suggestedUnitId: 'hu-10',
    reviewedAt: '2026-06-20T14:00:00.000Z',
  },
  {
    // app-18: REJECTED at Stage 1
    id: 'rev-19',
    applicationId: 'app-18',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: null,
    decision: 'REJECTED',
    comments: 'Incomplete documentation provided. Missing faculty recommendation letter.',
    reviewedAt: '2026-06-05T10:00:00.000Z',
  },
  {
    // app-19: Estate Officer draft saved
    id: 'rev-20',
    applicationId: 'app-19',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 39,
    decision: 'FORWARDED',
    comments: 'Score 39 pts. Forwarded to Estate Officer.',
    suggestedUnitId: 'hu-3',
    reviewedAt: '2026-06-28T09:00:00.000Z',
  },
  {
    id: 'rev-21',
    applicationId: 'app-19',
    reviewerId: 'u-3',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'SAVE_DRAFT',
    comments: 'Draft physical inspection notes recorded. Awaiting plumbing fix confirmation.',
    suggestedUnitId: 'hu-3',
    isDraft: true,
    reviewedAt: '2026-07-07T15:00:00.000Z',
  },
  {
    // app-20: Returned by DVC to Housing stage
    id: 'rev-22',
    applicationId: 'app-20',
    reviewerId: 'u-2',
    reviewerRole: 'HOUSING_SECRETARY',
    stage: 'HOUSING',
    score: 66,
    decision: 'FORWARDED',
    comments: 'Score 66 pts.',
    suggestedUnitId: null,
    reviewedAt: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'rev-23',
    applicationId: 'app-20',
    reviewerId: 'u-3',
    reviewerRole: 'ESTATE_OFFICER',
    stage: 'ESTATE',
    score: null,
    decision: 'FORWARDED',
    comments: 'Forwarded without specific unit assignment.',
    reviewedAt: '2026-05-20T10:00:00.000Z',
  },
  {
    id: 'rev-24',
    applicationId: 'app-20',
    reviewerId: 'u-4',
    reviewerRole: 'DVC_ADMIN',
    stage: 'DVC',
    score: null,
    decision: 'RETURNED',
    comments: 'Please re-verify the seniority bonus and confirm the applicant\'s current grade level before resubmitting. Also select a confirmed vacant unit.',
    suggestedUnitId: 'hu-10',
    reviewedAt: '2026-07-04T09:00:00.000Z',
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

// Correction pass: strip allocatedUnitId from any application that was not APPROVED.
// This guards against stale values written by old code paths (e.g., the previous
// requeueApplication which wrote allocatedUnitId prematurely before DVC approval).
for (const app of mockDB.housingApplications) {
  if (app.status !== 'APPROVED' && app.allocatedUnitId) {
    app.allocatedUnitId = null;
  }
}

// Sync missing reviews into hot-reloaded singleton
for (const rev of initialApplicationReviews) {
  if (!mockDB.applicationReviews.some(r => r.id === rev.id)) {
    mockDB.applicationReviews.push(rev);
  }
}

// Correction pass: remove any SAVE_DRAFT records for an application+stage combination
// that already has a final (non-draft) review. This fixes stale state from the old
// code path that kept both records coexisting.
{
  const finalReviewKeys = new Set(
    mockDB.applicationReviews
      .filter(r => !r.isDraft)
      .map(r => `${r.applicationId}:${r.stage}`)
  );
  mockDB.applicationReviews = mockDB.applicationReviews.filter(
    r => !r.isDraft || !finalReviewKeys.has(`${r.applicationId}:${r.stage}`)
  );
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
