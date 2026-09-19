'use client';

import { Home, CheckCircle2, AlertCircle, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HousingUnit, HousingType } from '@/lib/mock-api/db';

export interface VacantUnitData {
  unit: HousingUnit;
  housingType: HousingType | null;
  isEligible: boolean;
  matchesPreference: boolean;
}

interface UnitCardProps {
  data: VacantUnitData;
  isSelected: boolean;
  onSelect: () => void;
}

export function UnitCard({ data, isSelected, onSelect }: UnitCardProps) {
  const { unit, housingType, isEligible, matchesPreference } = data;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-full',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : 'border-border bg-background hover:border-primary/40 hover:bg-primary/[0.02]'
      )}
    >
      <div className="space-y-3 w-full">
        {/* Header: Icon, Name, Type & Badges */}
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={cn(
                'p-2 rounded-lg shrink-0 mt-0.5',
                isSelected ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              <Home className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate leading-tight">{unit.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {housingType?.name ?? 'Unknown Type'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
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

        {/* Features & Specs Pills */}
        {housingType && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted/80 font-medium">
              {housingType.numberOfBedrooms} bed · {housingType.numberOfBathrooms} bath
            </span>
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted/80 font-medium capitalize">
              {housingType.buildingType.toLowerCase()}
            </span>
            {housingType.parkingSpace && (
              <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted/80 font-medium">
                {housingType.parkingSpace}
              </span>
            )}
            {housingType.hasBQ && (
              <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted/80 font-medium">
                Has BQ
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Preference Matcher & Selection State */}
      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between w-full text-xs">
        {matchesPreference ? (
          <div className="flex items-center gap-1 text-primary font-medium text-xs">
            <Star className="h-3 w-3 fill-primary/20" /> Matches Preference
          </div>
        ) : (
          <span className="text-muted-foreground text-[11px]">Standard Unit</span>
        )}

        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-md transition-colors',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground group-hover:text-foreground'
          )}
        >
          {isSelected ? 'Selected' : 'Select'}
        </span>
      </div>
    </button>
  );
}

interface VacantUnitsGridProps {
  vacantUnits: VacantUnitData[];
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string | null) => void;
  allowClear?: boolean;
}

export function VacantUnitsGrid({
  vacantUnits,
  selectedUnitId,
  onSelectUnit,
  allowClear = false,
}: VacantUnitsGridProps) {
  const eligibleUnits = vacantUnits.filter((u) => u.isEligible);
  const otherUnits = vacantUnits.filter((u) => !u.isEligible);

  const selectedUnitData = vacantUnits.find(u => u.unit.id === selectedUnitId);

  const handleCardClick = (unitId: string) => {
    if (selectedUnitId === unitId && allowClear) {
      onSelectUnit(null);
    } else {
      onSelectUnit(unitId);
    }
  };

  return (
    <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
      {/* Optional Clear Selection Button Banner */}
      {allowClear && selectedUnitId && selectedUnitData && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-2.5 rounded-xl text-xs">
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-primary" />
            Unit selected: <strong className="text-primary">{selectedUnitData.unit.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => onSelectUnit(null)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive font-semibold px-2 py-1 rounded-md hover:bg-destructive/10 transition"
          >
            <X className="h-3 w-3" /> Clear selection
          </button>
        </div>
      )}

      {/* Eligible Units Section */}
      {eligibleUnits.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Eligible Vacant Units ({eligibleUnits.length})
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {eligibleUnits.map((data) => (
              <UnitCard
                key={data.unit.id}
                data={data}
                isSelected={selectedUnitId === data.unit.id}
                onSelect={() => handleCardClick(data.unit.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Vacant Units Section */}
      {otherUnits.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pt-2 border-t">
            Other Vacant Units ({otherUnits.length})
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {otherUnits.map((data) => (
              <UnitCard
                key={data.unit.id}
                data={data}
                isSelected={selectedUnitId === data.unit.id}
                onSelect={() => handleCardClick(data.unit.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
