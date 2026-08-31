'use client';

// =============================================================================
// EstateOfficerPanel — Stage 2 Physical Inspection + Unit Allocation
// =============================================================================
// Estate Officer can:
//   1. Run a physical inspection (PASS / FAIL / NA per metric)
//   2. Select a vacant housing unit to pre-allocate for the applicant
//   3. Forward to DVC Admin (requires unit selection) OR
//      Place application in Queue (no unit selected yet) OR
//      Reject the application
//
// When the application is already QUEUED, the panel shows a re-activation form
// where the officer can pick a newly-vacant unit and send it back to DVC.
// =============================================================================

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2, Loader2, ChevronRight, XCircle,
  Clock, Home, CheckCircle2, AlertCircle, RefreshCw,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  reviewApplicationAction,
  getVacantUnitsForApplicationAction,
  requeueApplicationAction,
} from '@/app/actions/applications';
import type { HousingApplication, PointsBreakdown, HousingUnit, HousingType } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const formSchema = z.object({
  comments: z
    .string()
    .min(10, 'Field notes must be at least 10 characters')
    .max(1000, 'Field notes must be under 1000 characters'),
  decision: z.enum(['FORWARDED', 'QUEUED', 'REJECTED']),
  allocatedUnitId: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.decision === 'FORWARDED' && !data.allocatedUnitId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a housing unit before forwarding to DVC Admin',
      path: ['allocatedUnitId'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

// Re-queue form schema (for already-queued applications)
const requeueFormSchema = z.object({
  allocatedUnitId: z.string().min(1, 'Please select a housing unit to re-activate'),
  notes: z.string().min(10, 'Please add a note explaining the re-activation').max(500),
});
type RequeueFormValues = z.infer<typeof requeueFormSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VacantUnitData = {
  unit: HousingUnit;
  housingType: HousingType | null;
  isEligible: boolean;
  matchesPreference: boolean;
  matchesCategory: boolean;
};

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
  { id: 'str-walls',    category: 'Structural',   label: 'Wall integrity',     description: 'No cracks, damp, or structural deformities observed' },
  { id: 'str-roof',     category: 'Structural',   label: 'Roof condition',     description: 'Roof is intact — no leaks, sagging, or missing sections' },
  { id: 'str-floors',   category: 'Structural',   label: 'Floor condition',    description: 'Floors are even, clean, and in good repair' },
  { id: 'str-windows',  category: 'Structural',   label: 'Doors & windows',    description: 'All doors and windows close properly with functional locks' },
  // Utilities
  { id: 'util-water',   category: 'Utilities',    label: 'Water supply',       description: 'Taps, pipes, and overhead tank functional with no leaks' },
  { id: 'util-drainage',category: 'Utilities',    label: 'Drainage system',    description: 'Gutters and drainage channels clear and functional' },
  { id: 'util-sanitary',category: 'Utilities',    label: 'Sanitary fixtures',  description: 'Toilets and bathroom fittings in serviceable condition' },
  // Environment
  { id: 'env-compound', category: 'Environment',  label: 'Compound condition', description: 'Perimeter fence, gate, and surrounding area in good order' },
  { id: 'env-waste',    category: 'Environment',  label: 'Waste management',   description: 'Waste disposal area identified and accessible' },
  // BQ
  { id: 'bq-cond',      category: 'BQ',           label: 'BQ unit condition',  description: 'If BQ is present, inspect for structural and utility status' },
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
// Unit Card — for the unit picker
// ---------------------------------------------------------------------------

function UnitCard({
  data,
  isSelected,
  onSelect,
}: {
  data: VacantUnitData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { unit, housingType, isEligible, matchesPreference, matchesCategory } = data;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 transition-all',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-background hover:border-primary/40 hover:bg-primary/[0.02]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'p-2 rounded-lg shrink-0',
            isSelected ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Home className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="font-semibold text-sm">{unit.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {housingType?.name ?? 'Unknown Type'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            VACANT
          </span>
          {!isEligible && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="h-2.5 w-2.5" /> Non-eligible
            </span>
          )}
        </div>
      </div>
      {housingType && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
              {housingType.numberOfBedrooms} bed · {housingType.numberOfBathrooms} bath
            </span>
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted capitalize">
              {housingType.buildingType.toLowerCase()}
            </span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded capitalize font-medium",
              matchesCategory ? "text-muted-foreground bg-muted" : "text-amber-800 bg-amber-100 border border-amber-200"
            )}>
              {housingType.category.toLowerCase()} staff
            </span>
            {housingType.hasBQ && (
              <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted">
                Has BQ
              </span>
            )}
          </div>
          
          {matchesPreference && (
            <div className="flex items-center gap-1 text-xs text-primary font-medium">
              <Star className="h-3 w-3" /> Matches Preference
            </div>
          )}
        </div>
      )}
    </button>
  );
}

function VacantUnitsList({
  vacantUnits,
  selectedUnitId,
  onSelectUnit,
}: {
  vacantUnits: VacantUnitData[];
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string) => void;
}) {
  const eligibleUnits = vacantUnits.filter(u => u.isEligible);
  const otherUnits = vacantUnits.filter(u => !u.isEligible);

  return (
    <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-1">
      {eligibleUnits.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Eligible Units
          </h5>
          <div className="grid gap-2">
            {eligibleUnits.map((data) => (
              <UnitCard
                key={data.unit.id}
                data={data}
                isSelected={selectedUnitId === data.unit.id}
                onSelect={() => onSelectUnit(data.unit.id)}
              />
            ))}
          </div>
        </div>
      )}

      {otherUnits.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pt-2 border-t">
            Other Vacant Units
          </h5>
          <div className="grid gap-2">
            {otherUnits.map((data) => (
              <UnitCard
                key={data.unit.id}
                data={data}
                isSelected={selectedUnitId === data.unit.id}
                onSelect={() => onSelectUnit(data.unit.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Re-queue Panel — shown when application is already QUEUED
// ---------------------------------------------------------------------------

function RequeuePanel({
  application,
  vacantUnits,
  loadingUnits,
}: {
  application: HousingApplication;
  vacantUnits: VacantUnitData[];
  loadingUnits: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const form = useForm<RequeueFormValues>({
    resolver: zodResolver(requeueFormSchema),
    defaultValues: { allocatedUnitId: '', notes: '' },
  });

  function onSubmit(values: RequeueFormValues) {
    startTransition(async () => {
      const res = await requeueApplicationAction({
        applicationId: application.id,
        allocatedUnitId: values.allocatedUnitId,
      });
      if (res.success) {
        toast.success('Application re-activated and forwarded to DVC Admin');
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to re-activate application');
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Vacant unit picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Select a Vacant Unit
          </h4>
          {loadingUnits && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {!loadingUnits && vacantUnits.length === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">No vacant housing units are currently available. Check back later.</p>
          </div>
        )}

        {!loadingUnits && vacantUnits.length > 0 && (
          <VacantUnitsList
            vacantUnits={vacantUnits}
            selectedUnitId={selectedUnitId}
            onSelectUnit={(id) => {
              setSelectedUnitId(id);
              form.setValue('allocatedUnitId', id, { shouldValidate: true });
            }}
          />
        )}
        {form.formState.errors.allocatedUnitId && (
          <p className="text-xs text-destructive">{form.formState.errors.allocatedUnitId.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Re-activation Notes</label>
        <textarea
          {...form.register('notes')}
          rows={3}
          placeholder="Explain why the application is being re-activated now..."
          className={cn(
            'w-full text-sm px-3 py-2 rounded-xl border bg-background resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'
          )}
        />
        {form.formState.errors.notes && (
          <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !selectedUnitId || vacantUnits.length === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
        )}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Re-activate & Forward to DVC Admin
      </button>
    </form>
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
  const [vacantUnits, setVacantUnits] = useState<VacantUnitData[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    application.allocatedUnitId ?? null
  );

  const isQueued = application.status === 'QUEUED';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: '',
      decision: 'FORWARDED',
      allocatedUnitId: application.allocatedUnitId ?? null,
    },
  });

  const watched = form.watch();

  // Load vacant units on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingUnits(true);
    getVacantUnitsForApplicationAction(application.id).then(res => {
      if (cancelled) return;
      if (res.success) {
        setVacantUnits(res.data);
      } else {
        toast.error(res.error ?? 'Could not load vacant units');
      }
      setLoadingUnits(false);
    });
    return () => { cancelled = true; };
  }, [application.id]);

  function setRating(id: string, v: InspectionRating) {
    setRatings(prev => ({ ...prev, [id]: v }));
  }

  const categories = [...new Set(INSPECTION_METRICS.map(m => m.category))];
  const rated     = Object.values(ratings).filter(v => v !== null).length;
  const failCount = Object.values(ratings).filter(v => v === 'FAIL').length;
  const passCount = Object.values(ratings).filter(v => v === 'PASS').length;
  const allRated  = rated === INSPECTION_METRICS.length;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId: application.id,
        stage:         'ESTATE' as const,
        decision:      values.decision,
        comments:      values.comments,
        allocatedUnitId: values.decision === 'FORWARDED' ? values.allocatedUnitId : null,
      });

      if (res.success) {
        if (values.decision === 'FORWARDED') {
          toast.success('Unit allocated — application forwarded to DVC Admin');
        } else if (values.decision === 'QUEUED') {
          toast.success('Application placed in queue — awaiting a suitable unit');
        } else {
          toast.error('Application rejected at Estate Office stage');
        }
        router.refresh();
      } else {
        toast.error(res.error ?? 'Failed to submit review');
      }
    });
  }

  // ── If application is QUEUED, show the re-queue panel instead ──
  if (isQueued) {
    return (
      <div className="space-y-6">
        {/* Queued status banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Application is in Queue</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This application is awaiting a suitable vacant unit. Once a unit becomes available,
              select it below and forward the application to DVC Admin.
            </p>
          </div>
        </div>

        {/* Previous score from Stage 1 */}
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

        <RequeuePanel
          application={application}
          vacantUnits={vacantUnits}
          loadingUnits={loadingUnits}
        />
      </div>
    );
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Inspection metrics by category */}
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
        {failCount > 0 && watched.decision === 'FORWARDED' && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{failCount} metric(s) marked as FAIL. Consider rejecting or explain in field notes before forwarding.</p>
          </div>
        )}

        {/* ── Unit Allocation Section ── */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Housing Unit Allocation
            </h3>
            {loadingUnits && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              All vacant units are listed below. <span className="font-medium text-emerald-700">Eligible units</span> match both the applicant&apos;s housing preferences and staff category. Non-eligible units are shown for reference and can be selected if the officer determines it is appropriate.
            </p>

            {!loadingUnits && vacantUnits.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">No vacant units available</p>
                  <p className="text-xs mt-0.5">
                    If no suitable unit exists, place this application in the queue using the decision below.
                  </p>
                </div>
              </div>
            )}

            {!loadingUnits && vacantUnits.length > 0 && (
              <VacantUnitsList
                vacantUnits={vacantUnits}
                selectedUnitId={selectedUnitId}
                onSelectUnit={(id) => {
                  setSelectedUnitId(id);
                  form.setValue('allocatedUnitId', id, { shouldValidate: true });
                }}
              />
            )}

            {/* Clear selection */}
            {selectedUnitId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitId(null);
                  form.setValue('allocatedUnitId', null);
                }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition"
              >
                Clear selection
              </button>
            )}

            {form.formState.errors.allocatedUnitId && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.allocatedUnitId.message}
              </p>
            )}

            {/* Selected unit confirmation */}
            {selectedUnitId && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{vacantUnits.find(v => v.unit.id === selectedUnitId)?.unit.name}</strong> selected for allocation
                </span>
              </div>
            )}
          </div>
        </div>

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

        {/* Decision — three options */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Decision</p>
          <div className="grid gap-2">
            {/* Forward to DVC */}
            <label className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              watched.decision === 'FORWARDED' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
            )}>
              <input type="radio" value="FORWARDED" {...form.register('decision')} className="accent-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <ChevronRight className="h-4 w-4 text-primary" /> Forward to DVC Admin
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unit selected — forward to DVC Admin for final approval
                  {selectedUnitId
                    ? <span className="text-primary font-medium"> ({vacantUnits.find(v => v.unit.id === selectedUnitId)?.unit.name})</span>
                    : <span className="text-amber-600"> (requires unit selection above)</span>
                  }
                </p>
              </div>
            </label>

            {/* Place in Queue */}
            <label className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              watched.decision === 'QUEUED' ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-muted-foreground/40'
            )}>
              <input type="radio" value="QUEUED" {...form.register('decision')} className="accent-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-600" /> Place in Queue
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No suitable unit available — hold application until a vacancy arises
                </p>
              </div>
            </label>

            {/* Reject */}
            <label className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              watched.decision === 'REJECTED' ? 'border-destructive bg-red-50' : 'border-border hover:border-muted-foreground/40'
            )}>
              <input type="radio" value="REJECTED" {...form.register('decision')} className="accent-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" /> Reject Application
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Conditions do not meet requirements</p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !allRated}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm',
            watched.decision === 'REJECTED'
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : watched.decision === 'QUEUED'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {watched.decision === 'FORWARDED' && 'Submit & Forward to DVC Admin'}
          {watched.decision === 'QUEUED'    && 'Place in Queue'}
          {watched.decision === 'REJECTED'  && 'Submit Rejection'}
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
