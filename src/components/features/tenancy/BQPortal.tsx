'use client';

// =============================================================================
// BQPortal — Self-Service Boys Quarters (BQ) Management
// =============================================================================
// Main occupants can add, update, or remove sub-occupants per BQ unit.
// Enforces: max 1 occupant per BQ, cannot add to OCCUPIED BQs.
// Each BQ card shows status and occupant details with inline forms.
// =============================================================================

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { bqOccupantSchema, type BQOccupantFormValues } from '@/lib/validations/housing';
import {
  addBQOccupantAction,
  updateBQOccupantAction,
  removeBQOccupantAction,
} from '@/app/actions/housing';
import {
  Home,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  UserX,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { BQ, BQOccupant } from '@/lib/mock-api/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BQWithOccupant = BQ & { occupant: BQOccupant | null };

interface Props {
  bqs: BQWithOccupant[];
  /** Housing type max BQ count — used for info display */
  maxBQs: number;
}

// ---------------------------------------------------------------------------
// BQ Occupant form
// ---------------------------------------------------------------------------

interface OccupantFormProps {
  bqId: string;
  existing?: BQOccupant | null;
  onClose: () => void;
  onSaved: (occupant: BQOccupant) => void;
}

function OccupantForm({ bqId, existing, onClose, onSaved }: OccupantFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BQOccupantFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bqOccupantSchema) as any,
    defaultValues: {
      bqId,
      fullName: existing?.fullName ?? '',
      phoneNumber: existing?.phoneNumber ?? '',
      email: existing?.email ?? '',
      relationship: existing?.relationship ?? '',
    },
  });

  const isEditing = !!existing;

  function onSubmit(values: BQOccupantFormValues) {
    startTransition(async () => {
      if (isEditing && existing) {
        const res = await updateBQOccupantAction(existing.id, {
          fullName: values.fullName,
          phoneNumber: values.phoneNumber,
          email: values.email || undefined,
          relationship: values.relationship,
        });
        if (res.success) {
          toast.success('Sub-occupant details updated successfully.');
          const updatedOccupant: BQOccupant = {
            ...existing,
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            email: values.email || undefined,
            relationship: values.relationship,
          };
          onSaved(updatedOccupant);
        } else {
          toast.error(res.error ?? 'Failed to update occupant');
        }
      } else {
        const res = await addBQOccupantAction(values);
        if (res.success) {
          toast.success('Sub-occupant added to BQ successfully.');
          const newOccupant = res.data as BQOccupant;
          onSaved(newOccupant);
        } else {
          toast.error(res.error ?? 'Failed to add occupant');
        }
      }
    });
  }

  return (
    <div className="mt-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          {isEditing ? (
            <><Pencil className="h-4 w-4 text-primary" /> Edit Sub-Occupant</>
          ) : (
            <><Plus className="h-4 w-4 text-primary" /> Add Sub-Occupant</>
          )}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id={`bq-form-${bqId}`} noValidate>
        {/* Hidden bqId */}
        <input type="hidden" {...form.register('bqId')} />

        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor={`fullName-${bqId}`} className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            id={`fullName-${bqId}`}
            type="text"
            placeholder="e.g. Emmanuel Afolabi"
            {...form.register('fullName')}
            className={cn(
              'w-full text-sm px-3.5 py-2.5 rounded-xl border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition',
              form.formState.errors.fullName && 'border-destructive focus:ring-destructive/30'
            )}
          />
          {form.formState.errors.fullName && (
            <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor={`phone-${bqId}`} className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Phone Number <span className="text-destructive">*</span>
          </label>
          <input
            id={`phone-${bqId}`}
            type="tel"
            placeholder="e.g. 08012345678"
            {...form.register('phoneNumber')}
            className={cn(
              'w-full text-sm px-3.5 py-2.5 rounded-xl border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition',
              form.formState.errors.phoneNumber && 'border-destructive focus:ring-destructive/30'
            )}
          />
          {form.formState.errors.phoneNumber && (
            <p className="text-xs text-destructive">{form.formState.errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor={`email-${bqId}`} className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Email Address <span className="text-muted-foreground text-xs font-normal">(optional)</span>
          </label>
          <input
            id={`email-${bqId}`}
            type="email"
            placeholder="e.g. person@example.com"
            {...form.register('email')}
            className={cn(
              'w-full text-sm px-3.5 py-2.5 rounded-xl border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition',
              form.formState.errors.email && 'border-destructive focus:ring-destructive/30'
            )}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Relationship */}
        <div className="space-y-1.5">
          <label htmlFor={`relationship-${bqId}`} className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Relationship / Role <span className="text-destructive">*</span>
          </label>
          <select
            id={`relationship-${bqId}`}
            {...form.register('relationship')}
            className={cn(
              'w-full text-sm px-3.5 py-2.5 rounded-xl border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition',
              form.formState.errors.relationship && 'border-destructive focus:ring-destructive/30'
            )}
          >
            <option value="">Select relationship...</option>
            <option value="Domestic Staff">Domestic Staff</option>
            <option value="Family Member">Family Member</option>
            <option value="Caretaker">Caretaker</option>
            <option value="Driver">Driver</option>
            <option value="Other">Other</option>
          </select>
          {form.formState.errors.relationship && (
            <p className="text-xs text-destructive">{form.formState.errors.relationship.message}</p>
          )}
        </div>

        {/* Policy note */}
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            BQ sub-occupants must be domestic staff or immediate family members only. 
            Each BQ unit accommodates exactly one registered sub-occupant.
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all',
              'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
            )}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Add Sub-Occupant'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remove confirmation dialog
// ---------------------------------------------------------------------------

interface RemoveDialogProps {
  occupant: BQOccupant;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function RemoveDialog({ occupant, onConfirm, onCancel, isPending }: RemoveDialogProps) {
  return (
    <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
        <div>
          <p className="font-semibold text-sm text-red-700">Remove Sub-Occupant?</p>
          <p className="text-xs text-red-600 mt-0.5">
            This will remove <strong>{occupant.fullName}</strong> and free up this BQ unit.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Trash2 className="h-4 w-4" />
          Confirm Remove
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual BQ card
// ---------------------------------------------------------------------------

interface BQCardProps {
  bq: BQWithOccupant;
  index: number;
  onBQUpdated: (patch: Partial<BQWithOccupant> & { id: string }) => void;
}

function BQCard({ bq, index, onBQUpdated }: BQCardProps) {
  const [mode, setMode] = useState<'view' | 'add' | 'edit' | 'remove'>('view');
  const [removePending, startRemove] = useTransition();

  const isOccupied = bq.status === 'OCCUPIED' && !!bq.occupant;

  function handleRemove() {
    if (!bq.occupant) return;
    startRemove(async () => {
      const res = await removeBQOccupantAction(bq.occupant!.id);
      if (res.success) {
        toast.success(`${bq.occupant!.fullName} removed from ${bq.label}.`);
        setMode('view');
        onBQUpdated({ id: bq.id, occupant: null, status: 'VACANT' });
      } else {
        toast.error(res.error ?? 'Failed to remove sub-occupant');
      }
    });
  }

  return (
    <div className={cn(
      'rounded-2xl border-2 bg-card overflow-hidden transition-all duration-300',
      isOccupied
        ? 'border-primary/20 shadow-md'
        : 'border-dashed border-border bg-secondary/20'
    )}>
      {/* Card header */}
      <div className={cn(
        'px-6 py-4 flex items-center justify-between',
        isOccupied ? 'bg-primary/5' : 'bg-muted/30'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
            isOccupied ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            {index + 1}
          </div>
          <div>
            <p className="font-bold text-sm">{bq.label}</p>
            <p className="text-xs text-muted-foreground">Housing Sub-Unit</p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide',
          isOccupied
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            : 'bg-muted text-muted-foreground border border-border'
        )}>
          {isOccupied ? (
            <><CheckCircle2 className="h-3 w-3" /> Occupied</>
          ) : (
            <><Home className="h-3 w-3" /> Vacant</>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-6 pb-6 pt-4">
        {isOccupied && bq.occupant ? (
          <>
            {/* Occupant details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Sub-Occupant</p>
                  <p className="font-semibold text-sm">{bq.occupant.fullName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{bq.occupant.phoneNumber}</span>
                </div>
                {bq.occupant.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">{bq.occupant.email}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                  {bq.occupant.relationship}
                </span>
              </div>
            </div>

            {/* Actions */}
            {mode === 'view' && (
              <div className="flex gap-2">
                <button
                  id={`edit-bq-${bq.id}`}
                  onClick={() => setMode('edit')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  id={`remove-bq-${bq.id}`}
                  onClick={() => setMode('remove')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            )}

            {mode === 'edit' && (
              <OccupantForm
                bqId={bq.id}
                existing={bq.occupant}
                onClose={() => setMode('view')}
                onSaved={(occupant) => {
                  setMode('view');
                  onBQUpdated({ id: bq.id, occupant, status: 'OCCUPIED' });
                }}
              />
            )}

            {mode === 'remove' && (
              <RemoveDialog
                occupant={bq.occupant}
                onConfirm={handleRemove}
                onCancel={() => setMode('view')}
                isPending={removePending}
              />
            )}
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/70">BQ Vacant</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No sub-occupant registered in this unit.
                </p>
              </div>
            </div>

            {mode === 'view' && (
              <button
                id={`add-bq-${bq.id}`}
                onClick={() => setMode('add')}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  'border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50'
                )}
              >
                <Plus className="h-4 w-4" />
                Register Sub-Occupant
              </button>
            )}

            {mode === 'add' && (
              <OccupantForm
                bqId={bq.id}
                onClose={() => setMode('view')}
                onSaved={(occupant) => {
                  setMode('view');
                  onBQUpdated({ id: bq.id, occupant, status: 'OCCUPIED' });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Portal Component
// ---------------------------------------------------------------------------

export function BQPortal({ bqs: initialBqs, maxBQs }: Props) {
  const [bqs, setBqs] = useState<BQWithOccupant[]>(initialBqs);
  const occupiedCount = bqs.filter(b => b.status === 'OCCUPIED').length;
  const vacantCount = bqs.filter(b => b.status === 'VACANT').length;

  function handleBQUpdated(patch: Partial<BQWithOccupant> & { id: string }) {
    setBqs(prev =>
      prev.map(b =>
        b.id === patch.id ? { ...b, ...patch } : b
      )
    );
  }

  if (bqs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-12 text-center space-y-4">
        <Home className="h-14 w-14 text-muted-foreground/30 mx-auto" />
        <div>
          <h2 className="text-xl font-semibold">No BQ Units Available</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            Your current housing unit does not include any Boys Quarters (BQ) sub-units.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 text-center space-y-1">
          <p className="text-2xl font-extrabold">{maxBQs}</p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total BQ Units</p>
        </div>
        <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-4 text-center space-y-1">
          <p className="text-2xl font-extrabold text-emerald-700">{occupiedCount}</p>
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Occupied</p>
        </div>
        <div className="rounded-xl border bg-secondary/50 p-4 text-center space-y-1">
          <p className="text-2xl font-extrabold text-muted-foreground">{vacantCount}</p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vacant</p>
        </div>
      </div>

      {/* Policy banner */}
      <div className="flex items-start gap-3 rounded-xl border bg-primary/5 border-primary/20 px-5 py-3.5 text-sm">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-primary/90">Occupancy Policy</p>
          <p className="text-xs text-primary/70">
            Maximum <strong>{maxBQs} sub-occupant{maxBQs !== 1 ? 's' : ''}</strong> allowed across your {maxBQs} BQ unit{maxBQs !== 1 ? 's' : ''}.
            Each BQ accommodates exactly one registered person. Sub-occupants must be domestic staff or immediate family members only.
          </p>
        </div>
      </div>

      {/* BQ cards grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {bqs.map((bq, i) => (
          <BQCard key={bq.id} bq={bq} index={i} onBQUpdated={handleBQUpdated} />
        ))}
      </div>
    </div>
  );
}
