// =============================================================================
// Mock API — Metrics Endpoint
// Provides aggregated dashboard metrics for each role
// =============================================================================

import { mockDB } from '../db';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

export async function getAdminMetrics() {
  await delay(200);

  const totalUsers = mockDB.users.length;
  const totalStaff = mockDB.users.filter(u => u.role === 'STAFF').length;
  const totalHousingUnits = mockDB.housingUnits.length;
  const vacantUnits = mockDB.housingUnits.filter(u => u.status === 'VACANT').length;
  const occupiedUnits = mockDB.housingUnits.filter(u => u.status === 'OCCUPIED').length;
  const underMaintenanceUnits = mockDB.housingUnits.filter(u => u.status === 'UNDER_MAINTENANCE').length;
  const totalApplications = mockDB.housingApplications.length;
  const pendingApplications = mockDB.housingApplications.filter(a => a.status === 'PENDING').length;
  const totalHousingTypes = mockDB.housingTypes.filter(ht => ht.isActive).length;
  const openTickets = mockDB.incidentTickets.filter(t => t.status === 'OPEN').length;

  return {
    totalUsers,
    totalStaff,
    totalHousingUnits,
    vacantUnits,
    occupiedUnits,
    underMaintenanceUnits,
    totalApplications,
    pendingApplications,
    totalHousingTypes,
    openTickets,
  };
}

export async function getManagementMetrics() {
  await delay(200);

  const totalHousingUnits = mockDB.housingUnits.length;
  const vacantUnits = mockDB.housingUnits.filter(u => u.status === 'VACANT').length;
  const occupiedUnits = mockDB.housingUnits.filter(u => u.status === 'OCCUPIED').length;
  const totalApplications = mockDB.housingApplications.length;
  const pendingApplications = mockDB.housingApplications.filter(a => a.currentStage === 'HOUSING').length;
  const estateQueueCount = mockDB.housingApplications.filter(a => a.currentStage === 'ESTATE').length;
  const dvcQueueCount = mockDB.housingApplications.filter(a => a.currentStage === 'DVC').length;

  // Exit notice pipeline metrics
  const activeExitNotices = mockDB.exitNotices.filter(e => !e.isCleared).length;
  const pendingHousingInspections = mockDB.exitNotices.filter(
    e => !e.isCleared && e.housingInspectionStatus === 'PENDING'
  ).length;
  const pendingElectricalInspections = mockDB.exitNotices.filter(
    e =>
      !e.isCleared &&
      e.housingInspectionStatus === 'PASSED' &&
      e.electricalInspectionStatus === 'PENDING'
  ).length;
  const pendingEstateInspections = mockDB.exitNotices.filter(
    e =>
      !e.isCleared &&
      e.housingInspectionStatus === 'PASSED' &&
      e.electricalInspectionStatus === 'PASSED' &&
      e.estateInspectionStatus === 'PENDING'
  ).length;

  const openTickets = mockDB.incidentTickets.filter(t => t.status !== 'RESOLVED').length;

  return {
    totalHousingUnits,
    vacantUnits,
    occupiedUnits,
    totalApplications,
    pendingApplications,
    estateQueueCount,
    dvcQueueCount,
    activeExitNotices,
    pendingHousingInspections,
    pendingElectricalInspections,
    pendingEstateInspections,
    openTickets,
  };
}

export async function getStaffDashboardData(userId: string) {
  await delay(300);

  const user = mockDB.users.find(u => u.id === userId);
  const profile = mockDB.staffProfiles.find(p => p.userId === userId);
  const activeApplication = mockDB.getActiveApplicationForUser(userId);
  const activeExitNotice = mockDB.findActiveExitNoticeByUserId(userId);
  const activeOccupancy = mockDB.findActiveOccupancyByUserId(userId);

  let currentUnit = null;
  let currentUnitBQs = null;
  if (activeOccupancy) {
    currentUnit = mockDB.findUnitById(activeOccupancy.housingUnitId) ?? null;
    if (currentUnit) {
      currentUnitBQs = mockDB.getBQsForUnit(currentUnit.id).map(bq => ({
        ...bq,
        occupant: mockDB.bqOccupants.find(o => o.bqId === bq.id) ?? null,
      }));
    }
  }

  return {
    user,
    profile,
    activeApplication,
    activeExitNotice,
    activeOccupancy,
    currentUnit,
    currentUnitBQs,
  };
}
