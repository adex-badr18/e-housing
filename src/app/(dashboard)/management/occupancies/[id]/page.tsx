import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getOccupancyDetails } from '@/lib/mock-api/endpoints/occupancies';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Users2,
  Building2,
  FileText,
  CheckCircle2,
  LogOut as LogOutIcon,
  Home,
  BedDouble,
  Bath,
  Car,
  Trees,
  BookOpen,
  Coins,
  Calendar,
  Phone,
  Mail,
  GraduationCap,
  AlertCircle,
  ScrollText,
  Clock,
  User,
} from 'lucide-react';
import type { Role, OccupancyStatus } from '@/lib/mock-api/db';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RevokeAllocationModal } from '@/components/features/occupancies/ActionModals';
import { TriggerExitModal } from '@/components/features/occupancies/ActionModals';
import { UpdateOccupancyModal } from '@/components/features/occupancies/ActionModals';

export const metadata = {
  title: 'Occupancy Details — OAU E-Housing',
  description: 'Full occupancy details for a housing allocation record.',
};

const ALLOWED_ROLES: Role[] = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN'];
const REVOKE_ROLES: Role[] = ['SUPER_ADMIN', 'HOUSING_SECRETARY', 'ESTATE_OFFICER'];
const EXIT_TRIGGER_ROLES: Role[] = ['SUPER_ADMIN', 'ESTATE_OFFICER'];
const UPDATE_ROLES: Role[] = ['SUPER_ADMIN', 'ESTATE_OFFICER'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(dateStr: string | null | undefined, fallback = '—') {
  if (!dateStr) return fallback;
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return fallback;
  }
}

function OccupancyStatusBadge({ status }: { status: OccupancyStatus }) {
  if (status === 'ACTIVE') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border font-semibold text-sm px-3 py-1 gap-1.5">
        <CheckCircle2 className="h-4 w-4" />
        Active
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-100 text-rose-800 border-rose-200 border font-semibold text-sm px-3 py-1 gap-1.5">
      <LogOutIcon className="h-4 w-4" />
      Exited
    </Badge>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-xs font-medium text-gray-500 shrink-0 min-w-[140px]">{label}</span>
      <span className="text-xs text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className={cn('p-2 rounded-lg', iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InspectionStatusBadge({ status }: { status: string }) {
  const config = {
    PASSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  }[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <Badge className={cn('border text-xs font-medium px-2 py-0.5', config)}>
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OccupancyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) redirect('/login');

  if (!ALLOWED_ROLES.includes(session.user.role as Role)) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view occupancy details.
        </p>
        <Link href="/management/occupancies" className="text-sm text-primary hover:underline">
          ← Return to Occupancies
        </Link>
      </div>
    );
  }

  const details = await getOccupancyDetails(id);
  if (!details) notFound();

  const {
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
  } = details;

  const userRole = session.user.role as Role;
  const canTriggerExit = EXIT_TRIGGER_ROLES.includes(userRole) && occupancy.status === 'ACTIVE';
  const canRevoke = REVOKE_ROLES.includes(userRole) && occupancy.status === 'ACTIVE';
  const canUpdate = UPDATE_ROLES.includes(userRole);
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Occupant';

  // Active exit notice (latest uncleared)
  const activeExitNotice = exitNotices.find(e => !e.isCleared && !e.isWithdrawn);

  return (
    <div className="w-full space-y-6">
      {/* Back link */}
      <Link
        href="/management/occupancies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Housing Occupancies
      </Link>

      {/* Page Header */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-start gap-4">
          {/* Avatar Placeholder */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center">
            <User className="h-7 w-7 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
              <OccupancyStatusBadge status={occupancy.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
              {profile?.staffId && <span>Staff ID: <strong className="text-gray-700">{profile.staffId}</strong></span>}
              {profile?.department && <span>Dept: <strong className="text-gray-700">{profile.department}</strong></span>}
              {unit && <span>Unit: <strong className="text-gray-700">{unit.name}</strong></span>}
              <span>Check-in: <strong className="text-gray-700">{fmt(occupancy.checkInDate)}</strong></span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {tenancyAgreement?.documentUrl && (
              <a
                href={tenancyAgreement.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-view-tenancy"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ScrollText className="h-4 w-4 text-blue-600" />
                Tenancy Agreement
              </a>
            )}
            {canUpdate && (
              <UpdateOccupancyModal
                occupancyId={occupancy.id}
                currentCheckIn={occupancy.checkInDate}
                currentCheckOut={occupancy.checkOutDate}
              />
            )}
            {canTriggerExit && (
              <TriggerExitModal occupancyId={occupancy.id} occupantName={fullName} />
            )}
            {canRevoke && (
              <RevokeAllocationModal
                occupancyId={occupancy.id}
                occupantName={fullName}
                unitName={unit?.name ?? 'this unit'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 1. Occupant Information */}
        <SectionCard title="Occupant Information" icon={Users2} iconColor="bg-blue-100 text-blue-600">
          <div className="space-y-0">
            <InfoRow label="Full Name" value={fullName} />
            {profile?.title && <InfoRow label="Title" value={profile.title} />}
            <InfoRow label="Staff ID" value={profile?.staffId} />
            <InfoRow label="Department" value={profile?.department} />
            <InfoRow label="Faculty" value={profile?.faculty} />
            <InfoRow label="Rank" value={profile?.rank} />
            <InfoRow label="Salary Level" value={profile?.salaryLevel ? `Level ${profile.salaryLevel}` : undefined} />
            <InfoRow label="Salary Step" value={profile?.salaryStep ? `Step ${profile.salaryStep}` : undefined} />
            <InfoRow label="Salary Grade" value={profile?.salaryGradeLevel} />
            <InfoRow label="Marital Status" value={profile?.maritalStatus} />
            <InfoRow label="Dependants" value={profile?.numberOfDependents !== undefined ? profile.numberOfDependents : undefined} />
            {user?.phoneNumber && (
              <InfoRow
                label="Phone"
                value={
                  <a href={`tel:${user.phoneNumber}`} className="flex items-center gap-1 text-blue-600">
                    <Phone className="h-3 w-3" />{user.phoneNumber}
                  </a>
                }
              />
            )}
            {user?.email && (
              <InfoRow
                label="Email"
                value={
                  <a href={`mailto:${user.email}`} className="flex items-center gap-1 text-blue-600 break-all">
                    <Mail className="h-3 w-3" />{user.email}
                  </a>
                }
              />
            )}
          </div>
        </SectionCard>

        {/* 2. Housing Unit & Type */}
        <SectionCard title="Housing Unit & Type" icon={Building2} iconColor="bg-purple-100 text-purple-600">
          {unit ? (
            <div className="space-y-0">
              {/* Unit attributes */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pt-1">Unit Details</p>
              <InfoRow label="Unit Code / Name" value={unit.name} />
              <InfoRow label="House Number" value={unit.houseNumber} />
              <InfoRow label="Road / Street" value={unit.roadNumber} />
              <InfoRow label="Unit Status" value={
                <Badge className={cn('border text-xs font-medium px-2 py-0.5',
                  unit.status === 'VACANT' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    unit.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                )}>{unit.status}</Badge>
              } />

              {housingType && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pt-4">Housing Type: {housingType.name}</p>
                  <InfoRow label="Building Type" value={housingType.buildingType === 'BUNGALOW' ? 'Bungalow' : 'Storey Building'} />
                  <InfoRow
                    label="Bedrooms"
                    value={
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3 text-gray-400" />
                        {housingType.numberOfBedrooms}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Bathrooms"
                    value={
                      <span className="flex items-center gap-1">
                        <Bath className="h-3 w-3 text-gray-400" />
                        {housingType.numberOfBathrooms}
                      </span>
                    }
                  />
                  <InfoRow label="Toilets" value={housingType.numberOfToilets} />
                  <InfoRow label="Study Room" value={housingType.hasStudyRoom ? '✓ Yes' : '✗ No'} />
                  <InfoRow
                    label="Parking Space"
                    value={
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3 text-gray-400" />
                        {housingType.parkingSpace}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Boys Quarters"
                    value={
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3 text-gray-400" />
                        {housingType.hasBQ ? '✓ Available' : '✗ None'}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Courtyard"
                    value={
                      <span className="flex items-center gap-1">
                        <Trees className="h-3 w-3 text-gray-400" />
                        {housingType.hasCourtyard ? '✓ Available' : '✗ None'}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Allocation Points"
                    value={
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-gray-400" />
                        {housingType.allocationPoints ?? '—'}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Annual Rent"
                    value={
                      <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-gray-400" />
                        ₦{housingType.annualRent.toLocaleString()}
                      </span>
                    }
                  />
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Housing unit information unavailable.</p>
          )}
        </SectionCard>

        {/* 3. Tenancy Lifecycle Timeline */}
        <SectionCard title="Tenancy Lifecycle" icon={Calendar} iconColor="bg-emerald-100 text-emerald-600">
          <div className="relative pl-5">
            <div className="absolute left-[9px] top-0 bottom-0 w-px bg-gray-200" />
            {[
              {
                label: 'Application Approved / Allocation Created',
                date: allocation?.allocatedAt,
                done: !!allocation,
              },
              {
                label: 'Occupant Responded to Offer',
                date: allocation?.respondedAt,
                done: !!allocation?.respondedAt,
                note: allocation?.status === 'ACCEPTED' ? 'Accepted' : allocation?.status === 'REJECTED' ? 'Rejected' : undefined,
              },
              {
                label: 'Tenancy Agreement Created',
                date: tenancyAgreement?.createdAt,
                done: !!tenancyAgreement,
              },
              {
                label: 'Tenancy Agreement Signed',
                date: tenancyAgreement?.signed ? tenancyAgreement.createdAt : undefined,
                done: tenancyAgreement?.signed ?? false,
                note: tenancyAgreement && !tenancyAgreement.signed ? 'Awaiting signature' : undefined,
              },
              {
                label: 'Check-in Date',
                date: occupancy.checkInDate,
                done: true,
              },
              {
                label: 'Check-out Date',
                date: occupancy.checkOutDate,
                done: !!occupancy.checkOutDate,
                note: !occupancy.checkOutDate ? 'Currently active' : undefined,
              },
            ].map(({ label, date, done, note }, i) => (
              <div key={i} className="flex items-start gap-3 pb-4 relative">
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 -ml-5 z-10',
                  done
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-gray-300'
                )} />
                <div>
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  {date ? (
                    <p className="text-[11px] text-gray-500 mt-0.5">{fmt(date)}</p>
                  ) : note ? (
                    <p className="text-[11px] text-amber-600 mt-0.5">{note}</p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-0.5">—</p>
                  )}
                  {note && date && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 4. BQs & Dependants */}
        {bqs.length > 0 && (
          <SectionCard title={`Boys Quarters (${bqs.length})`} icon={Home} iconColor="bg-amber-100 text-amber-600">
            <div className="space-y-3">
              {bqs.map(bq => {
                const occupants = bqOccupants.filter(bo => bo.bqId === bq.id);
                return (
                  <div key={bq.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-700">{bq.label}</p>
                      <Badge className={cn(
                        'border text-xs font-medium px-2 py-0.5',
                        bq.status === 'VACANT'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      )}>
                        {bq.status}
                      </Badge>
                    </div>
                    {occupants.length > 0 ? (
                      <div className="space-y-1.5">
                        {occupants.map(bo => (
                          <div key={bo.id} className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-gray-700">{bo.fullName}</span>
                            <span className="text-gray-500">{bo.relationship}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400">No registered occupants</p>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* 5. Exit Pipeline Status */}
        {(exitNotices.length > 0 || activeExitNotice) && (
          <SectionCard title="Exit Pipeline Status" icon={LogOutIcon} iconColor="bg-rose-100 text-rose-600">
            {exitNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No exit notices recorded.</p>
            ) : (
              <div className="space-y-4">
                {exitNotices.map(notice => (
                  <div key={notice.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-500" />
                        <p className="text-xs font-semibold text-gray-700">
                          Exit Reason: {notice.reason}
                          {notice.reason === 'OTHER' && notice.customReason ? ` — ${notice.customReason}` : ''}
                        </p>
                      </div>
                      {notice.isCleared && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border text-xs">Cleared</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Clock className="h-3 w-3" />
                      Submitted: {fmt(notice.submittedAt)}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { stage: 'Housing', status: notice.housingInspectionStatus, date: notice.housingInspectionDate },
                        { stage: 'Electrical', status: notice.electricalInspectionStatus, date: notice.electricalInspectionDate },
                        { stage: 'Estate', status: notice.estateInspectionStatus, date: notice.estateInspectionDate },
                      ].map(({ stage, status, date }) => (
                        <div key={stage} className="bg-white rounded-lg border border-gray-200 p-2 text-center">
                          <p className="text-[10px] font-semibold text-gray-500 mb-1">{stage}</p>
                          <InspectionStatusBadge status={status} />
                          {date && <p className="text-[10px] text-gray-400 mt-1">{fmt(date)}</p>}
                        </div>
                      ))}
                    </div>

                    {notice.additionalNotes && (
                      <p className="text-[11px] text-gray-500 italic border-t border-gray-100 pt-2">
                        {notice.additionalNotes}
                      </p>
                    )}

                    {notice.isCleared && notice.clearanceCertificateUrl && (
                      <a
                        href={notice.clearanceCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Clearance Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* Occupancy Meta Footer */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-gray-500">
        <span>Occupancy ID: <strong className="text-gray-700">{occupancy.id}</strong></span>
        <span>Created: <strong className="text-gray-700">{fmt(occupancy.createdAt)}</strong></span>
        <span>Last Updated: <strong className="text-gray-700">{fmt(occupancy.updatedAt)}</strong></span>
        {tenancyAgreement && (
          <span>Agreement ID: <strong className="text-gray-700">{tenancyAgreement.id}</strong></span>
        )}
      </div>
    </div>
  );
}
