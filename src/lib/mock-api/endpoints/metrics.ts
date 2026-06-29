// =============================================================================
// Mock API — Metrics Endpoint
// Provides aggregated dashboard metrics AND snapshot lists for each role
// =============================================================================

import { mockDB } from '../db';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enrichApplication(appId: string) {
  const app = mockDB.housingApplications.find(a => a.id === appId);
  if (!app) return null;
  const user = mockDB.findUserById(app.userId);
  const profile = mockDB.staffProfiles.find(p => p.userId === app.userId);
  return { ...app, applicantUser: user ?? null, applicantProfile: profile ?? null };
}

function enrichExitNotice(exitId: string) {
  const notice = mockDB.exitNotices.find(e => e.id === exitId);
  if (!notice) return null;
  const user = mockDB.findUserById(notice.userId);
  const unit = mockDB.findUnitById(notice.housingUnitId);
  const housingType = unit ? mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId) : null;
  return { ...notice, occupantUser: user ?? null, housingUnit: unit ?? null, housingType: housingType ?? null };
}

// ---------------------------------------------------------------------------
// SUPER_ADMIN dashboard data
// ---------------------------------------------------------------------------

export async function getAdminMetrics() {
  await delay(200);

  const totalUsers = mockDB.users.length;
  const totalStaff = mockDB.users.filter(u => u.role === 'STAFF').length;
  const activeStaff = mockDB.users.filter(u => u.role === 'STAFF' && u.isActive).length;
  const totalHousingUnits = mockDB.housingUnits.length;
  const vacantUnits = mockDB.housingUnits.filter(u => u.status === 'VACANT').length;
  const occupiedUnits = mockDB.housingUnits.filter(u => u.status === 'OCCUPIED').length;
  const underMaintenanceUnits = mockDB.housingUnits.filter(u => u.status === 'UNDER_MAINTENANCE').length;
  const totalApplications = mockDB.housingApplications.length;
  const pendingApplications = mockDB.housingApplications.filter(a => a.status === 'PENDING').length;
  const approvedApplications = mockDB.housingApplications.filter(a => a.status === 'APPROVED').length;
  const rejectedApplications = mockDB.housingApplications.filter(a => a.status === 'REJECTED').length;
  const totalHousingTypes = mockDB.housingTypes.filter(ht => ht.isActive).length;
  const openTickets = mockDB.incidentTickets.filter(t => t.status === 'OPEN').length;
  const activeExitNotices = mockDB.exitNotices.filter(e => !e.isCleared).length;

  // Snapshot lists
  const recentApplications = [...mockDB.housingApplications]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(a => enrichApplication(a.id))
    .filter(Boolean);

  const recentAuditLogs = [...mockDB.auditLogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(log => {
      const actor = mockDB.findUserById(log.actorId);
      return { ...log, actorUser: actor ?? null };
    });

  const recentIncidents = [...mockDB.incidentTickets]
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5)
    .map(t => {
      const reporter = mockDB.findUserById(t.userId);
      return { ...t, reporterUser: reporter ?? null };
    });

  const usersByRole = {
    SUPER_ADMIN: mockDB.users.filter(u => u.role === 'SUPER_ADMIN').length,
    HOUSING_SECRETARY: mockDB.users.filter(u => u.role === 'HOUSING_SECRETARY').length,
    ESTATE_OFFICER: mockDB.users.filter(u => u.role === 'ESTATE_OFFICER').length,
    DVC_ADMIN: mockDB.users.filter(u => u.role === 'DVC_ADMIN').length,
    ELECTRICAL_OFFICER: mockDB.users.filter(u => u.role === 'ELECTRICAL_OFFICER').length,
    STAFF: totalStaff,
  };

  return {
    totalUsers,
    totalStaff,
    activeStaff,
    totalHousingUnits,
    vacantUnits,
    occupiedUnits,
    underMaintenanceUnits,
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    totalHousingTypes,
    openTickets,
    activeExitNotices,
    usersByRole,
    recentApplications,
    recentAuditLogs,
    recentIncidents,
  };
}

// ---------------------------------------------------------------------------
// HOUSING_SECRETARY dashboard data
// ---------------------------------------------------------------------------

export async function getHousingSecretaryDashboardData() {
  await delay(200);

  const myQueueApps = mockDB.housingApplications.filter(a => a.currentStage === 'HOUSING');
  const forwardedCount = mockDB.housingApplications.filter(a => a.currentStage === 'ESTATE' || a.currentStage === 'DVC').length;
  const activeExits = mockDB.exitNotices.filter(e => !e.isCleared);
  const pendingHousingInspections = activeExits.filter(e => e.housingInspectionStatus === 'PENDING').length;

  const queueSnapshot = myQueueApps
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(a => enrichApplication(a.id))
    .filter(Boolean);

  const exitSnapshot = activeExits
    .filter(e => e.housingInspectionStatus === 'PENDING')
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(e => enrichExitNotice(e.id))
    .filter(Boolean);

  const recentActivity = [...mockDB.auditLogs]
    .filter(l => l.actorId === 'u-2') // Housing Secretary user
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    myQueueCount: myQueueApps.length,
    forwardedCount,
    activeExitCount: activeExits.length,
    pendingHousingInspections,
    queueSnapshot,
    exitSnapshot,
    recentActivity,
  };
}

// ---------------------------------------------------------------------------
// ESTATE_OFFICER dashboard data
// ---------------------------------------------------------------------------

export async function getEstateDashboardData() {
  await delay(200);

  const estateQueueApps = mockDB.housingApplications.filter(a => a.currentStage === 'ESTATE');
  const totalHousingUnits = mockDB.housingUnits.length;
  const vacantUnits = mockDB.housingUnits.filter(u => u.status === 'VACANT').length;

  const pendingEstateExits = mockDB.exitNotices.filter(
    e => !e.isCleared &&
      e.housingInspectionStatus === 'PASSED' &&
      e.electricalInspectionStatus === 'PASSED' &&
      e.estateInspectionStatus === 'PENDING'
  );

  const estateQueueSnapshot = estateQueueApps
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(a => enrichApplication(a.id))
    .filter(Boolean);

  const inventorySnapshot = [...mockDB.housingUnits]
    .slice(0, 8)
    .map(unit => {
      const housingType = mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId);
      const occupant = unit.currentOccupantId ? mockDB.findUserById(unit.currentOccupantId) : null;
      return { ...unit, housingType: housingType ?? null, occupantUser: occupant ?? null };
    });

  const estateExitSnapshot = pendingEstateExits
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(e => enrichExitNotice(e.id))
    .filter(Boolean);

  return {
    estateQueueCount: estateQueueApps.length,
    totalHousingUnits,
    vacantUnits,
    pendingEstateInspections: pendingEstateExits.length,
    estateQueueSnapshot,
    inventorySnapshot,
    estateExitSnapshot,
  };
}

// ---------------------------------------------------------------------------
// DVC_ADMIN dashboard data
// ---------------------------------------------------------------------------

export async function getDvcDashboardData() {
  await delay(200);

  const dvcQueueApps = mockDB.housingApplications.filter(a => a.currentStage === 'DVC');
  const totalApplications = mockDB.housingApplications.length;
  const approvedApps = mockDB.housingApplications.filter(a => a.status === 'APPROVED');
  const rejectedApps = mockDB.housingApplications.filter(a => a.status === 'REJECTED');

  const pipelineCounts = {
    HOUSING: mockDB.housingApplications.filter(a => a.currentStage === 'HOUSING').length,
    ESTATE: mockDB.housingApplications.filter(a => a.currentStage === 'ESTATE').length,
    DVC: dvcQueueApps.length,
    COMPLETED: mockDB.housingApplications.filter(a => a.currentStage === 'COMPLETED').length,
    REJECTED: rejectedApps.length,
  };

  const dvcQueueSnapshot = dvcQueueApps
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(a => {
      const enriched = enrichApplication(a.id);
      if (!enriched) return null;
      // Find the estate officer review
      const estateReview = mockDB.applicationReviews.find(
        r => r.applicationId === a.id && r.reviewerRole === 'ESTATE_OFFICER'
      );
      const estateReviewer = estateReview ? mockDB.findUserById(estateReview.reviewerId) : null;
      return { ...enriched, estateReviewer: estateReviewer ?? null };
    })
    .filter(Boolean);

  return {
    dvcQueueCount: dvcQueueApps.length,
    totalApplications,
    approvedCount: approvedApps.length,
    rejectedCount: rejectedApps.length,
    pipelineCounts,
    dvcQueueSnapshot,
  };
}

// ---------------------------------------------------------------------------
// ELECTRICAL_OFFICER dashboard data
// ---------------------------------------------------------------------------

export async function getElectricalDashboardData() {
  await delay(200);

  const myQueue = mockDB.exitNotices.filter(
    e => e.housingInspectionStatus === 'PASSED' &&
      e.electricalInspectionStatus === 'PENDING' &&
      !e.isCleared
  );

  const recentlyPassed = mockDB.exitNotices.filter(
    e => e.electricalInspectionStatus === 'PASSED'
  );

  const awaitingCount = myQueue.length;
  const passedThisWeek = recentlyPassed.filter(e => {
    if (!e.electricalInspectionDate) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(e.electricalInspectionDate) >= weekAgo;
  }).length;

  const failedCount = mockDB.exitNotices.filter(
    e => e.electricalInspectionStatus === 'FAILED' && !e.isCleared
  ).length;

  const myQueueSnapshot = myQueue
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(e => enrichExitNotice(e.id))
    .filter(Boolean);

  const recentlyPassedSnapshot = recentlyPassed
    .sort((a, b) => new Date(b.electricalInspectionDate!).getTime() - new Date(a.electricalInspectionDate!).getTime())
    .slice(0, 5)
    .map(e => enrichExitNotice(e.id))
    .filter(Boolean);

  return {
    awaitingCount,
    passedThisWeek,
    failedCount,
    myQueueSnapshot,
    recentlyPassedSnapshot,
  };
}

// ---------------------------------------------------------------------------
// MANAGEMENT shared metrics (used by the shared management portal)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// STAFF dashboard data
// ---------------------------------------------------------------------------

export async function getStaffDashboardData(userId: string) {
  await delay(300);

  const user = mockDB.users.find(u => u.id === userId);
  const profile = mockDB.staffProfiles.find(p => p.userId === userId);
  const activeApplication = mockDB.getActiveApplicationForUser(userId);
  const activeExitNotice = mockDB.findActiveExitNoticeByUserId(userId);
  const activeOccupancy = mockDB.findActiveOccupancyByUserId(userId);

  // All application history for this user
  const applicationHistory = [...mockDB.housingApplications]
    .filter(a => a.userId === userId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // Pending allocation offer
  const allocationOffer = mockDB.allocations.find(
    a => a.userId === userId && a.status === 'PENDING'
  ) ?? null;

  let allocationOfferUnit = null;
  if (allocationOffer) {
    allocationOfferUnit = mockDB.findUnitById(allocationOffer.housingUnitId) ?? null;
  }

  let currentUnit = null;
  let currentUnitBQs = null;
  let tenancyAgreement = null;

  if (activeOccupancy) {
    currentUnit = mockDB.findUnitById(activeOccupancy.housingUnitId) ?? null;
    if (currentUnit) {
      currentUnitBQs = mockDB.getBQsForUnit(currentUnit.id).map(bq => ({
        ...bq,
        occupant: mockDB.bqOccupants.find(o => o.bqId === bq.id) ?? null,
      }));
    }
    // Find tenancy agreement for this occupancy
    tenancyAgreement = mockDB.tenancyAgreements.find(
      t => t.occupancyId === activeOccupancy.id
    ) ?? null;
  }

  return {
    user,
    profile,
    activeApplication,
    activeExitNotice,
    activeOccupancy,
    currentUnit,
    currentUnitBQs,
    applicationHistory,
    allocationOffer,
    allocationOfferUnit,
    tenancyAgreement,
  };
}
