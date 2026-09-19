'use client';

// =============================================================================
// EstateOfficerPanel — Stage 2 Physical Inspection + Unit Allocation
// =============================================================================
// Estate Officer can:
//   1. Select a vacant housing unit to suggest for the applicant
//      (the unit picker now appears FIRST so the officer confirms/chooses a unit
//       before filling out inspection metrics)
//   2. Run a physical inspection (PASS / FAIL / NA per metric) for each suggested unit.
//      - If the EO accepts the HS suggestion, only one inspection form is shown.
//      - If the EO picks a different unit, a tabbed interface allows the officer
//        to rate BOTH units independently.
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
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2, Loader2, ChevronRight, XCircle,
  Clock, Home, CheckCircle2, AlertCircle, RefreshCw,
  Star, BedDouble, MapPin, Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  reviewApplicationAction,
  getVacantUnitsForApplicationAction,
  requeueApplicationAction,
} from '@/app/actions/applications';
import type { HousingApplication, PointsBreakdown, HousingUnit, HousingType } from '@/lib/mock-api/db';
import { VacantUnitsGrid, type VacantUnitData } from './VacantUnitsGrid';
export type { VacantUnitData };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const formSchema = z.object({
  comments: z
    .string()
    .max(1000, 'Field notes must be under 1000 characters')
    .optional()
    .or(z.literal('')),
  decision: z.enum(['FORWARDED', 'QUEUED', 'REJECTED', 'SAVE_DRAFT']),
  estateSuggestedUnitId: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.decision === 'FORWARDED' && !data.estateSuggestedUnitId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a housing unit before forwarding to DVC Admin',
      path: ['estateSuggestedUnitId'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

// Re-queue form schema (for already-queued applications)
const requeueFormSchema = z.object({
  allocatedUnitId: z.string().min(1, 'Please select a housing unit to re-activate'),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional().or(z.literal('')),
});
type RequeueFormValues = z.infer<typeof requeueFormSchema>;



// ---------------------------------------------------------------------------
// Inspection metric definition
// ---------------------------------------------------------------------------

type InspectionRating = 'GOOD' | 'FAIR' | 'BAD' | 'NA' | null;

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
      value === 'GOOD' && 'bg-emerald-50 border-emerald-200',
      value === 'FAIR' && 'bg-amber-50 border-amber-200',
      value === 'BAD'  && 'bg-red-50 border-red-200',
      value === null   && 'bg-background border-border'
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{metric.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{metric.description}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {(['GOOD', 'FAIR', 'BAD', 'NA'] as const).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? null : opt)}
            className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-md border transition-all',
              opt === 'GOOD' && value === 'GOOD' && 'bg-emerald-500 text-white border-emerald-500',
              opt === 'GOOD' && value !== 'GOOD' && 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
              opt === 'FAIR' && value === 'FAIR' && 'bg-amber-500 text-white border-amber-500',
              opt === 'FAIR' && value !== 'FAIR' && 'border-amber-300 text-amber-700 hover:bg-amber-50',
              opt === 'BAD'  && value === 'BAD'  && 'bg-red-500 text-white border-red-500',
              opt === 'BAD'  && value !== 'BAD'  && 'border-red-300 text-red-700 hover:bg-red-50',
              opt === 'NA'   && value === 'NA'   && 'bg-slate-500 text-white border-slate-500',
              opt === 'NA'   && value !== 'NA'   && 'border-slate-300 text-slate-600 hover:bg-slate-50',
            )}
          >
            {opt === 'GOOD' ? 'Good' : opt === 'FAIR' ? 'Fair' : opt === 'BAD' ? 'Bad' : 'N/A'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit Detail Pill — compact readable info strip for a unit
// ---------------------------------------------------------------------------

function UnitDetailStrip({ unit, housingType }: { unit: VacantUnitData['unit']; housingType: VacantUnitData['housingType'] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1 font-semibold text-foreground">
        <Home className="h-3.5 w-3.5 text-primary" />
        {unit.name}
      </span>
      {housingType && (
        <span className="flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          {housingType.name}
        </span>
      )}
      {housingType && (
        <span className="flex items-center gap-1">
          <BedDouble className="h-3.5 w-3.5" />
          {housingType.numberOfBedrooms} Bed
        </span>
      )}
      {unit.roadNumber && (
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          Road {unit.roadNumber}
        </span>
      )}
      {unit.houseNumber && (
        <span className="flex items-center gap-1">
          <Hash className="h-3.5 w-3.5" />
          {unit.houseNumber}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inspection Panel — metric cards + per-unit summary counts
// ---------------------------------------------------------------------------

function InspectionPanel({
  unitRatings,
  onRatingChange,
}: {
  unitRatings: Record<string, InspectionRating>;
  onRatingChange: (metricId: string, v: InspectionRating) => void;
}) {
  const categories = [...new Set(INSPECTION_METRICS.map(m => m.category))];
  const goodCount = Object.values(unitRatings).filter(v => v === 'GOOD').length;
  const fairCount = Object.values(unitRatings).filter(v => v === 'FAIR').length;
  const badCount  = Object.values(unitRatings).filter(v => v === 'BAD').length;
  const rated     = Object.values(unitRatings).filter(v => v !== null).length;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex gap-3 text-sm">
        <div className="flex-1 rounded-lg border bg-emerald-50 border-emerald-200 px-3 py-2 text-center">
          <p className="text-2xl font-bold text-emerald-600">{goodCount}</p>
          <p className="text-xs text-emerald-700">Good</p>
        </div>
        <div className="flex-1 rounded-lg border bg-amber-50 border-amber-200 px-3 py-2 text-center">
          <p className="text-2xl font-bold text-amber-600">{fairCount}</p>
          <p className="text-xs text-amber-700">Fair</p>
        </div>
        <div className="flex-1 rounded-lg border bg-red-50 border-red-200 px-3 py-2 text-center">
          <p className="text-2xl font-bold text-red-500">{badCount}</p>
          <p className="text-xs text-red-700">Bad</p>
        </div>
        <div className="flex-1 rounded-lg border bg-muted px-3 py-2 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{INSPECTION_METRICS.length - rated}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Metrics by category */}
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
                value={unitRatings[metric.id]}
                onChange={v => onRatingChange(metric.id, v)}
              />
            ))}
          </div>
        </div>
      ))}
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
          <VacantUnitsGrid
            vacantUnits={vacantUnits}
            selectedUnitId={selectedUnitId}
            onSelectUnit={(id) => {
              setSelectedUnitId(id);
              form.setValue('allocatedUnitId', id ?? '', { shouldValidate: true });
            }}
          />
        )}
        {form.formState.errors.allocatedUnitId && (
          <p className="text-xs text-destructive">{form.formState.errors.allocatedUnitId?.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">
          Re-activation Notes <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
        </label>
        <textarea
          {...form.register('notes')}
          rows={3}
          placeholder="Explain why the application is being re-activated now (optional)..."
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

  // Per-unit ratings: { [unitId]: { [metricId]: InspectionRating } }
  const initRatingsForUnit = () => Object.fromEntries(INSPECTION_METRICS.map(m => [m.id, null as InspectionRating]));
  const [ratings, setRatings] = useState<Record<string, Record<string, InspectionRating>>>({});

  const [isPending, startTransition] = useTransition();
  const [vacantUnits, setVacantUnits] = useState<VacantUnitData[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    application.estateSuggestedUnitId ?? null
  );
  // Active tab for inspection (when two units): 'HS' | 'EO'
  const [activeInspectionTab, setActiveInspectionTab] = useState<'HS' | 'EO'>('HS');

  const isQueued = application.status === 'QUEUED';
  const hsUnitId = application.secretarySuggestedUnitId ?? null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: '',
      decision: 'FORWARDED',
      estateSuggestedUnitId: application.estateSuggestedUnitId ?? null,
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
        // Initialise per-unit ratings for HS suggestion if present
        const hsId = application.secretarySuggestedUnitId;
        if (hsId) {
          setRatings(prev => ({
            ...prev,
            [hsId]: prev[hsId] ?? initRatingsForUnit(),
          }));
        }
        // Also initialise for EO unit if already set
        const eoId = application.estateSuggestedUnitId;
        if (eoId && eoId !== hsId) {
          setRatings(prev => ({
            ...prev,
            [eoId]: prev[eoId] ?? initRatingsForUnit(),
          }));
        }
      } else {
        toast.error(res.error ?? 'Could not load vacant units');
      }
      setLoadingUnits(false);
    });
    return () => { cancelled = true; };
  }, [application.id]);

  // When selectedUnitId changes, ensure ratings are initialised for that unit
  useEffect(() => {
    if (!selectedUnitId) return;
    setRatings(prev => ({
      ...prev,
      [selectedUnitId]: prev[selectedUnitId] ?? initRatingsForUnit(),
    }));
  }, [selectedUnitId]);

  function setRating(unitId: string, metricId: string, v: InspectionRating) {
    setRatings(prev => ({
      ...prev,
      [unitId]: { ...(prev[unitId] ?? initRatingsForUnit()), [metricId]: v },
    }));
  }

  // Derived state for inspection tab logic
  const isSameUnit = selectedUnitId && hsUnitId && selectedUnitId === hsUnitId;
  const showTwoTabs = !isSameUnit && !!hsUnitId && !!selectedUnitId;

  // Current unit being inspected in the active tab
  const activeUnitId = showTwoTabs
    ? (activeInspectionTab === 'HS' ? hsUnitId : selectedUnitId)
    : (selectedUnitId ?? hsUnitId);

  const activeUnitData = activeUnitId ? vacantUnits.find(v => v.unit.id === activeUnitId) : null;
  const activeUnitRatings = activeUnitId ? (ratings[activeUnitId] ?? initRatingsForUnit()) : initRatingsForUnit();

  // Are ALL metrics for ALL relevant units rated?
  const unitIdsToInspect = showTwoTabs
    ? [hsUnitId!, selectedUnitId!]
    : activeUnitId ? [activeUnitId] : [];
  const allRated = unitIdsToInspect.every(uid => {
    const r = ratings[uid] ?? {};
    return INSPECTION_METRICS.every(m => r[m.id] !== null && r[m.id] !== undefined);
  });

  const badCount = Object.values(activeUnitRatings).filter(v => v === 'BAD').length;

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      // Build inspectionData keyed by unitId
      const inspectionDataPayload: Record<string, Record<string, string>> = {};
      unitIdsToInspect.forEach(uid => {
        const unitRatings = ratings[uid];
        if (unitRatings) {
          const filtered = Object.fromEntries(
            Object.entries(unitRatings).filter(([, v]) => v !== null)
          ) as Record<string, string>;
          if (Object.keys(filtered).length > 0) {
            inspectionDataPayload[uid] = filtered;
          }
        }
      });

      const res = await reviewApplicationAction({
        applicationId:    application.id,
        stage:            'ESTATE' as const,
        decision:         values.decision,
        comments:         values.comments,
        estateSuggestedUnitId: values.estateSuggestedUnitId || null,
        inspectionData:   Object.keys(inspectionDataPayload).length > 0 ? inspectionDataPayload : null,
        isDraft:          values.decision === 'SAVE_DRAFT',
      });

      if (res.success) {
        if (values.decision === 'SAVE_DRAFT') {
          toast.success('Draft review and inspection notes saved');
        } else if (values.decision === 'FORWARDED') {
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
      {/* DVC Return Banner */}
      {application.status === 'RETURNED' && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/40 dark:border-amber-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Application Returned by DVC Admin for Modification
          </div>
          {application.dvcReturnNote && (
            <p className="text-xs text-amber-800 dark:text-amber-400 bg-white/70 dark:bg-amber-900/40 p-2.5 rounded-lg font-mono">
              &quot;{application.dvcReturnNote}&quot;
            </p>
          )}
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Please re-verify the housing unit allocation or inspect an alternative vacant unit based on the DVC Admin&apos;s feedback before resubmitting.
          </p>
        </div>
      )}

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

      {/* Housing Secretary Suggestion Banner */}
      {hsUnitId && (() => {
        const hsUnitData = vacantUnits.find(v => v.unit.id === hsUnitId);
        const hsUnit = hsUnitData?.unit;
        const hsType = hsUnitData?.housingType;
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 overflow-hidden">
            <div className="px-4 py-3 bg-blue-100/60 dark:bg-blue-900/40 border-b border-blue-200 dark:border-blue-800 flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Housing Secretary&apos;s Unit Suggestion
              </p>
            </div>
            <div className="p-4 space-y-3">
              {hsUnit ? (
                <UnitDetailStrip unit={hsUnit} housingType={hsType ?? null} />
              ) : (
                <p className="text-xs text-blue-700 dark:text-blue-400">Loading unit details…</p>
              )}
              <p className="text-xs text-blue-700 dark:text-blue-400">
                You may accept this suggestion or select a different unit below. If you pick a different unit, you will be required to record Physical Inspection scores for both units.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (hsUnitData) {
                    setSelectedUnitId(hsUnitId);
                    form.setValue('estateSuggestedUnitId', hsUnitId, { shouldValidate: true });
                    setActiveInspectionTab('HS');
                  } else {
                    toast.info('The suggested unit is no longer vacant. Please select an alternative.');
                  }
                }}
                className="mt-1 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900 transition"
              >
                Accept this suggestion
              </button>
            </div>
          </div>
        );
      })()}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── STEP 1: Housing Unit Allocation ── */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Step 1 — Select Housing Unit
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose the unit you wish to allocate (or accept the Housing Secretary&apos;s suggestion above).
              </p>
            </div>
            {loadingUnits && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              All vacant units are listed below. <span className="font-medium text-emerald-700">Eligible units</span> match both the applicant&apos;s housing preferences and staff category. Non-eligible units are shown for reference and can be selected if appropriate.
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
              <VacantUnitsGrid
                vacantUnits={vacantUnits}
                selectedUnitId={selectedUnitId}
                onSelectUnit={(id) => {
                  setSelectedUnitId(id);
                  form.setValue('estateSuggestedUnitId', id, { shouldValidate: true });
                  // Reset tab to HS when a new unit is selected
                  setActiveInspectionTab('HS');
                }}
                allowClear
              />
            )}

            {form.formState.errors.estateSuggestedUnitId && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                {form.formState.errors.estateSuggestedUnitId?.message}
              </p>
            )}

            {/* Selection confirmation */}
            {selectedUnitId && (() => {
              const selData = vacantUnits.find(v => v.unit.id === selectedUnitId);
              if (!selData) return null;
              const same = hsUnitId && selectedUnitId === hsUnitId;
              return (
                <div className={cn(
                  'flex items-center gap-2 text-xs rounded-lg px-3 py-2 border',
                  same
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-primary bg-primary/5 border-primary/20'
                )}>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>{selData.unit.name}</strong> selected
                    {same && <span className="ml-1 font-normal">(matches Housing Secretary&apos;s suggestion)</span>}
                    {!same && hsUnitId && (
                      <span className="ml-1 font-normal text-amber-600">
                        — differs from Housing Secretary&apos;s suggestion. You will need to inspect both units below.
                      </span>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── STEP 2: Physical Inspection ── */}
        {(selectedUnitId || hsUnitId) && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b">
              <h3 className="text-sm font-semibold">Step 2 — Physical Inspection</h3>
              {showTwoTabs ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Two units have been identified. Record inspection scores for both using the tabs below.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record the physical inspection score for the selected unit.
                </p>
              )}
            </div>

            {showTwoTabs ? (
              <div>
                {/* Tab headers */}
                <div className="flex border-b bg-muted/20">
                  {([
                    { key: 'HS' as const, unitId: hsUnitId!, label: 'HS Suggestion', badge: 'Housing Secretary', badgeColor: 'bg-blue-100 text-blue-800' },
                    { key: 'EO' as const, unitId: selectedUnitId!, label: 'Your Selection', badge: 'Estate Officer', badgeColor: 'bg-purple-100 text-purple-800' },
                  ]).map(tab => {
                    const tabData = vacantUnits.find(v => v.unit.id === tab.unitId);
                    const isActive = activeInspectionTab === tab.key;
                    const tabRatings = ratings[tab.unitId] ?? {};
                    const tabRated = Object.values(tabRatings).filter(v => v !== null).length;
                    const tabComplete = tabRated === INSPECTION_METRICS.length;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveInspectionTab(tab.key)}
                        className={cn(
                          'flex-1 text-left px-4 py-3 transition-all border-b-2',
                          isActive
                            ? 'border-primary bg-background'
                            : 'border-transparent hover:bg-muted/40'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', tab.badgeColor)}>
                                {tab.badge}
                              </span>
                              {tabComplete && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-sm font-semibold truncate">{tabData?.unit.name ?? tab.unitId}</p>
                            {tabData && (
                              <p className="text-xs text-muted-foreground truncate">
                                {tabData.housingType?.name}
                                {tabData.unit.roadNumber ? ` · Road ${tabData.unit.roadNumber}` : ''}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{tabRated}/{INSPECTION_METRICS.length}</p>
                            <p className="text-[10px] text-muted-foreground">rated</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active tab unit details strip */}
                {activeUnitData && (
                  <div className="px-4 py-2.5 bg-muted/10 border-b">
                    <UnitDetailStrip unit={activeUnitData.unit} housingType={activeUnitData.housingType} />
                  </div>
                )}

                {/* Inspection panel for active tab */}
                <div className="p-4">
                  <InspectionPanel
                    unitRatings={activeUnitRatings}
                    onRatingChange={(metricId, v) => setRating(activeUnitId!, metricId, v)}
                  />
                </div>
              </div>
            ) : (
              /* Single unit inspection */
              <div>
                {activeUnitData && (
                  <div className="px-4 py-2.5 bg-muted/10 border-b">
                    {isSameUnit && hsUnitId && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-700">
                          Both you and the Housing Secretary suggested this unit
                        </span>
                      </div>
                    )}
                    <UnitDetailStrip unit={activeUnitData.unit} housingType={activeUnitData.housingType} />
                  </div>
                )}
                <div className="p-4">
                  <InspectionPanel
                    unitRatings={activeUnitRatings}
                    onRatingChange={(metricId, v) => setRating(activeUnitId!, metricId, v)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning if bad ratings */}
        {badCount > 0 && watched.decision === 'FORWARDED' && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{badCount} metric(s) marked as BAD. Consider rejecting or explain in field notes before forwarding.</p>
          </div>
        )}

        {/* Field notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">
            Field Notes & Observations <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </label>
          <textarea
            {...form.register('comments')}
            rows={4}
            placeholder="Describe your on-site findings, conditions observed, and recommendations (optional)..."
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

            {/* Save Draft */}
            <label className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
              watched.decision === 'SAVE_DRAFT' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-border hover:border-muted-foreground/40'
            )}>
              <input type="radio" value="SAVE_DRAFT" {...form.register('decision')} className="accent-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <Star className="h-4 w-4 text-blue-500" /> Save Draft
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Save current inspection notes & unit selection without advancing</p>
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
          disabled={isPending || (watched.decision === 'FORWARDED' && !allRated)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm',
            watched.decision === 'REJECTED'
              ? 'bg-destructive text-white hover:bg-destructive/90'
              : watched.decision === 'QUEUED'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : watched.decision === 'SAVE_DRAFT'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {watched.decision === 'FORWARDED' && 'Submit & Forward to DVC Admin'}
          {watched.decision === 'SAVE_DRAFT' && 'Save Draft Inspection'}
          {watched.decision === 'QUEUED'    && 'Place in Queue'}
          {watched.decision === 'REJECTED'  && 'Submit Rejection'}
        </button>

        {!allRated && watched.decision === 'FORWARDED' && (
          <p className="text-xs text-center text-amber-600">
            Rate all {INSPECTION_METRICS.length} inspection metrics
            {showTwoTabs ? ' for both units' : ''} to proceed
          </p>
        )}
      </form>
    </div>
  );
}
