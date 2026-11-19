'use client';

// =============================================================================
// GracePeriodBanner — Universal countdown display for all exit notices
// =============================================================================
// Phase 4 — new component.
// Displays the grace period deadline and a live day countdown.
// Colour-coded: green (> 30 days), amber (10–30 days), red (< 10 days).
// Shows an "Extended" badge if the deadline has been extended at least once.
// =============================================================================

import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, CalendarClock, CheckCircle2, RefreshCw } from 'lucide-react';

interface GracePeriodBannerProps {
  /** ISO 8601 deadline string */
  deadline: string;
  /** Whether the grace period has been extended at least once */
  extended?: boolean;
  /** Total cumulative extension days granted */
  extensionDays?: number;
  className?: string;
}

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function GracePeriodBanner({
  deadline,
  extended = false,
  extensionDays,
  className,
}: GracePeriodBannerProps) {
  const daysRemaining = getDaysRemaining(deadline);
  const isExpired = daysRemaining <= 0;
  const isCritical = !isExpired && daysRemaining < 10;
  const isWarning = !isExpired && daysRemaining >= 10 && daysRemaining <= 30;
  const isHealthy = !isExpired && daysRemaining > 30;

  const formattedDeadline = new Date(deadline).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const colourConfig = isExpired
    ? {
        border: 'border-red-400',
        bg: 'bg-red-50',
        icon: AlertTriangle,
        iconColour: 'text-red-600',
        iconBg: 'bg-red-100',
        headingColour: 'text-red-800',
        bodyColour: 'text-red-700',
        countColour: 'text-red-600',
        countBg: 'bg-red-100',
      }
    : isCritical
    ? {
        border: 'border-red-300',
        bg: 'bg-red-50',
        icon: AlertTriangle,
        iconColour: 'text-red-500',
        iconBg: 'bg-red-100',
        headingColour: 'text-red-800',
        bodyColour: 'text-red-700',
        countColour: 'text-red-600',
        countBg: 'bg-red-100',
      }
    : isWarning
    ? {
        border: 'border-amber-300',
        bg: 'bg-amber-50',
        icon: Clock,
        iconColour: 'text-amber-600',
        iconBg: 'bg-amber-100',
        headingColour: 'text-amber-800',
        bodyColour: 'text-amber-700',
        countColour: 'text-amber-700',
        countBg: 'bg-amber-100',
      }
    : {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        icon: CalendarClock,
        iconColour: 'text-blue-600',
        iconBg: 'bg-blue-100',
        headingColour: 'text-blue-800',
        bodyColour: 'text-blue-700',
        countColour: 'text-blue-700',
        countBg: 'bg-blue-100',
      };

  const { icon: Icon, iconColour, iconBg, border, bg, headingColour, bodyColour, countColour, countBg } = colourConfig;

  return (
    <div className={cn('rounded-xl border p-4 flex items-start gap-4', border, bg, className)}>
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColour)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-0.5">
          <h4 className={cn('font-bold text-base', headingColour)}>Grace Period Deadline</h4>
          {extended && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 border border-current/20 text-current">
              <RefreshCw className="h-3 w-3" />
              Extended{extensionDays ? ` +${extensionDays}d` : ''}
            </span>
          )}
        </div>
        <p className={cn('text-sm', bodyColour)}>
          {isExpired
            ? 'The grace period has expired. The occupant is overdue for evacuation.'
            : `All clearance stages must be completed and the property vacated by ${formattedDeadline}.`}
        </p>
      </div>

      {/* Countdown chip */}
      <div className={cn(
        'shrink-0 rounded-xl px-3 py-2 text-center min-w-[72px]',
        countBg
      )}>
        {isExpired ? (
          <>
            <p className={cn('text-2xl font-extrabold tabular-nums leading-none', countColour)}>
              {Math.abs(daysRemaining)}
            </p>
            <p className={cn('text-xs font-semibold mt-0.5', countColour)}>days over</p>
          </>
        ) : (
          <>
            <p className={cn('text-2xl font-extrabold tabular-nums leading-none', countColour)}>
              {daysRemaining}
            </p>
            <p className={cn('text-xs font-semibold mt-0.5', countColour)}>
              {daysRemaining === 1 ? 'day left' : 'days left'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
