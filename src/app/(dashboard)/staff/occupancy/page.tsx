import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getOccupancyDetails } from '@/lib/mock-api/endpoints/occupancies';
import { mockDB } from '@/lib/mock-api/db';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Users2,
  Building2,
  CheckCircle2,
  LogOut as LogOutIcon,
  Home,
  BedDouble,
  Bath,
  Car,
  Trees,
  ScrollText,
  User,
} from 'lucide-react';
import type { OccupancyStatus } from '@/lib/mock-api/db';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

import { StaffBQManager } from './StaffBQManager';

export const metadata = {
  title: 'My Housing Occupancy — OAU E-Housing',
  description: 'View your active housing allocation details.',
};

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

export default async function StaffOccupancyPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  if (session.user.role !== 'STAFF') {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          Only staff members can view their own occupancy.
        </p>
      </div>
    );
  }

  // Find the active occupancy for this user
  const activeOccupancy = mockDB.findActiveOccupancyByUserId(session.user.id);

  if (!activeOccupancy) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-10">
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center space-y-4 shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
            <Home className="h-8 w-8 text-gray-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-gray-900 text-lg">No Active Housing Occupancy</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              You do not currently occupy any housing unit. Submit a housing application to begin the allocation process.
            </p>
          </div>
          <Link
            href="/staff/applications/new"
            className={cn(buttonVariants({ className: 'mt-2 bg-oau-navy text-white hover:bg-oau-navy/90 font-semibold shadow-md gap-2' }))}
          >
            <ScrollText className="h-4 w-4" />
            Apply for Housing
          </Link>
        </div>
      </div>
    );
  }

  // Fetch full details for the occupancy
  const details = await getOccupancyDetails(activeOccupancy.id);
  if (!details) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-destructive">Error Loading Occupancy</h1>
      </div>
    );
  }

  const {
    occupancy,
    user,
    profile,
    unit,
    housingType,
    tenancyAgreement,
    bqs,
    bqOccupants,
  } = details;

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Occupant';

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Back link */}
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Page Header */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center">
            <User className="h-7 w-7 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">My Housing Allocation</h1>
              <OccupancyStatusBadge status={occupancy.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
              {unit && <span>Unit: <strong className="text-gray-700">{unit.name}</strong></span>}
              <span>Check-in: <strong className="text-gray-700">{fmt(occupancy.checkInDate)}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {tenancyAgreement?.documentUrl && (
              <a
                href={tenancyAgreement.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ScrollText className="h-4 w-4 text-blue-600" />
                View Agreement
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Occupant Information" icon={Users2} iconColor="bg-blue-100 text-blue-600">
          <div className="space-y-0">
            <InfoRow label="Full Name" value={fullName} />
            {profile?.title && <InfoRow label="Title" value={profile.title} />}
            <InfoRow label="Staff ID" value={profile?.staffId} />
            <InfoRow label="Department" value={profile?.department} />
            <InfoRow label="Faculty" value={profile?.faculty} />
            <InfoRow label="Rank / Level" value={
              profile ? `${profile.rank} · ${profile.salaryLevel || profile.salaryGradeLevel} ${profile.salaryStep ? `(Step ${profile.salaryStep})` : ''}` : '—'
            } />
          </div>
        </SectionCard>

        <SectionCard title="Housing Unit Information" icon={Building2} iconColor="bg-teal-100 text-teal-600">
          <div className="space-y-0">
            <InfoRow label="Unit Name" value={<strong className="text-teal-700">{unit?.name}</strong>} />
            <InfoRow label="Housing Type" value={housingType?.name} />
            
            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Home className="h-4 w-4 shrink-0 text-gray-400" /> {housingType?.buildingType === 'BUNGALOW' ? 'Bungalow' : 'Storey'}</span>
                <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 shrink-0 text-gray-400" /> {housingType?.numberOfBedrooms} Bedrooms</span>
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 shrink-0 text-gray-400" /> {housingType?.numberOfBathrooms} Bathrooms</span>
                <span className="flex items-center gap-1.5"><Car className="h-4 w-4 shrink-0 text-gray-400" /> {housingType?.parkingSpace} Parking</span>
                {housingType?.hasBQ && <span className="flex items-center gap-1.5"><Trees className="h-4 w-4 shrink-0 text-gray-400" /> With BQ</span>}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <StaffBQManager bqs={bqs} bqOccupants={bqOccupants} />
        </div>
      </div>
    </div>
  );
}
