// =============================================================================
// CompletedStageCard — read-only summary of a finished review stage
// =============================================================================

import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { ApplicationReview, ApplicationStage } from '@/lib/mock-api/db';

const STAGE_LABELS: Record<Exclude<ApplicationStage, 'COMPLETED'>, string> = {
  HOUSING: 'Housing Secretary Review',
  ESTATE:  'Estate Officer Review',
  DVC:     'DVC Admin — Final Decision',
};

const DECISION_CONFIG = {
  FORWARDED: {
    icon:  ChevronRight,
    label: 'Forwarded',
    cls:   'text-blue-600 bg-blue-50 border-blue-200',
    iconCls: 'text-blue-500',
  },
  APPROVED: {
    icon:  CheckCircle2,
    label: 'Approved',
    cls:   'text-emerald-700 bg-emerald-50 border-emerald-200',
    iconCls: 'text-emerald-500',
  },
  REJECTED: {
    icon:  XCircle,
    label: 'Rejected',
    cls:   'text-red-700 bg-red-50 border-red-200',
    iconCls: 'text-red-500',
  },
} as const;

interface CompletedStageCardProps {
  review: ApplicationReview;
  reviewerName: string;
}

export function CompletedStageCard({ review, reviewerName }: CompletedStageCardProps) {
  const cfg  = DECISION_CONFIG[review.decision];
  const Icon = cfg.icon;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {STAGE_LABELS[review.stage]}
        </p>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
          <Icon className={`h-3.5 w-3.5 ${cfg.iconCls}`} />
          {cfg.label}
        </span>
      </div>

      {/* Reviewer & date */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Reviewed by <strong className="text-foreground">{reviewerName}</strong></span>
        <span>·</span>
        <span>{format(new Date(review.reviewedAt), 'dd MMM yyyy, HH:mm')}</span>
        {review.score != null && (
          <>
            <span>·</span>
            <span className="font-semibold text-foreground">{review.score} pts</span>
          </>
        )}
      </div>

      {/* Comments */}
      <p className="text-sm text-foreground/80 border-l-2 border-muted pl-3 italic">
        {review.comments}
      </p>
    </div>
  );
}
