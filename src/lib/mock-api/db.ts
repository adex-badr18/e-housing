export type Role = 'SUPER_ADMIN' | 'HOUSING_SECRETARY' | 'ESTATE_OFFICER' | 'DVC_ADMIN' | 'ELECTRICAL_OFFICER' | 'STAFF';

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

export type HousingCategory = 'SENIOR' | 'JUNIOR';
export type BuildingType = 'BUNGALOW' | 'STOREY';

export interface HousingType {
  id: string;
  name: string;
  category: HousingCategory;
  buildingType: BuildingType;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  numberOfToilets: number;
  hasStudyRoom: boolean;
  hasParking: boolean;
  hasBQ: boolean;
  numberOfBQ: number;
  hasCourtyard: boolean;
  allocationPoints: number;
  annualRent: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CurrentHousingStatus = 'HAS_ALLOCATION' | 'NO_ALLOCATION';
export type Gender = 'MALE' | 'FEMALE';

export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

export interface StaffProfile {
  id: string;
  userId: string;
  staffId: string;
  department: string;
  faculty: string;
  rank: string;
  salaryGradeLevel: string;
  employmentDate: string;
  maritalStatus: MaritalStatus;
  numberOfDependents: number;
  currentHousingStatus: CurrentHousingStatus;
  middleName?: string;
  gender?: Gender;
  createdAt?: string;
  updatedAt?: string;
}

export interface HousingUnit {
  id: string;
  name: string;
  housingTypeId: string;
  status: 'VACANT' | 'OCCUPIED' | 'UNDER_MAINTENANCE';
}

export interface HousingApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface HousingExitRequest {
  id: string;
  userId: string;
  isCleared: boolean;
  housingInspectionStatus: 'PENDING' | 'PASSED' | 'FAILED';
  electricalInspectionStatus: 'PENDING' | 'PASSED' | 'FAILED';
  estateInspectionStatus: 'PENDING' | 'PASSED' | 'FAILED';
}

// Initial mock data
const initialUsers: User[] = [
  { id: '1', firstName: 'Super', lastName: 'Admin', email: 'super@oauife.edu.ng', password: 'password', role: 'SUPER_ADMIN', isActive: true, mustChangePassword: false, phoneNumber: '08000000001' },
  { id: '2', firstName: 'Housing', lastName: 'Sec', email: 'hsec@oauife.edu.ng', password: 'password', role: 'HOUSING_SECRETARY', isActive: true, mustChangePassword: false, phoneNumber: '08000000002' },
  { id: '3', firstName: 'Estate', lastName: 'Officer', email: 'estate@oauife.edu.ng', password: 'password', role: 'ESTATE_OFFICER', isActive: true, mustChangePassword: false, phoneNumber: '08000000003' },
  { id: '4', firstName: 'DVC', lastName: 'Admin', email: 'dvc@oauife.edu.ng', password: 'password', role: 'DVC_ADMIN', isActive: true, mustChangePassword: false, phoneNumber: '08000000004' },
  { id: '5', firstName: 'Elec', lastName: 'Officer', email: 'elec@oauife.edu.ng', password: 'password', role: 'ELECTRICAL_OFFICER', isActive: true, mustChangePassword: false, phoneNumber: '08000000005' },
  { id: '6', firstName: 'Staff', lastName: 'User', email: 'staff@oauife.edu.ng', password: 'password', role: 'STAFF', isActive: true, mustChangePassword: false, phoneNumber: '08000000006' },
];

const initialHousingTypes: HousingType[] = [
  { 
    id: 'ht-1', 
    name: '3-Bedroom Bungalow', 
    category: 'SENIOR',
    buildingType: 'BUNGALOW',
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    numberOfToilets: 3,
    hasStudyRoom: true,
    hasParking: true,
    hasBQ: true,
    numberOfBQ: 1,
    hasCourtyard: true,
    allocationPoints: 50,
    annualRent: 150000,
    isActive: true
  },
  { 
    id: 'ht-2', 
    name: '2-Bedroom Storey', 
    category: 'JUNIOR',
    buildingType: 'STOREY',
    numberOfBedrooms: 2,
    numberOfBathrooms: 1,
    numberOfToilets: 1,
    hasStudyRoom: false,
    hasParking: false,
    hasBQ: false,
    numberOfBQ: 0,
    hasCourtyard: false,
    allocationPoints: 20,
    annualRent: 80000,
    isActive: true
  },
];

const initialStaffProfiles: StaffProfile[] = [
  {
    id: 'sp-1',
    userId: '6',
    staffId: 'STF-001',
    department: 'Computer Science',
    faculty: 'Technology',
    rank: 'Senior Lecturer',
    salaryGradeLevel: 'CONUASS 5',
    employmentDate: '2015-08-01',
    maritalStatus: 'MARRIED',
    numberOfDependents: 3,
    currentHousingStatus: 'NO_ALLOCATION',
    middleName: 'Okoro',
    gender: 'MALE',
  }
];

const initialHousingUnits: HousingUnit[] = [
  { id: 'hu-1', name: 'Qtrs 14', housingTypeId: 'ht-1', status: 'VACANT' },
  { id: 'hu-2', name: 'Qtrs 15', housingTypeId: 'ht-1', status: 'OCCUPIED' },
  { id: 'hu-3', name: 'Blk A1', housingTypeId: 'ht-2', status: 'VACANT' },
];

const initialHousingApplications: HousingApplication[] = [
  { id: 'app-1', userId: '6', status: 'PENDING' },
];

const initialExitRequests: HousingExitRequest[] = [
  { 
    id: 'ex-1', 
    userId: '7', 
    isCleared: false, 
    housingInspectionStatus: 'PENDING',
    electricalInspectionStatus: 'PENDING',
    estateInspectionStatus: 'PENDING'
  }
];

// Definition for our in-memory DB
export class MockDB {
  public users: User[];
  public housingTypes: HousingType[];
  public staffProfiles: StaffProfile[];
  public housingUnits: HousingUnit[];
  public housingApplications: HousingApplication[];
  public exitRequests: HousingExitRequest[];

  constructor() {
    this.users = [...initialUsers];
    this.housingTypes = [...initialHousingTypes];
    this.staffProfiles = [...initialStaffProfiles];
    this.housingUnits = [...initialHousingUnits];
    this.housingApplications = [...initialHousingApplications];
    this.exitRequests = [...initialExitRequests];
  }

  // Utility to find user by email
  findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }
}

// Ensure the db persists across Next.js hot reloads in dev mode
const globalForDb = globalThis as unknown as {
  mockDB: MockDB | undefined;
};

export const mockDB = globalForDb.mockDB ?? new MockDB();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mockDB = mockDB;
}
