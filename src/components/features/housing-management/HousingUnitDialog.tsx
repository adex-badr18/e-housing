'use client';

import { useState, useTransition } from 'react';
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createHousingUnitAction, updateHousingUnitAction } from '@/app/actions/housing';
import { toast } from 'sonner';
import type { HousingType, HousingUnit } from '@/lib/mock-api/db';
import { Building2, Home, BedDouble } from 'lucide-react';

interface HousingUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  housingTypes: HousingType[];
  mode: 'create' | 'edit';
  existing?: HousingUnit;
  onSuccess?: (record: HousingUnit) => void;
}

export function HousingUnitDialog({
  open,
  onOpenChange,
  housingTypes,
  mode,
  existing,
  onSuccess,
}: HousingUnitDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(existing?.name ?? '');
  const [housingTypeId, setHousingTypeId] = useState(existing?.housingTypeId ?? '');
  const [status, setStatus] = useState<'VACANT' | 'OCCUPIED' | 'UNDER_MAINTENANCE'>(existing?.status ?? 'VACANT');
  const [nameError, setNameError] = useState('');
  const [typeError, setTypeError] = useState('');

  const selectedType = housingTypes.find((ht) => ht.id === housingTypeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setTypeError('');

    let valid = true;
    if (!name.trim() || name.trim().length < 2) {
      setNameError('Unit name must be at least 2 characters');
      valid = false;
    }
    if (!housingTypeId) {
      setTypeError('Please select a housing type');
      valid = false;
    }
    if (!valid) return;

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createHousingUnitAction({ name: name.trim(), housingTypeId, status })
          : await updateHousingUnitAction(existing!.id, { name: name.trim(), housingTypeId, status });

      if (result.success) {
        toast.success(
          mode === 'create'
            ? 'Housing unit created successfully'
            : 'Housing unit updated successfully'
        );
        setName('');
        setHousingTypeId('');
        setStatus('VACANT');
        onOpenChange(false);
        onSuccess?.(result.data!);
      } else {
        toast.error(result.error ?? `Failed to ${mode} unit`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {mode === 'create' ? 'Create Housing Unit' : 'Edit Housing Unit'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'create'
                  ? 'Add a new physical unit to the housing inventory.'
                  : `Editing: ${existing?.name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Unit Name */}
          <div className="space-y-1.5">
            <Label htmlFor="hu-name">Unit Name / Code *</Label>
            <Input
              id="hu-name"
              placeholder="e.g. Qtrs 20, Blk B3, Prof Qtrs 05"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={nameError ? 'border-destructive' : ''}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          {/* Housing Type */}
          <div className="space-y-1.5">
            <Label htmlFor="hu-type">Housing Type *</Label>
            <Select value={housingTypeId} onValueChange={(v) => v != null && setHousingTypeId(v)}>
              <SelectTrigger id="hu-type" className={`w-full ${typeError ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select a housing type…" />
              </SelectTrigger>
              <SelectContent>
                {housingTypes
                  .filter((ht) => ht.isActive || ht.id === existing?.housingTypeId)
                  .map((ht) => (
                    <SelectItem key={ht.id} value={ht.id}>
                      {ht.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {typeError && <p className="text-xs text-destructive">{typeError}</p>}
          </div>

          {/* BQ Preview — dynamic based on selected type */}
          {selectedType && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm font-medium flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Type Preview
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BedDouble className="h-3.5 w-3.5" />
                  {selectedType.numberOfBedrooms} Bedroom{selectedType.numberOfBedrooms !== 1 ? 's' : ''}
                </div>
                <div className="text-muted-foreground">
                  {selectedType.category === 'SENIOR' ? '🏛️ Senior' : '🏠 Junior'} Staff
                </div>
                <div className="text-muted-foreground">
                  Points: <span className="font-medium text-foreground">{selectedType.allocationPoints}</span>
                </div>
                <div className="text-muted-foreground">
                  Rent: <span className="font-medium text-foreground">₦{selectedType.annualRent.toLocaleString()}/yr</span>
                </div>
              </div>
              {selectedType.hasBQ && selectedType.numberOfBQ > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    Auto-creates {selectedType.numberOfBQ} BQ{selectedType.numberOfBQ !== 1 ? 's' : ''}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Boys Quarters will be created automatically
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="hu-status">Initial Status</Label>
            <Select value={status} onValueChange={(v) => v != null && setStatus(v as typeof status)}>
              <SelectTrigger id="hu-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VACANT">Vacant</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-1">
            <DialogClose render={<Button variant="outline" type="button" disabled={isPending} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending} className="min-w-[130px]">
              {isPending
                ? (mode === 'create' ? 'Creating…' : 'Saving…')
                : (mode === 'create' ? 'Create Unit' : 'Save Changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
