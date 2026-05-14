import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStaffDashboardData } from '@/lib/mock-api/endpoints/metrics';
import { StaffProfileForm } from '@/components/features/profile/StaffProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function StaffProfilePage() {
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
  const { user, profile } = data;

  const initialData = {
    ...profile,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    phoneNumber: user?.phoneNumber,
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Profile</h1>
        <p className="text-muted-foreground">Manage your personal and professional information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>
            Update your profile information. Note that some fields are locked and managed by the University Administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffProfileForm initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  );
}
