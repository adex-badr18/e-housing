'use client';

import { useEffect, useTransition } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { housingTypeSchema, type HousingTypeFormValues } from '@/lib/validations/housing';
import { createHousingTypeAction, updateHousingTypeAction } from '@/app/actions/housing';
import type { HousingType } from '@/lib/mock-api/db';
import { Home } from 'lucide-react';

interface HousingTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  existing?: HousingType;
  onSuccess?: (record: HousingType) => void;
}

const defaults: HousingTypeFormValues = {
  name: '',
  buildingType: 'BUNGALOW',
  numberOfBedrooms: 2,
  numberOfBathrooms: 1,
  numberOfToilets: 1,
  hasStudyRoom: false,
  parkingSpace: 'Nil',
  hasBQ: false,
  hasCourtyard: false,
  allocationPoints: 20,
  annualRent: 80000,
  isActive: true,
};

export function HousingTypeDialog({
  open,
  onOpenChange,
  mode,
  existing,
  onSuccess,
}: HousingTypeDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HousingTypeFormValues>({
    resolver: zodResolver(housingTypeSchema) as Resolver<HousingTypeFormValues>,
    defaultValues: defaults,
  });

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && existing) {
      reset({
        name: existing.name,
        buildingType: existing.buildingType,
        numberOfBedrooms: existing.numberOfBedrooms,
        numberOfBathrooms: existing.numberOfBathrooms,
        numberOfToilets: existing.numberOfToilets,
        hasStudyRoom: existing.hasStudyRoom,
        parkingSpace: existing.parkingSpace,
        hasBQ: existing.hasBQ,
        hasCourtyard: existing.hasCourtyard,
        allocationPoints: existing.allocationPoints,
        annualRent: existing.annualRent,
        isActive: existing.isActive,
      });
    } else if (mode === 'create') {
      reset(defaults);
    }
  }, [mode, existing, reset, open]);

  const hasBQ = watch('hasBQ');
  const buildingType = watch('buildingType');
  const parkingSpace = watch('parkingSpace');

  const onSubmit = (data: HousingTypeFormValues) => {
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createHousingTypeAction(data)
          : await updateHousingTypeAction(existing!.id, data);

      if (result.success) {
        toast.success(
          mode === 'create'
            ? 'Housing type created successfully'
            : 'Housing type updated successfully'
        );
        onOpenChange(false);
        onSuccess?.(result.data!);
      } else {
        toast.error(result.error ?? 'An error occurred');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {mode === 'create' ? 'Create Housing Type' : 'Edit Housing Type'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {mode === 'create'
                  ? 'Define a new housing type with amenities and allocation rules.'
                  : `Editing: ${existing?.name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ht-name">House Type Name *</Label>
                <Input
                  id="ht-name"
                  placeholder="e.g. A1, B1/2, LG House"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ht-building">Building Type *</Label>
                <Select
                  value={buildingType}
                  onValueChange={(v) => v != null && setValue('buildingType', v as 'BUNGALOW' | 'STOREY')}
                >
                  <SelectTrigger id="ht-building" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUNGALOW">Bungalow</SelectItem>
                    <SelectItem value="STOREY">Storey Building</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Room Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Room Configuration
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ht-bedrooms">No. of Bedrooms *</Label>
                <Input
                  id="ht-bedrooms"
                  type="number"
                  min={1}
                  {...register('numberOfBedrooms')}
                  className={errors.numberOfBedrooms ? 'border-destructive' : ''}
                />
                {errors.numberOfBedrooms && (
                  <p className="text-xs text-destructive">{errors.numberOfBedrooms.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ht-bathrooms">No. of Bath</Label>
                <Input id="ht-bathrooms" type="number" min={0} {...register('numberOfBathrooms')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ht-toilets">No. of Toilets</Label>
                <Input id="ht-toilets" type="number" min={0} {...register('numberOfToilets')} />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <Label htmlFor="ht-hasStudyRoom" className="cursor-pointer">
                Study Room
              </Label>
              <Switch
                id="ht-hasStudyRoom"
                checked={watch('hasStudyRoom')}
                onCheckedChange={(v) => setValue('hasStudyRoom', v)}
              />
            </div>
          </div>

          <Separator />

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Amenities
            </h3>
            <div className="space-y-4">
              {/* Parking Space */}
              <div className="space-y-1.5">
                <Label htmlFor="ht-parking">Parking Space *</Label>
                <Select
                  value={parkingSpace}
                  onValueChange={(v) => v != null && setValue('parkingSpace', v as 'Garage' | 'Car Park' | 'Nil')}
                >
                  <SelectTrigger id="ht-parking" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Garage">Garage</SelectItem>
                    <SelectItem value="Car Park">Car Park</SelectItem>
                    <SelectItem value="Nil">Nil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Courtyard */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                <Label htmlFor="ht-hasCourtyard" className="cursor-pointer">
                  Courtyard
                </Label>
                <Switch
                  id="ht-hasCourtyard"
                  checked={watch('hasCourtyard')}
                  onCheckedChange={(v) => setValue('hasCourtyard', v)}
                />
              </div>

              {/* BQ Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <Label htmlFor="ht-hasBQ" className="cursor-pointer">
                    Boys Quarters (BQ)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    1 BQ unit will be auto-created with each housing unit of this type
                  </p>
                </div>
                <Switch
                  id="ht-hasBQ"
                  checked={hasBQ}
                  onCheckedChange={(v) => setValue('hasBQ', v)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Allocation Rules */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Allocation Rules
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ht-points">Points *</Label>
                <Input
                  id="ht-points"
                  type="number"
                  {...register('allocationPoints')}
                  className={errors.allocationPoints ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Base score used in the allocation ranking formula
                </p>
                {errors.allocationPoints && (
                  <p className="text-xs text-destructive">{errors.allocationPoints.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ht-rent">Annual Rent (₦) *</Label>
                <Input
                  id="ht-rent"
                  type="number"
                  min={0}
                  {...register('annualRent')}
                  className={errors.annualRent ? 'border-destructive' : ''}
                />
                {errors.annualRent && (
                  <p className="text-xs text-destructive">{errors.annualRent.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <Label htmlFor="ht-active" className="cursor-pointer font-medium">
                  Active Type
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Only active types are visible to staff during application
                </p>
              </div>
              <Switch
                id="ht-active"
                checked={watch('isActive')}
                onCheckedChange={(v) => setValue('isActive', v)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose render={<Button variant="outline" type="button" disabled={isPending} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending} className="min-w-[120px]">
              {isPending
                ? (mode === 'create' ? 'Creating…' : 'Saving…')
                : (mode === 'create' ? 'Create Type' : 'Save Changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
