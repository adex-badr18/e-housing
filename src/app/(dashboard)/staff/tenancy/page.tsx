import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMyTenancyAgreementAction } from '@/app/actions/housing';
import { TenancyAgreementView } from '@/components/features/tenancy/TenancyAgreementView';
import Link from 'next/link';
import { FileText, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

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

  // ── Access Control ──────────────────────────────────────────────────────────
  // The Tenancy Agreement page is ONLY accessible during the OFFER_ACCEPTED phase.
  // Before acceptance: data is null (no offer accepted yet).
  // After FINALIZED: phase becomes 'ACTIVE' — the tenancy is now a full occupancy record.
  // In both of those cases we deny access and explain why.

  if (!result.data) {
    // No accepted offer and no active occupancy — nothing to show
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
          <Lock className="h-14 w-14 text-muted-foreground/40 mx-auto" />
          <h2 className="text-xl font-semibold">Not Available</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your Tenancy Agreement is only accessible after you accept a housing allocation offer.
            You do not currently have an accepted offer.
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

  // Phase ACTIVE means the tenancy has been finalized — the PDF is no longer accessible here
  if (result.data.phase === 'ACTIVE') {
    return (
      <div className="w-full space-y-6">
        <div>
          <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-oau-navy">Tenancy Agreement</h1>
        </div>

        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-12 text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-semibold text-emerald-800">Tenancy Finalized</h2>
          <p className="text-sm text-emerald-700/80 max-w-sm mx-auto">
            Your tenancy has been officially finalized and your occupancy is now active.
            The Tenancy Agreement PDF was only available during the acceptance window.
            Please contact the Housing Secretariat if you need another copy.
          </p>
          <Link
            href="/staff"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition-colors"
          >
            View My Occupancy
          </Link>
        </div>
      </div>
    );
  }

  // Phase PENDING_FINALIZATION — show the agreement for download/print
  const { occupancy, agreement, unit, housingType, user, profile } = result.data;

  if (!unit || !housingType || !user) {
    return (
      <div className="w-full py-12 text-center text-muted-foreground">
        <p>Unit data could not be loaded. Please contact the Housing Secretariat.</p>
      </div>
    );
  }

  // In PENDING_FINALIZATION, there is no real occupancy record yet.
  // Create a synthetic placeholder for the PDF render.
  const now = new Date().toISOString();
  const displayOccupancy = occupancy ?? {
    id: 'pending',
    userId: user.id,
    housingUnitId: unit.id,
    checkInDate: now.split('T')[0],
    checkOutDate: null,
    status: 'ACTIVE' as const,
    createdAt: now,
    updatedAt: now,
  };

  return (
    <div className="w-full space-y-4">
      <div className="print-hide">
        <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
      </div>

      <TenancyAgreementView
        occupancy={displayOccupancy}
        agreement={agreement}
        unit={unit}
        housingType={housingType}
        user={user}
        profile={profile}
      />
    </div>
  );
}
