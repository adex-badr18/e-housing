import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMyPendingAllocationAction } from '@/app/actions/housing';
import { AllocationResponseCard } from '@/components/features/tenancy/AllocationResponseCard';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Housing Offer | OAU E-Housing',
  description: 'Review and respond to your pending housing allocation offer.',
};

export default async function StaffHousingPage() {
  const session = await auth();

  if (!session?.user) redirect('/login');

  if (session.user.role !== 'STAFF') {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-3">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">Only staff members can access this page.</p>
      </div>
    );
  }

  const result = await getMyPendingAllocationAction();

  if (!result.success) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-3">
        <p className="text-destructive font-medium">{result.error}</p>
        <Link href="/staff" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-oau-navy">My Housing Offer</h1>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-12 text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 text-muted-foreground/40 mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">No Pending Offers</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You do not have any active housing allocation offers at this time. 
            Once the DVC approves your application, a unit will be assigned and you will see your offer here.
          </p>
          <Link
            href="/staff/applications"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            View My Applications
          </Link>
        </div>
      </div>
    );
  }

  const { allocation, unit, housingType } = result.data;

  if (!unit || !housingType) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
        <p>Unit data could not be loaded. Please contact the Housing Secretariat.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-oau-navy">My Housing Offer</h1>
        <p className="text-muted-foreground mt-1">
          You have been allocated a housing unit. Please review the details and respond before the deadline.
        </p>
      </div>

      <AllocationResponseCard
        allocation={allocation}
        unit={unit}
        housingType={housingType}
      />
    </div>
  );
}
