'use client';

import { type UseFormReturn } from 'react-hook-form';
import type { ApplicationWizardValues } from '@/lib/validations/housing';
import type { HousingType } from '@/lib/mock-api/db';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Bath, Star, Home, CheckCircle2, AlertCircle } from 'lucide-react';

interface StepHousingPreferencesProps {
  form: UseFormReturn<ApplicationWizardValues>;
  eligibleTypes: HousingType[];
}

export function StepHousingPreferences({ form, eligibleTypes }: StepHousingPreferencesProps) {
  const { watch, setValue, formState: { errors } } = form;
  const selected = watch('preferredHousingTypeIds') ?? [];

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setValue('preferredHousingTypeIds', selected.filter((s) => s !== id), {
        shouldValidate: true,
      });
    } else if (selected.length < 3) {
      setValue('preferredHousingTypeIds', [...selected, id], {
        shouldValidate: true,
      });
    }
  };

  const rankOf = (id: string) => selected.indexOf(id) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Housing Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Select up to 3 housing types in order of preference. Your first selection is your top choice.
          </p>
        </div>
      </div>

      {/* Selection counter */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                selected.length >= n
                  ? 'bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/20'
                  : 'bg-muted text-muted-foreground border border-border'
              )}
            >
              {n}
            </div>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{selected.length}</span> / 3 selected
          {selected.length === 3 && (
            <span className="ml-2 text-xs text-amber-600 font-medium">(maximum reached)</span>
          )}
        </span>
      </div>

      {errors.preferredHousingTypeIds && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errors.preferredHousingTypeIds.message as string}
        </div>
      )}

      {/* Housing Type Cards */}
      {eligibleTypes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Home className="h-12 w-12 mx-auto opacity-20 mb-3" />
          <p className="font-medium">No housing types available for your grade level.</p>
          <p className="text-sm mt-1">Please contact the Housing Secretary for assistance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eligibleTypes.map((ht) => {
            const isSelected = selected.includes(ht.id);
            const rank = rankOf(ht.id);
            const isDisabled = !isSelected && selected.length >= 3;

            return (
              <button
                key={ht.id}
                type="button"
                id={`pref-${ht.id}`}
                onClick={() => toggle(ht.id)}
                disabled={isDisabled}
                className={cn(
                  'relative text-left rounded-xl border-2 p-4 transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-primary',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : isDisabled
                    ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                    : 'border-border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer'
                )}
              >
                {/* Rank badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {rank}
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                )}

                {/* Type name & building type */}
                <div className="pr-14">
                  <p className="font-semibold text-sm leading-tight">{ht.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className="bg-muted text-muted-foreground border-border text-xs">
                      {ht.buildingType.charAt(0) + ht.buildingType.slice(1).toLowerCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ht.parkingSpace}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="h-3.5 w-3.5" />
                    {ht.numberOfBedrooms} Bedroom{ht.numberOfBedrooms !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bath className="h-3.5 w-3.5" />
                    {ht.numberOfBathrooms} Bathroom{ht.numberOfBathrooms !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    {ht.allocationPoints} pts
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">
                      ₦{(ht.annualRent / 1000).toFixed(0)}k/yr
                    </span>
                  </div>
                </div>

                {/* Amenity chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ht.parkingSpace !== 'Nil' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {ht.parkingSpace}
                    </span>
                  )}
                  {ht.hasStudyRoom && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      Study Room
                    </span>
                  )}
                  {ht.hasBQ && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {ht.numberOfBQ} BQ{ht.numberOfBQ !== 1 ? 's' : ''}
                    </span>
                  )}
                  {ht.hasCourtyard && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      Courtyard
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm space-y-1.5">
          <p className="font-medium text-foreground">Your preference order:</p>
          {selected.map((id, i) => {
            const ht = eligibleTypes.find((t) => t.id === id);
            return (
              <div key={id} className="flex items-center gap-2 text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                {ht?.name ?? id}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
