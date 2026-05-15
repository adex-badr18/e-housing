import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStaffDashboardData } from '@/lib/mock-api/endpoints/metrics';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

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
  const { user, profile, activeApplication, activeExitRequest, currentAllocation } = data;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Staff Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.firstName} {user?.lastName}. Here is an overview of your housing status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Action Links */}
        <Card className="border-t-4 border-t-oau-gold shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-oau-navy">Quick Actions</CardTitle>
            <CardDescription>Shortcut to system operations</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/staff/profile" className={buttonVariants({ variant: "outline", className: "w-full justify-start hover:bg-oau-navy/5 hover:text-oau-navy hover:border-oau-navy/20" })}>
              Update Staff Profile
            </Link>
            <Link href="/staff/applications" className={buttonVariants({ className: "w-full justify-start bg-oau-navy text-oau-cream hover:bg-oau-navy/90" })}>
              Apply for Housing
            </Link>
            <Link href="/staff/exit" className={buttonVariants({ variant: "outline", className: "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 mt-2" })}>
              Initiate Housing Exit
            </Link>
          </CardContent>
        </Card>

        {/* Staff User Data */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{user?.phoneNumber || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium">{user?.role}</span>
            </div>
          </CardContent>
        </Card>

        {/* Staff Profile Data */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!profile ? (
              <div className="text-destructive font-medium">Profile incomplete. Please update.</div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staff ID:</span>
                  <span className="font-medium">{profile.staffId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{profile.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rank:</span>
                  <span className="font-medium">{profile.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Housing Status:</span>
                  <span className="font-medium">{profile.currentHousingStatus}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Allocation */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Current Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAllocation ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit:</span>
                  <span className="font-medium border border-border px-2 py-0.5 rounded-md">{currentAllocation.name}</span>
                </div>
                <p className="text-muted-foreground text-xs mt-4">For details about BQ or maintenance, view your housing management portal.</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">You do not have any active housing allocation.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Application */}
        <Card>
          <CardHeader>
            <CardTitle>Active Application</CardTitle>
          </CardHeader>
          <CardContent>
            {activeApplication ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-primary">{activeApplication.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Your application is currently being processed by the housing secretriat.</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No active applications currently processing.</p>
            )}
          </CardContent>
        </Card>

        {/* Exit Application info */}
        <Card>
          <CardHeader>
            <CardTitle>Exit Application</CardTitle>
          </CardHeader>
          <CardContent>
             {activeExitRequest ? (
              <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Housing Inspection:</span>
                  <span className="font-medium">{activeExitRequest.housingInspectionStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Electrical Inspection:</span>
                  <span className="font-medium">{activeExitRequest.electricalInspectionStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estate Inspection:</span>
                  <span className="font-medium">{activeExitRequest.estateInspectionStatus}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No active exit requests.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
