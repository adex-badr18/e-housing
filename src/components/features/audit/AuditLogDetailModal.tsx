'use client';

// =============================================================================
// AuditLogDetailModal — Comprehensive Event Inspection Dialog
// =============================================================================
// Displays full details for an AuditLog record, including actor context,
// target entity details, status, key-value metadata, and raw JSON copy tools.
// =============================================================================

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AuditLog, User } from '@/lib/mock-api/db';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  User as UserIcon,
  Shield,
  Calendar,
  Layers,
  FileCode,
  AlertTriangle,
} from 'lucide-react';

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  actorUser?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getEntityLink(type: string, id: string): string | null {
  if (type === 'ExitNotice') return `/management/exit/${id}`;
  if (type === 'HousingApplication') return `/management/applications/${id}`;
  if (type === 'Occupancy') return `/management/occupancies/${id}`;
  return null;
}

export function AuditLogDetailModal({
  log,
  actorUser,
  open,
  onOpenChange,
}: AuditLogDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const isSuccess = log.status === 'SUCCESS';
  const entityHref = getEntityLink(log.entityType, log.entityId);
  const metadataEntries = log.metadata
    ? Object.entries(log.metadata).filter(
        ([, v]) => v !== null && v !== undefined && v !== ''
      )
    : [];

  const jsonString = log.metadata ? JSON.stringify(log.metadata, null, 2) : '{}';

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success('Metadata JSON copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-2 border-b pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  'text-xs font-bold border gap-1 uppercase tracking-wide',
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                )}
              >
                {isSuccess ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {log.status}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">ID: {log.id}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(log.createdAt)}</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-oau-navy">
            {log.action.replace(/_/g, ' ')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Audit trail entry recorded by the OAU Housing Security & Management subsystem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Failure Alert */}
          {!isSuccess && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Action Execution Failed</p>
                <p className="text-xs text-red-700 mt-0.5">
                  This transaction encountered an error or validation violation and was not completed successfully.
                </p>
              </div>
            </div>
          )}

          {/* Actor & Entity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Actor Card */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Actor</span>
              </div>
              <div>
                <p className="font-semibold text-base text-foreground">
                  {actorUser ? `${actorUser.firstName} ${actorUser.lastName}` : log.actorId}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs font-medium bg-background">
                    <Shield className="h-3 w-3 mr-1 text-primary" />
                    {actorUser?.role?.replace(/_/g, ' ') ?? 'System / Anonymous'}
                  </Badge>
                </div>
                {actorUser?.email && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{actorUser.email}</p>
                )}
                <p className="text-[11px] font-mono text-muted-foreground/80 mt-1">
                  User ID: {log.actorId}
                </p>
              </div>
            </div>

            {/* Entity Card */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5" />
                <span>Target Entity</span>
              </div>
              <div>
                <p className="font-semibold text-base text-foreground">{log.entityType}</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5 break-all">
                  {log.entityId}
                </p>
                {entityHref && (
                  <div className="mt-3">
                    <Link
                      href={entityHref}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>View Entity Record</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Event Metadata
                </h4>
              </div>
              {metadataEntries.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-7 text-xs gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {metadataEntries.length > 0 ? (
              <div className="space-y-3">
                {/* Structured Key-Value Grid */}
                <div className="rounded-xl border bg-card p-3 divide-y">
                  {metadataEntries.map(([key, value]) => (
                    <div key={key} className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                      <span className="font-mono text-muted-foreground font-semibold shrink-0">
                        {key}
                      </span>
                      <span className="text-foreground break-all text-right font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Raw JSON viewer */}
                <details className="text-xs group">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium select-none py-1">
                    Toggle Raw JSON Payload
                  </summary>
                  <pre className="mt-2 rounded-xl bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                    {jsonString}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No additional metadata recorded for this audit entry.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

