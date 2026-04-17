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

// Definition for our in-memory DB
export class MockDB {
  public users: User[];
  public housingTypes: HousingType[];

  constructor() {
    this.users = [...initialUsers];
    this.housingTypes = [...initialHousingTypes];
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
