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
import { ActiveBadge } from '@/components/shared/StatusBadge';
import type { HousingType } from '@/lib/mock-api/db';
import {
  BedDouble,
  Bath,
  Toilet,
  BookOpen,
  Car,
  Home,
  Trees,
  Users,
  Star,
  Banknote,
  Pencil,
} from 'lucide-react';

interface HousingTypeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  housingType: HousingType | null;
  onEdit?: (housingType: HousingType) => void;
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-right">{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-4 first:mt-0">
      {children}
    </h4>
  );
}

function BoolBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return value ? (
    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-medium text-xs">{trueLabel}</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground text-xs">{falseLabel}</Badge>
  );
}

export function HousingTypeDetailDialog({
  open,
  onOpenChange,
  housingType,
  onEdit,
}: HousingTypeDetailDialogProps) {
  if (!housingType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          {/* Header strip */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg leading-tight">{housingType.name}</DialogTitle>
                <DialogDescription className="mt-0.5 capitalize text-sm">
                  {housingType.buildingType.charAt(0) + housingType.buildingType.slice(1).toLowerCase()}
                </DialogDescription>
              </div>
            </div>
            <ActiveBadge isActive={housingType.isActive} />
          </div>

          {/* Icon summary row */}
          <div className="flex flex-wrap gap-3 mt-4 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <BedDouble className="h-4 w-4 text-primary" />
              <span>{housingType.numberOfBedrooms} Bed</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Bath className="h-4 w-4 text-primary" />
              <span>{housingType.numberOfBathrooms} Bath</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Toilet className="h-4 w-4 text-primary" />
              <span>{housingType.numberOfToilets} Toilet{housingType.numberOfToilets !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Star className="h-4 w-4 text-amber-500" />
              <span>{housingType.allocationPoints} pts</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1 mt-2">
          {/* Basic Information */}
          <SectionTitle>Basic Information</SectionTitle>
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-1 divide-y divide-border/40">
            <DetailRow label="House Type Name" value={housingType.name} icon={Home} />
            <DetailRow
              label="Building Type"
              value={
                <Badge variant="outline" className="capitalize text-xs">
                  {housingType.buildingType.charAt(0) + housingType.buildingType.slice(1).toLowerCase()}
                </Badge>
              }
            />
          </div>

          {/* Room Configuration */}
          <SectionTitle>Room Configuration</SectionTitle>
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-1 divide-y divide-border/40">
            <DetailRow label="Bedrooms" value={housingType.numberOfBedrooms} icon={BedDouble} />
            <DetailRow label="Bathrooms" value={housingType.numberOfBathrooms} icon={Bath} />
            <DetailRow label="Toilets" value={housingType.numberOfToilets} icon={Toilet} />
            <DetailRow label="Study Room" value={<BoolBadge value={housingType.hasStudyRoom} />} icon={BookOpen} />
          </div>

          {/* Amenities */}
          <SectionTitle>Amenities</SectionTitle>
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-1 divide-y divide-border/40">
            <DetailRow label="Parking Space" value={
              <Badge variant="outline" className="text-xs">
                {housingType.parkingSpace}
              </Badge>
            } icon={Car} />
            <DetailRow label="Courtyard" value={<BoolBadge value={housingType.hasCourtyard} />} icon={Trees} />
            <DetailRow
              label="Boys Quarters (BQ)"
              value={
                housingType.hasBQ ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium">
                    {housingType.numberOfBQ} BQ unit{housingType.numberOfBQ !== 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">None</Badge>
                )
              }
              icon={Users}
            />
          </div>

          {/* Allocation Rules */}
          <SectionTitle>Allocation Rules</SectionTitle>
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-1 divide-y divide-border/40">
            <DetailRow label="Points" value={
              <span className="font-semibold text-primary">{housingType.allocationPoints}</span>
            } icon={Star} />
            <DetailRow label="Annual Rent" value={
              <span className="font-semibold">₦{housingType.annualRent.toLocaleString()}</span>
            } icon={Banknote} />
            <DetailRow label="Status" value={<ActiveBadge isActive={housingType.isActive} />} />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <DialogClose render={<Button variant="outline" className="flex-1 sm:flex-none" />}>
            Close
          </DialogClose>
          {onEdit && (
            <Button
              id={`ht-detail-edit-${housingType.id}`}
              onClick={() => {
                onOpenChange(false);
                onEdit(housingType);
              }}
              className="flex-1 sm:flex-none gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Type
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
