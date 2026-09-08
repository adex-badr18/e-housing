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

interface StaffHousingActionsProps {
  currentHousingStatus?: string;
  hasActiveApplication?: boolean;
}

export function StaffHousingActions({ currentHousingStatus, hasActiveApplication }: StaffHousingActionsProps) {
  const router = useRouter();
  const [claimOpen, setClaimOpen] = useState(false);
  const [unitCode, setUnitCode] = useState('');
  const [staffId, setStaffId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClaimAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim()) {
      toast.error('Please enter your Quarter Name or Unit Code.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setClaimOpen(false);
      toast.success(`Allocation claim request submitted for ${unitCode.toUpperCase()}. Pending verification by Housing Secretary.`);
      setUnitCode('');
      setStaffId('');
      router.refresh();
    }, 800);
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
            <span>Link legacy physical quarter number (e.g. Qtrs 14, Blk A1)</span>
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
                    Enter the quarter identifier and staff file number to link your existing physical quarters.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="unitCode" className="text-xs font-semibold">Quarter Name / Unit Code *</Label>
                    <Input
                      id="unitCode"
                      placeholder="e.g. Qtrs 14 or Blk A1"
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="claimStaffId" className="text-xs font-semibold">Staff File Number / P-Number</Label>
                    <Input
                      id="claimStaffId"
                      placeholder="e.g. STF-001 or P/12345"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="ghost" onClick={() => setClaimOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[rgb(27,34,50)] text-white text-xs">
                    {isSubmitting ? 'Verifying...' : 'Submit Claim Request'}
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
