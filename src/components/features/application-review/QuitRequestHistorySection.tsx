// =============================================================================
// QuitRequestHistorySection — Withdrawal request history table
// =============================================================================
// Server-safe (no 'use client'). Renders all past withdrawal requests for
// an application as a styled table. Reviewer name shown to management only.
// =============================================================================

import { format } from 'date-fns';
import { FileX2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuitRequest } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuitRequestEntry extends QuitRequest {
  /** Resolved display name of the reviewer — management view only */
  reviewerName?: string | null;
}

interface QuitRequestHistorySectionProps {
  requests: QuitRequestEntry[];
  /** If true, shows reviewer name column. False for staff/applicant view. */
  isManagement: boolean;
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  QuitRequest['status'],
  { label: string; cls: string }
> = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-200' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuitRequestHistorySection({
  requests,
  isManagement,
}: QuitRequestHistorySectionProps) {
  if (requests.length === 0) return null;

  return (
    <div className="pt-6 border-t space-y-3">
      {/* Section heading */}
      <div className="flex items-center gap-2">
        <FileX2 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Withdrawal Request History</h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
          {requests.length}
        </span>
      </div>

      {/* Table wrapper */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left whitespace-nowrap">Date Requested</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Outcome</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Reviewed On</th>
                {isManagement && (
                  <th className="px-4 py-3 text-left whitespace-nowrap">Reviewed By</th>
                )}
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {requests.map((req) => {
                const cfg = STATUS_CONFIG[req.status];
                return (
                  <tr
                    key={req.id}
                    className="hover:bg-muted/30 transition-colors align-top"
                  >
                    {/* Date requested */}
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {format(new Date(req.createdAt), 'dd MMM yyyy')}
                      <br />
                      <span className="text-[10px]">{format(new Date(req.createdAt), 'HH:mm')}</span>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3 text-foreground/90 max-w-xs">
                      <p className="leading-relaxed line-clamp-3">{req.reason}</p>
                    </td>

                    {/* Outcome badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                          cfg.cls
                        )}
                      >
                        {cfg.label}
                      </span>
                    </td>

                    {/* Reviewed on */}
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                      {req.reviewedAt ? (
                        <>
                          {format(new Date(req.reviewedAt), 'dd MMM yyyy')}
                          <br />
                          <span className="text-[10px]">{format(new Date(req.reviewedAt), 'HH:mm')}</span>
                        </>
                      ) : (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Reviewed by — management only */}
                    {isManagement && (
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground/80">
                        {req.reviewerName ?? (
                          <span className="italic text-muted-foreground/60">—</span>
                        )}
                      </td>
                    )}

                    {/* Reviewer notes */}
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                      {req.reviewNotes ? (
                        <span className="italic">&ldquo;{req.reviewNotes}&rdquo;</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
