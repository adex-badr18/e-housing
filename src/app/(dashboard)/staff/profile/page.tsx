import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStaffDashboardData } from '@/lib/mock-api/endpoints/metrics';
import { StaffProfileForm } from '@/components/features/profile/StaffProfileForm';
import { DependantsEditForm } from '@/components/features/profile/DependantsEditForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

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
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Profile</h1>
        <p className="text-muted-foreground">Manage your personal and professional information.</p>
      </div>

      {/* Personal & Appointment Details */}
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

      {/* Dependants Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-amber-600" />
            Dependants Information
          </CardTitle>
          <CardDescription>
            Update your spouse details and child dependants. Changes are saved immediately to your institutional record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DependantsEditForm
            initialData={{
              spouseName: profile?.spouseName,
              spouseEmployedInOAU: profile?.spouseEmployedInOAU,
              spouseDepartment: profile?.spouseDepartment,
              spouseEmploymentAddress: profile?.spouseEmploymentAddress,
              children: profile?.children,
              numberOfDependents: profile?.numberOfDependents,
              maritalStatus: profile?.maritalStatus,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

