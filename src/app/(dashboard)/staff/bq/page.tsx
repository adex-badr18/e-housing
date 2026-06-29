import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { mockDB } from '@/lib/mock-api/db';
import { getBQsForCurrentOccupant } from '@/lib/mock-api/endpoints/housing';
import { BQPortal } from '@/components/features/tenancy/BQPortal';
import Link from 'next/link';
import { Home, ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'BQ Management | OAU E-Housing',
  description: 'Manage sub-occupants in your Boys Quarters (BQ) units.',
};

export default async function StaffBQPage() {
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

  const occupancy = mockDB.findActiveOccupancyByUserId(session.user.id);

  // No active occupancy → not entitled to BQ management
  if (!occupancy) {
    return (
      <div className="w-full space-y-6">
        <div>
          <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-oau-navy">BQ Management</h1>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-12 text-center space-y-4">
          <Lock className="h-14 w-14 text-muted-foreground/30 mx-auto" />
          <h2 className="text-xl font-semibold">No Active Housing Allocation</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            BQ management is only available to staff members with an active housing allocation.
            Please accept a housing offer first.
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

  const unit = mockDB.findUnitById(occupancy.housingUnitId);
  const housingType = unit ? mockDB.housingTypes.find(ht => ht.id === unit.housingTypeId) : null;

  // Unit has no BQs
  if (!housingType?.hasBQ || housingType.numberOfBQ === 0) {
    return (
      <div className="w-full space-y-6">
        <div>
          <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-oau-navy">BQ Management</h1>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-12 text-center space-y-4">
          <Home className="h-14 w-14 text-muted-foreground/30 mx-auto" />
          <h2 className="text-xl font-semibold">No BQ Units Attached</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your current unit (<strong>{unit?.name}</strong>) does not include any Boys Quarters sub-units.
            BQ management is only available for housing types with BQ facilities.
          </p>
        </div>
      </div>
    );
  }

  const bqs = await getBQsForCurrentOccupant(session.user.id);

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/staff" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-6 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-oau-navy">BQ Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage sub-occupants for Boys Quarters units attached to your housing — <strong>{unit?.name}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary/80">
            <Home className="h-4 w-4" />
            <span className="font-medium">{housingType.numberOfBQ} BQ unit{housingType.numberOfBQ !== 1 ? 's' : ''} attached</span>
          </div>
        </div>
      </div>

      <BQPortal bqs={bqs} maxBQs={housingType.numberOfBQ} />
    </div>
  );
}
