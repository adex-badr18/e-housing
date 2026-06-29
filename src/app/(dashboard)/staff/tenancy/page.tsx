import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMyTenancyAgreementAction } from '@/app/actions/housing';
import { TenancyAgreementView } from '@/components/features/tenancy/TenancyAgreementView';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Tenancy Agreement | OAU E-Housing',
  description: 'View, print, or save your OAU staff housing tenancy agreement as a PDF.',
};

export default async function StaffTenancyPage() {
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

  const result = await getMyTenancyAgreementAction();

  if (!result.success) {
    return (
      <div className="w-full py-12 text-center space-y-3">
        <p className="text-destructive font-medium">{result.error}</p>
        <Link href="/staff" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  if (!result.data || !result.data.unit || !result.data.housingType || !result.data.user) {
    return (
      <div className="w-full space-y-6">
        <div>
          <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Tenancy Agreement</h1>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-12 text-center space-y-4">
          <FileText className="h-14 w-14 text-muted-foreground/40 mx-auto" />
          <h2 className="text-xl font-semibold">No Active Tenancy</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You do not currently have an active housing allocation. 
            Your tenancy agreement will be available here once you accept a housing offer.
          </p>
          <Link
            href="/staff/housing"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            View Housing Offer
          </Link>
        </div>
      </div>
    );
  }

  const { occupancy, agreement, unit, housingType, user, profile } = result.data;

  return (
    <div className="w-full space-y-4">
      <div className="print-hide">
        <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      <TenancyAgreementView
        occupancy={occupancy}
        agreement={agreement}
        unit={unit}
        housingType={housingType}
        user={user}
        profile={profile}
      />
    </div>
  );
}
