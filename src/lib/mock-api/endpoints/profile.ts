import { mockDB, StaffProfile } from '../db';

export async function getStaffProfile(userId: string): Promise<StaffProfile | null> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
  
  const profile = mockDB.staffProfiles.find(p => p.userId === userId);
  return profile || null;
}

export async function updateStaffProfile(userId: string, data: Partial<StaffProfile>): Promise<StaffProfile> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = mockDB.staffProfiles.findIndex(p => p.userId === userId);
  
  if (index >= 0) {
    // Cannot update currentHousingStatus through this endpoint directly as per requirements
    // (staff shouldn't be able to mutate it)
    const { currentHousingStatus, ...safeData } = data;
    
    mockDB.staffProfiles[index] = {
      ...mockDB.staffProfiles[index],
      ...safeData,
      updatedAt: new Date().toISOString()
    };
    return mockDB.staffProfiles[index];
  } else {
    // Create new profile if it doesn't exist
    const newProfile: StaffProfile = {
      id: `sp-${Date.now()}`,
      userId,
      staffId: data.staffId || '',
      department: data.department || '',
      faculty: data.faculty || '',
      rank: data.rank || '',
      salaryGradeLevel: data.salaryGradeLevel || '',
      employmentDate: data.employmentDate || '',
      maritalStatus: data.maritalStatus || 'SINGLE',
      numberOfDependents: data.numberOfDependents || 0,
      currentHousingStatus: 'NO_ALLOCATION', // default
      middleName: data.middleName || '',
      gender: data.gender || 'MALE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockDB.staffProfiles.push(newProfile);
    return newProfile;
  }
}
