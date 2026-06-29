import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStaffDashboardData } from '@/lib/mock-api/endpoints/metrics';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import {
  Home, FileText, Scroll, KeyRound, Building, DoorOpen, LogOut,
  CheckCircle, Clock, AlertTriangle, AlertCircle, ShieldAlert,
} from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { SnapshotTable } from '@/components/shared/SnapshotTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default async function StaffDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'STAFF') {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
      </div>
    );
  }

  const data = await getStaffDashboardData(session.user.id);
  const {
    user,
    profile,
    activeApplication,
    activeExitNotice,
    currentUnit,
    currentUnitBQs,
    applicationHistory,
    allocationOffer,
    allocationOfferUnit,
    tenancyAgreement,
  } = data;

  // Compute status metrics for row 1
  const housingStatusText = profile?.currentHousingStatus === 'HAS_ALLOCATION'
    ? `Occupying ${currentUnit?.name || 'Unit'}`
    : 'No Allocation';

  const appStatusText = activeApplication
    ? `Pending stage: ${activeApplication.currentStage}`
    : 'No active application';

  const exitStatusText = activeExitNotice
    ? `Cleared: ${activeExitNotice.housingInspectionStatus === 'PASSED' ? 'Housing ' : ''}${activeExitNotice.electricalInspectionStatus === 'PASSED' ? 'Elec ' : ''}${activeExitNotice.estateInspectionStatus === 'PASSED' ? 'Estate ' : ''}`
    : 'No exit request';

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Staff Portal</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.firstName} {user?.lastName}. Here is an overview of your housing status.
        </p>
      </div>

      {/* Allocation Offer Alert Banner */}
      {allocationOffer && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Housing Allocation Offer Issued!</p>
              <p className="text-xs text-amber-700">
                You have been offered <strong className="text-oau-navy font-semibold">{allocationOfferUnit?.name}</strong>.
                Please respond before it expires on <strong className="font-semibold">{allocationOffer.expiresAt ? formatDate(allocationOffer.expiresAt) : 'soon'}</strong>.
              </p>
            </div>
          </div>
          <Link
            href="/staff/housing"
            className={cn(buttonVariants({ size: 'sm', className: 'bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg' }))}
          >
            Review Offer
          </Link>
        </div>
      )}

      {/* Row 1: KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="My Housing Allocation"
          value={profile?.currentHousingStatus === 'HAS_ALLOCATION' ? 'Allocated' : 'Not Allocated'}
          icon={Home}
          variant={profile?.currentHousingStatus === 'HAS_ALLOCATION' ? 'success' : 'default'}
          description={housingStatusText}
        />
        <MetricCard
          title="Active Housing Application"
          value={activeApplication ? 'Processing' : 'None'}
          icon={FileText}
          variant={activeApplication ? 'warning' : 'default'}
          description={appStatusText}
        />
        <MetricCard
          title="Exit Clearance Notice"
          value={activeExitNotice ? 'In Progress' : 'None'}
          icon={LogOut}
          variant={activeExitNotice ? 'danger' : 'default'}
          description={exitStatusText}
        />
      </div>

      {/* Row 2: Actions & Basic Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Action Links */}
        <Card className="border-t-4 border-t-oau-gold shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-oau-navy text-base">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Access portal operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/staff/profile" className={cn(buttonVariants({ variant: 'outline', className: 'w-full justify-start text-xs font-semibold' }))}>
              <DoorOpen className="mr-2 h-4 w-4" /> Update Profile
            </Link>
            <Link
              href="/staff/applications"
              className={cn(buttonVariants({ className: 'w-full justify-start bg-oau-navy text-oau-cream hover:bg-oau-navy/90 text-xs font-semibold' }))}
            >
              <FileText className="mr-2 h-4 w-4" /> Apply for Housing
            </Link>
            <Link href="/staff/housing" className={cn(buttonVariants({ variant: 'outline', className: 'w-full justify-start text-xs font-semibold' }))}>
              <KeyRound className="mr-2 h-4 w-4" /> My Housing Offer
            </Link>
            <Link href="/staff/tenancy" className={cn(buttonVariants({ variant: 'outline', className: 'w-full justify-start text-xs font-semibold' }))}>
              <Scroll className="mr-2 h-4 w-4" /> Tenancy Agreement
            </Link>
            <Link href="/staff/bq" className={cn(buttonVariants({ variant: 'outline', className: 'w-full justify-start text-xs font-semibold' }))}>
              <Building className="mr-2 h-4 w-4" /> BQ Management
            </Link>
            <Link href="/staff/exit" className={cn(buttonVariants({ variant: 'outline', className: 'w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 mt-2 text-xs font-semibold' }))}>
              <LogOut className="mr-2 h-4 w-4" /> Initiate Housing Exit
            </Link>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-oau-navy text-base">Basic Information</CardTitle>
            <CardDescription className="text-xs">Personal profile info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed">
            <div className="flex justify-between border-b pb-1.5 border-border/40">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-semibold text-oau-navy">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 border-border/40">
              <span className="text-muted-foreground">Email Address:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 border-border/40">
              <span className="text-muted-foreground">Phone Number:</span>
              <span className="font-medium">{user?.phoneNumber || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Role:</span>
              <Badge variant="secondary" className="font-mono text-[10px] py-0">
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Professional Profile */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-oau-navy text-base">Professional Profile</CardTitle>
            <CardDescription className="text-xs">Employment and ranking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed">
            {!profile ? (
              <div className="text-destructive font-medium text-center py-4">
                Profile incomplete. Please update.
              </div>
            ) : (
              <>
                <div className="flex justify-between border-b pb-1.5 border-border/40">
                  <span className="text-muted-foreground">Staff ID:</span>
                  <span className="font-semibold">{profile.staffId}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-border/40">
                  <span className="text-muted-foreground">Faculty:</span>
                  <span className="font-medium">{profile.faculty}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-border/40">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{profile.department}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-border/40">
                  <span className="text-muted-foreground">Rank & Grade:</span>
                  <span className="font-medium">{profile.rank} ({profile.salaryGradeLevel})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dependents:</span>
                  <span className="font-medium">{profile.numberOfDependents}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Current Allocation & BQ Occupants Snapshot */}
      {currentUnit && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-sm border border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-oau-navy text-base">Current Allocation Details</CardTitle>
              <CardDescription className="text-xs">Unit details and linked Boys Quarters occupants</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="rounded-xl border border-border/40 p-3 bg-muted/5">
                  <p className="text-muted-foreground mb-1">Unit Assigned</p>
                  <p className="text-sm font-bold text-oau-navy">{currentUnit.name}</p>
                </div>
                <div className="rounded-xl border border-border/40 p-3 bg-muted/5">
                  <p className="text-muted-foreground mb-1">Tenancy Agreement</p>
                  <p className="text-xs">
                    {tenancyAgreement?.signed ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Signed & Active
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Awaiting Signature
                      </span>
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-border/40 p-3 bg-muted/5">
                  <p className="text-muted-foreground mb-1">BQ Allocations</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUnitBQs && currentUnitBQs.length > 0 ? (
                      <span>{currentUnitBQs.filter(b => b.status === 'OCCUPIED').length} of {currentUnitBQs.length} occupied</span>
                    ) : (
                      <span>No BQs configured</span>
                    )}
                  </p>
                </div>
              </div>

              {currentUnitBQs && currentUnitBQs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-oau-navy">BQ Occupants</p>
                  <SnapshotTable
                    rows={currentUnitBQs}
                    getRowKey={r => r.id}
                    getRowHref={() => '/staff/bq'}
                    emptyMessage="No BQs allocated for this housing unit."
                    columns={[
                      {
                        key: 'label',
                        header: 'BQ Label',
                        render: r => <span className="font-semibold">{r.label}</span>,
                      },
                      {
                        key: 'status',
                        header: 'Status',
                        render: r => (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${r.status === 'OCCUPIED' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-muted text-muted-foreground'}`}>
                            {r.status}
                          </span>
                        ),
                      },
                      {
                        key: 'occupant',
                        header: 'Occupant Name',
                        render: r => (
                          <span className="text-xs font-medium">
                            {r.occupant ? r.occupant.fullName : '—'}
                          </span>
                        ),
                      },
                      {
                        key: 'relationship',
                        header: 'Relationship',
                        render: r => (
                          <span className="text-xs text-muted-foreground">
                            {r.occupant ? r.occupant.relationship : '—'}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right hand side: Active Exit notice visual pipeline */}
          {activeExitNotice && (
            <Card className="shadow-sm border border-red-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 text-base flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Exit Clearance Progress
                </CardTitle>
                <CardDescription className="text-xs">Visual pipeline of exit inspections</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-3.5 text-xs">
                  {/* Housing */}
                  <div className="flex justify-between items-center border-b pb-2 border-border/40">
                    <div>
                      <p className="font-semibold text-oau-navy">1. Housing Inspection</p>
                      <p className="text-muted-foreground text-[10px]">Performed by Housing Secretary</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      activeExitNotice.housingInspectionStatus === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      activeExitNotice.housingInspectionStatus === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {activeExitNotice.housingInspectionStatus}
                    </Badge>
                  </div>
                  {/* Electrical */}
                  <div className="flex justify-between items-center border-b pb-2 border-border/40">
                    <div>
                      <p className="font-semibold text-oau-navy">2. Electrical Inspection</p>
                      <p className="text-muted-foreground text-[10px]">Requires Housing inspection to pass</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      activeExitNotice.electricalInspectionStatus === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      activeExitNotice.electricalInspectionStatus === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {activeExitNotice.electricalInspectionStatus}
                    </Badge>
                  </div>
                  {/* Estate */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-oau-navy">3. Estate Inspection</p>
                      <p className="text-muted-foreground text-[10px]">Final inspection stage before release</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      activeExitNotice.estateInspectionStatus === 'PASSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      activeExitNotice.estateInspectionStatus === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {activeExitNotice.estateInspectionStatus}
                    </Badge>
                  </div>
                </div>
                <Link
                  href="/staff/exit"
                  className={cn(buttonVariants({ size: 'sm', className: 'w-full text-xs font-semibold mt-2' }))}
                >
                  View Clearance Pipeline
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Row 4: My Application History */}
      <DashboardSection
        title="My Housing Application History"
        description="All past and active housing applications submitted by you"
        href="/staff/applications"
      >
        <SnapshotTable
          rows={applicationHistory}
          getRowKey={r => r.id}
          getRowHref={r => `/staff/applications`}
          emptyMessage="You have not submitted any housing applications yet."
          columns={[
            {
              key: 'submitted',
              header: 'Submitted Date',
              render: r => <span className="text-xs font-medium">{formatDate(r.submittedAt)}</span>,
            },
            {
              key: 'stage',
              header: 'Workflow Stage',
              render: r => (
                <Badge variant="outline" className="text-xs font-mono">
                  {r.currentStage}
                </Badge>
              ),
            },
            {
              key: 'score',
              header: 'Formula Score',
              render: r => (
                <span className="text-xs font-bold text-oau-navy">
                  {r.pointsBreakdown?.totalPoints ?? '—'}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Allocation Status',
              render: r => <StatusBadge status={r.status} />,
            },
          ]}
        />
      </DashboardSection>
    </div>
  );
}
