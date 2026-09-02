'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnitStatusBadge } from '@/components/shared/StatusBadge';
import type { HousingType, HousingUnit } from '@/lib/mock-api/db';
import {
  Building2,
  Home,
  Bed,
  Bath,
  Car,
  Trees,
  Users,
  BadgeDollarSign,
  Pencil,
  MapPin,
  Tag,
  BookOpen,
} from 'lucide-react';

interface HousingUnitDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: HousingUnit | null;
  housingTypes: HousingType[];
  onEdit?: (unit: HousingUnit) => void;
}

function BoolBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return value ? (
    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-medium">
      {trueLabel}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground text-xs">
      {falseLabel}
    </Badge>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
      <span className="text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70 shrink-0" />}
        {label}
      </span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export function HousingUnitDetailDialog({
  open,
  onOpenChange,
  unit,
  housingTypes,
  onEdit,
}: HousingUnitDetailDialogProps) {
  if (!unit) return null;

  const housingType = housingTypes.find((ht) => ht.id === unit.housingTypeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {unit.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  House {unit.houseNumber ?? 'N/A'} · Road {unit.roadNumber ?? 'N/A'}
                </DialogDescription>
              </div>
            </div>
            <UnitStatusBadge status={unit.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* Unit Location & Identity Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Unit Identification & Location
            </h3>
            <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-xs text-muted-foreground">Unit Name</p>
                <p className="text-base font-bold text-foreground mt-0.5">{unit.name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-xs text-muted-foreground">House Number</p>
                <p className="text-base font-bold text-foreground mt-0.5">{unit.houseNumber ?? '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-xs text-muted-foreground">Road Number</p>
                <p className="text-base font-bold text-foreground mt-0.5">{unit.roadNumber ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Housing Type Summary */}
          {housingType ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-primary" />
                Housing Type Specifications ({housingType.name})
              </h3>
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                {/* Rooms overview stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Building</p>
                    <p className="text-sm font-semibold capitalize mt-0.5">
                      {housingType.buildingType.toLowerCase()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                    <p className="text-sm font-semibold mt-0.5">{housingType.numberOfBedrooms} Bed</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                    <p className="text-sm font-semibold mt-0.5">{housingType.numberOfBathrooms} Bath</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Toilets</p>
                    <p className="text-sm font-semibold mt-0.5">{housingType.numberOfToilets} WC</p>
                  </div>
                </div>

                <div className="divide-y divide-border/50">
                  <DetailRow label="Study Room" value={<BoolBadge value={housingType.hasStudyRoom} />} icon={BookOpen} />
                  <DetailRow
                    label="Parking Space"
                    value={
                      <Badge variant="outline" className="text-xs">
                        {housingType.parkingSpace}
                      </Badge>
                    }
                    icon={Car}
                  />
                  <DetailRow label="Courtyard" value={<BoolBadge value={housingType.hasCourtyard} />} icon={Trees} />
                  <DetailRow
                    label="Boys Quarters (BQ)"
                    value={<BoolBadge value={housingType.hasBQ} trueLabel="Available" falseLabel="None" />}
                    icon={Users}
                  />
                  <DetailRow
                    label="Allocation Score Points"
                    value={<span className="font-bold text-primary">{housingType.allocationPoints} pts</span>}
                    icon={Tag}
                  />
                  <DetailRow
                    label="Annual Rent"
                    value={<span className="font-bold text-foreground">₦{housingType.annualRent.toLocaleString()}</span>}
                    icon={BadgeDollarSign}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
              No housing type assigned to this unit.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between pt-2">
          <DialogClose render={<Button variant="outline">Close</Button>} />
          {onEdit && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit(unit);
              }}
              className="gap-2 min-w-[120px]"
            >
              <Pencil className="h-4 w-4" />
              Edit Unit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
