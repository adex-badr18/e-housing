import { mockDB } from '../db';

export async function getAdminMetrics() {
  await new Promise(resolve => setTimeout(resolve, 200));

  const totalUsers = mockDB.users.length;
  const totalHousingUnits = mockDB.housingUnits.length;
  const vacantUnits = mockDB.housingUnits.filter(u => u.status === 'VACANT').length;
  const totalApplications = mockDB.housingApplications.length;

  return {
    totalUsers,
    totalHousingUnits,
    vacantUnits,
    totalApplications
  };
}

export async function getManagementMetrics() {
  await new Promise(resolve => setTimeout(resolve, 200));

  const totalHousingUnits = mockDB.housingUnits.length;
  const vacantUnits = mockDB.housingUnits.filter(u => u.status === 'VACANT').length;
  const totalApplications = mockDB.housingApplications.length;
  const pendingApplications = mockDB.housingApplications.filter(a => a.status === 'PENDING').length;
  
  // Exits requiring inspections
  const pendingInspections = mockDB.exitRequests.filter(e => 
    e.housingInspectionStatus === 'PENDING' || 
    e.electricalInspectionStatus === 'PENDING' || 
    e.estateInspectionStatus === 'PENDING'
  ).length;

  return {
    totalHousingUnits,
    vacantUnits,
    totalApplications,
    pendingApplications,
    pendingInspections
  };
}

export async function getStaffDashboardData(userId: string) {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const user = mockDB.users.find(u => u.id === userId);
  const profile = mockDB.staffProfiles.find(p => p.userId === userId);
  const activeApplication = mockDB.housingApplications.find(a => a.userId === userId && (a.status === 'PENDING' || a.status === 'UNDER_REVIEW'));
  const activeExitRequest = mockDB.exitRequests.find(e => e.userId === userId && !e.isCleared);
  const currentAllocation = profile?.currentHousingStatus === 'HAS_ALLOCATION' ? mockDB.housingUnits.find(u => u.status === 'OCCUPIED') : null; // Mocking specific allocation logic just as boolean indicator for now.

  return {
    user,
    profile,
    activeApplication,
    activeExitRequest,
    currentAllocation
  };
}
