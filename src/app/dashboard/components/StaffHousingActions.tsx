'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FilePlus, KeyRound, ArrowRight, ShieldCheck, CheckCircle, Building } from 'lucide-react';
import type { HousingType } from '@/lib/mock-api/db';
import { claimExistingAllocationAction } from '@/app/actions/housing';

interface StaffHousingActionsProps {
  housingTypes?: HousingType[];
  currentHousingStatus?: string;
  hasActiveApplication?: boolean;
}

export function StaffHousingActions({
  housingTypes = [],
  currentHousingStatus,
  hasActiveApplication,
}: StaffHousingActionsProps) {
  const router = useRouter();
  const [claimOpen, setClaimOpen] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [roadNumber, setRoadNumber] = useState('');
  const [housingTypeId, setHousingTypeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClaimAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNumber.trim()) {
      toast.error('Please enter your House Number.');
      return;
    }
    if (!roadNumber.trim()) {
      toast.error('Please enter your Road Number.');
      return;
    }
    if (!housingTypeId) {
      toast.error('Please select a House Type from inventory.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await claimExistingAllocationAction({
        houseNumber: houseNumber.trim(),
        roadNumber: roadNumber.trim(),
        housingTypeId,
      });

      if (res.success) {
        toast.success(`Housing allocation recorded successfully for House ${houseNumber.trim()}, ${roadNumber.trim()}!`);
        setHouseNumber('');
        setRoadNumber('');
        setHousingTypeId('');
        setClaimOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to record claim request.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 my-2">
      {/* CARD 1: Start New Housing Application */}
      <Card className="border-2 border-slate-200/80 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400">
              <FilePlus className="size-5" />
            </div>
            {hasActiveApplication ? (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Application Pending
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Eligible to Apply
              </span>
            )}
          </div>
          <CardTitle className="text-lg font-bold text-[rgb(27,34,50)] mt-3">
            Start New Housing Application
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Submit a fresh request for university quarters. Points are calculated based on rank, seniority, and dependants.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>Automated scoring formula & multi-stage approval workflow</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-emerald-600 shrink-0" />
            <span>Select preferred housing types (Bungalow, Storey, Senior Qtrs)</span>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Link href="/staff/applications" className="w-full">
            <Button className="w-full bg-[rgb(27,34,50)] hover:bg-[rgb(27,34,50)]/90 text-amber-300 text-xs font-semibold gap-2 py-5 shadow">
              {hasActiveApplication ? 'View Application Status' : 'Start Application Wizard'}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* CARD 2: Claim / Register Existing Allocation */}
      <Card className="border-2 border-amber-200/80 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-amber-50/30 to-white flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950">
              <KeyRound className="size-5" />
            </div>
            {currentHousingStatus === 'HAS_ALLOCATION' ? (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                Active Occupant
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Register Legacy Quarters
              </span>
            )}
          </div>
          <CardTitle className="text-lg font-bold text-[rgb(27,34,50)] mt-3">
            Claim / Register Existing Allocation
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Already occupying university quarters? Link your physical quarter allocation with your staff profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-slate-600">
          <div className="flex items-center gap-2">
            <Building className="size-4 text-amber-600 shrink-0" />
            <span>Link legacy physical quarter number (e.g. House 14, Road 7)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-amber-600 shrink-0" />
            <span>Manage Boys Quarters (BQ) occupants & tenancy agreement</span>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
            <DialogTrigger
              render={
                <Button type="button" variant="outline" className="w-full border-amber-400 text-amber-950 hover:bg-amber-100/60 text-xs font-semibold gap-2 py-5" />
              }
            >
              <KeyRound className="size-4 text-amber-600" />
              Claim / Register Quarter
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleClaimAllocation}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-[rgb(27,34,50)] flex items-center gap-2">
                    <KeyRound className="size-5 text-amber-600" />
                    Claim Existing Housing Allocation
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Provide your physical quarter details below to record your current housing allocation.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="houseNumber" className="text-xs font-semibold">House Number *</Label>
                    <Input
                      id="houseNumber"
                      placeholder="e.g. 14, Flat 2B, Block A"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="roadNumber" className="text-xs font-semibold">Road Number *</Label>
                    <Input
                      id="roadNumber"
                      placeholder="e.g. Road 1, Road 7, Bells Drive"
                      value={roadNumber}
                      onChange={(e) => setRoadNumber(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="housingTypeId" className="text-xs font-semibold">House Type *</Label>
                    <select
                      id="housingTypeId"
                      value={housingTypeId}
                      onChange={(e) => setHousingTypeId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a House Type from inventory...</option>
                      {housingTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} ({type.buildingType === 'BUNGALOW' ? 'Bungalow' : 'Storey Building'} - {type.numberOfBedrooms} Bed)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="ghost" onClick={() => setClaimOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[rgb(27,34,50)] text-white text-xs">
                    {isSubmitting ? 'Submitting Claim...' : 'Submit Claim Request'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
