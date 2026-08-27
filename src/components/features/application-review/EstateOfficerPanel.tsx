'use client';

// =============================================================================
// EstateOfficerPanel — Stage 2 Physical Inspection Review Form
// =============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2, Loader2, ChevronRight, XCircle, CheckCircle2, XCircle as FailIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { reviewApplicationAction } from '@/app/actions/applications';
import type { HousingApplication, PointsBreakdown } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const formSchema = z.object({
  comments: z
    .string()
    .min(10, 'Field notes must be at least 10 characters')
    .max(1000, 'Field notes must be under 1000 characters'),
  decision: z.enum(['FORWARDED', 'REJECTED']),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Inspection metric definition
// ---------------------------------------------------------------------------

type InspectionRating = 'PASS' | 'FAIL' | 'NA' | null;

interface InspectionMetric {
  id:          string;
  category:    string;
  label:       string;
  description: string;
}

const INSPECTION_METRICS: InspectionMetric[] = [
  // Structural
  { id: 'str-walls',    category: 'Structural', label: 'Wall integrity',       description: 'No cracks, damp, or structural deformities observed' },
  { id: 'str-roof',     category: 'Structural', label: 'Roof condition',        description: 'Roof is intact — no leaks, sagging, or missing sections' },
  { id: 'str-floors',   category: 'Structural', label: 'Floor condition',       description: 'Floors are even, clean, and in good repair' },
  { id: 'str-windows',  category: 'Structural', label: 'Doors & windows',       description: 'All doors and windows close properly with functional locks' },
  // Utilities
  { id: 'util-water',   category: 'Utilities',  label: 'Water supply',          description: 'Taps, pipes, and overhead tank functional with no leaks' },
  { id: 'util-drainage',category: 'Utilities',  label: 'Drainage system',       description: 'Gutters and drainage channels clear and functional' },
  { id: 'util-sanitary',category: 'Utilities',  label: 'Sanitary fixtures',     description: 'Toilets and bathroom fittings in serviceable condition' },
  // Environment
  { id: 'env-compound', category: 'Environment', label: 'Compound condition',   description: 'Perimeter fence, gate, and surrounding area in good order' },
  { id: 'env-waste',    category: 'Environment', label: 'Waste management',     description: 'Waste disposal area identified and accessible' },
  // BQ
  { id: 'bq-cond',      category: "BQ", label: "BQ unit condition",             description: 'If BQ is present, inspect for structural and utility status' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EstateOfficerPanelProps {
  application: HousingApplication;
  pointsBreakdown: PointsBreakdown | null;
}

// ---------------------------------------------------------------------------
// Metric Row
// ---------------------------------------------------------------------------

function MetricRow({
  metric,
  value,
  onChange,
}: {
  metric: InspectionMetric;
  value: InspectionRating;
  onChange: (v: InspectionRating) => void;
}) {
  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border transition-all',
      value === 'PASS' && 'bg-emerald-50 border-emerald-200',
      value === 'FAIL' && 'bg-red-50 border-red-200',
      value === 'NA'   && 'bg-muted/30 border-muted',
      value === null   && 'bg-background border-border'
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{metric.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{metric.description}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {(['PASS', 'FAIL', 'NA'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? null : opt)}
            className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-md border transition-all',
              opt === 'PASS' && value === 'PASS' && 'bg-emerald-500 text-white border-emerald-500',
              opt === 'PASS' && value !== 'PASS' && 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
              opt === 'FAIL' && value === 'FAIL' && 'bg-red-500 text-white border-red-500',
              opt === 'FAIL' && value !== 'FAIL' && 'border-red-300 text-red-700 hover:bg-red-50',
              opt === 'NA'   && value === 'NA'   && 'bg-muted text-foreground border-muted-foreground/40',
              opt === 'NA'   && value !== 'NA'   && 'border-muted-foreground/30 text-muted-foreground hover:bg-muted/40',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EstateOfficerPanel({ application, pointsBreakdown }: EstateOfficerPanelProps) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, InspectionRating>>(
    () => Object.fromEntries(INSPECTION_METRICS.map(m => [m.id, null]))
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { comments: '', decision: 'FORWARDED' },
  });

  const watched = form.watch();

  function setRating(id: string, v: InspectionRating) {
    setRatings(prev => ({ ...prev, [id]: v }));
  }

  // Group metrics by category
  const categories = [...new Set(INSPECTION_METRICS.map(m => m.category))];

  const rated       = Object.values(ratings).filter(v => v !== null).length;
  const failCount   = Object.values(ratings).filter(v => v === 'FAIL').length;
  const passCount   = Object.values(ratings).filter(v => v === 'PASS').length;
  const allRated    = rated === INSPECTION_METRICS.length;
  const hasFailures = failCount > 0;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId: application.id,
        stage:         'ESTATE',
        decision:      values.decision,
        comments:      values.comments,
      });

      if (res.success) {
        toast.success(
          values.decision === 'FORWARDED'
            ? 'Physical inspection complete — forwarded to DVC Admin'
            : 'Application rejected at Estate Office stage'
        );
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to submit review');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Score from Stage 1 */}
      {pointsBreakdown && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Housing Secretary Score</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {pointsBreakdown.totalPoints} pts
              <span className="font-normal text-muted-foreground ml-2">
                (Base {pointsBreakdown.baseTypePoints} + Seniority {pointsBreakdown.seniorityBonus} + Dependents {pointsBreakdown.dependentsBonus} + Marital {pointsBreakdown.maritalStatusBonus})
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="flex gap-3 text-sm">
        <div className="flex-1 rounded-lg border bg-emerald-50 border-emerald-200 px-3 py-2 text-center">
          <p className="text-2xl font-bold text-emerald-600">{passCount}</p>
          <p className="text-xs text-emerald-700">Passed</p>
        </div>
        <div className="flex-1 rounded-lg border bg-red-50 border-red-200 px-3 py-2 text-center">
          <p className="text-2xl font-bold text-red-500">{failCount}</p>
          <p className="text-xs text-red-700">Failed</p>
        </div>
        <div className="flex-1 rounded-lg border bg-muted px-3 py-2 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{INSPECTION_METRICS.length - rated}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Inspection metrics by category */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {categories.map(cat => (
          <div key={cat} className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{cat}</h4>
            </div>
            <div className="p-3 space-y-2">
              {INSPECTION_METRICS.filter(m => m.category === cat).map(metric => (
                <MetricRow
                  key={metric.id}
                  metric={metric}
                  value={ratings[metric.id]}
                  onChange={v => setRating(metric.id, v)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Warning if failures */}
        {hasFailures && watched.decision === 'FORWARDED' && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <FailIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{failCount} metric(s) marked as FAIL. Consider rejecting or explain in field notes before forwarding.</p>
          </div>
        )}

        {/* Field notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Field Notes & Observations</label>
          <textarea
            {...form.register('comments')}
            rows={4}
            placeholder="Describe your on-site findings, conditions observed, and recommendations..."
            className={cn(
              'w-full text-sm px-3 py-2 rounded-xl border bg-background resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
            )}
          />
          {form.formState.errors.comments && (
            <p className="text-xs text-destructive">{form.formState.errors.comments.message}</p>
          )}
        </div>

        {/* Decision */}
        <div className="flex gap-3">
          <label className={cn(
            'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'FORWARDED' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="FORWARDED" {...form.register('decision')} className="accent-primary" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <ChevronRight className="h-4 w-4 text-primary" /> Forward to DVC Admin
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Inspection satisfactory — advance to Stage 3</p>
            </div>
          </label>

          <label className={cn(
            'flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
            watched.decision === 'REJECTED' ? 'border-destructive bg-red-50' : 'border-border hover:border-muted-foreground/40'
          )}>
            <input type="radio" value="REJECTED" {...form.register('decision')} className="accent-red-500" />
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-destructive" /> Reject Application
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Conditions do not meet requirements</p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending || !allRated}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm',
            watched.decision === 'REJECTED'
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {watched.decision === 'FORWARDED' ? 'Submit & Forward to DVC Admin' : 'Submit Rejection'}
        </button>
        {!allRated && (
          <p className="text-xs text-center text-amber-600">
            Rate all {INSPECTION_METRICS.length} inspection metrics to proceed
          </p>
        )}
      </form>
    </div>
  );
}
