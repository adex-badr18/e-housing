'use client';

// =============================================================================
// AllocationResponseCard — Time-Sensitive Allocation Offer Dashboard Element
// =============================================================================
// Displays unit details and a live countdown timer. Staff can Accept or Reject
// within the window before the offer auto-expires.
// =============================================================================

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { respondToAllocationAction } from '@/app/actions/applications';
import {
  Home,
  Bed,
  Bath,
  Car,
  BookOpen,
  TreePine,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Building2,
  BadgeDollarSign,
} from 'lucide-react';
import type { Allocation, HousingUnit, HousingType } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  allocation: Allocation;
  unit: HousingUnit;
  housingType: HousingType;
}

// ---------------------------------------------------------------------------
// Countdown hook
// ---------------------------------------------------------------------------

function useCountdown(expiresAt: string) {
  const getRemaining = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, total: 0 };
    const total = diff;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, expired: false, total };
  };

  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const timer = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return time;
}

// ---------------------------------------------------------------------------
// Time unit box
// ---------------------------------------------------------------------------

function TimeBox({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all duration-300',
      urgent
        ? 'border-red-400 bg-red-500/10 text-red-600'
        : 'border-primary/30 bg-primary/5 text-primary'
    )}>
      <span className="text-2xl font-extrabold tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className={cn('text-[10px] font-semibold uppercase tracking-widest mt-0.5', urgent ? 'text-red-500' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature chip
// ---------------------------------------------------------------------------

function FeatureChip({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
      active
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-muted/50 border-border text-muted-foreground line-through opacity-50'
    )}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AllocationResponseCard({ allocation, unit, housingType }: Props) {
  const router = useRouter();
  const countdown = useCountdown(allocation.expiresAt ?? '');
  const [isPending, startTransition] = useTransition();
  const [responded, setResponded] = useState<'ACCEPTED' | 'REJECTED' | null>(null);

  const isUrgent = !countdown.expired && countdown.days === 0 && countdown.hours < 24;

  function handleResponse(response: 'ACCEPTED' | 'REJECTED') {
    startTransition(async () => {
      const res = await respondToAllocationAction({
        allocationId: allocation.id,
        response,
      });
      if (res.success) {
        setResponded(response);
        if (response === 'ACCEPTED') {
          toast.success('🎉 Allocation accepted! Your tenancy agreement is now active.', { duration: 5000 });
        } else {
          toast.info('Allocation offer declined. The unit will be released back to inventory.', { duration: 4000 });
        }
        // Refresh after short delay so the response card is visible briefly
        setTimeout(() => router.refresh(), 1000);
      } else {
        toast.error(res.error ?? 'Failed to respond to allocation');
      }
    });
  }

  // Expired state
  if (countdown.expired) {
    return (
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-8 text-center space-y-3">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-amber-700">Offer Expired</h2>
        <p className="text-sm text-amber-600 max-w-sm mx-auto">
          Your allocation offer for <strong>{unit.name}</strong> has expired because it was not responded to within the required window.
          Please contact the Housing Secretariat for reassignment.
        </p>
      </div>
    );
  }

  // Responded state
  if (responded) {
    return (
      <div className={cn(
        'rounded-2xl border-2 p-10 text-center space-y-4 transition-all',
        responded === 'ACCEPTED'
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-red-200 bg-red-50/40'
      )}>
        {responded === 'ACCEPTED' ? (
          <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
        ) : (
          <XCircle className="h-14 w-14 text-red-400 mx-auto" />
        )}
        <h2 className="text-2xl font-bold">
          {responded === 'ACCEPTED' ? 'Offer Accepted!' : 'Offer Declined'}
        </h2>
        <p className="text-sm text-muted-foreground">Redirecting you…</p>
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      <div className={cn(
        'rounded-xl px-5 py-3.5 flex items-center gap-3 font-medium text-sm border-l-4',
        isUrgent
          ? 'bg-red-50 border-red-500 text-red-700'
          : 'bg-amber-50 border-amber-400 text-amber-700'
      )}>
        <Clock className={cn('h-5 w-5 shrink-0', isUrgent ? 'text-red-500' : 'text-amber-500')} />
        {isUrgent
          ? 'Urgent: Less than 24 hours remain to respond to this offer!'
          : 'You have a pending housing allocation offer. Please respond before the deadline.'}
      </div>

      {/* Main card */}
      <div className="rounded-2xl border bg-card shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground px-8 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-widest mb-1">
                Housing Unit Offer
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight">{unit.name}</h1>
              <p className="text-primary-foreground/80 text-sm mt-1 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {housingType.name}
              </p>
            </div>
            <div className={cn(
              'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border',
              housingType.category === 'SENIOR'
                ? 'bg-accent text-accent-foreground border-accent/20'
                : 'bg-white/20 text-white border-white/30'
            )}>
              {housingType.category} Category
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Unit details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 py-4 px-3">
              <Bed className="h-5 w-5 text-primary/70" />
              <span className="text-2xl font-extrabold">{housingType.numberOfBedrooms}</span>
              <span className="text-xs text-muted-foreground font-medium">Bedrooms</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 py-4 px-3">
              <Bath className="h-5 w-5 text-primary/70" />
              <span className="text-2xl font-extrabold">{housingType.numberOfBathrooms}</span>
              <span className="text-xs text-muted-foreground font-medium">Bathrooms</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 py-4 px-3">
              <Home className="h-5 w-5 text-primary/70" />
              <span className="text-2xl font-extrabold">{housingType.numberOfBQ}</span>
              <span className="text-xs text-muted-foreground font-medium">BQ Units</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 py-4 px-3">
              <BadgeDollarSign className="h-5 w-5 text-accent" />
              <span className="text-xl font-extrabold text-accent">
                ₦{housingType.annualRent.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Annual Rent</span>
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Amenities & Features
            </p>
            <div className="flex flex-wrap gap-2">
              <FeatureChip icon={BookOpen} label="Study Room" active={housingType.hasStudyRoom} />
              <FeatureChip icon={Car} label="Parking" active={housingType.hasParking} />
              <FeatureChip icon={TreePine} label="Courtyard" active={housingType.hasCourtyard} />
              <FeatureChip icon={Home} label="Boys Quarters" active={housingType.hasBQ} />
            </div>
          </div>

          {/* Countdown */}
          <div className={cn(
            'rounded-2xl border-2 p-6 space-y-4 transition-all duration-500',
            isUrgent
              ? 'border-red-300 bg-red-50/50'
              : 'border-border bg-secondary/30'
          )}>
            <div className="flex items-center gap-2">
              <Clock className={cn('h-5 w-5', isUrgent ? 'text-red-500 animate-pulse' : 'text-primary/60')} />
              <span className="text-sm font-semibold">
                {isUrgent ? '⚠ Response deadline approaching' : 'Time remaining to respond'}
              </span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <TimeBox value={countdown.days} label="Days" urgent={isUrgent} />
              <span className={cn('text-2xl font-bold', isUrgent ? 'text-red-500' : 'text-muted-foreground')}>:</span>
              <TimeBox value={countdown.hours} label="Hours" urgent={isUrgent} />
              <span className={cn('text-2xl font-bold', isUrgent ? 'text-red-500' : 'text-muted-foreground')}>:</span>
              <TimeBox value={countdown.minutes} label="Mins" urgent={isUrgent} />
              <span className={cn('text-2xl font-bold', isUrgent ? 'text-red-500' : 'text-muted-foreground')}>:</span>
              <TimeBox value={countdown.seconds} label="Secs" urgent={isUrgent} />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Offer expires: <strong>{new Date(allocation.expiresAt ?? '').toLocaleString('en-NG', {
                dateStyle: 'full', timeStyle: 'short'
              })}</strong>
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              id="accept-allocation-btn"
              onClick={() => handleResponse('ACCEPTED')}
              disabled={isPending}
              className={cn(
                'flex items-center justify-center gap-2.5 rounded-xl py-4 px-6 font-bold text-base transition-all duration-200',
                'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-600/20',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              Accept Allocation Offer
            </button>

            <button
              id="reject-allocation-btn"
              onClick={() => handleResponse('REJECTED')}
              disabled={isPending}
              className={cn(
                'flex items-center justify-center gap-2.5 rounded-xl py-4 px-6 font-bold text-base transition-all duration-200',
                'bg-background border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              Decline Offer
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Accepting this offer will activate your tenancy and generate your Tenancy Agreement.
            Declining will release the unit back to inventory.
          </p>
        </div>
      </div>
    </div>
  );
}
