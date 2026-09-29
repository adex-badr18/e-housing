import { format } from 'date-fns';
import { Building, MapPin, KeyRound, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { Allocation, HousingUnit, HousingType } from '@/lib/mock-api/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HousingAllocationDetailsProps {
  allocation: Allocation;
  housingUnit: HousingUnit;
  housingType: HousingType;
}

export function HousingAllocationDetails({
  allocation,
  housingUnit,
  housingType,
}: HousingAllocationDetailsProps) {
  const isAccepted = allocation.status === 'ACCEPTED';
  const isRejected = allocation.status === 'REJECTED';
  const isPending = allocation.status === 'PENDING';

  return (
    <Card className="border-t-4 border-t-oau-gold shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-oau-navy flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-oau-gold" />
              Approved Allocation Details
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Housing unit offered by the Vice Chancellor
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'px-3 py-1 font-semibold text-sm',
              isAccepted && 'bg-emerald-50 text-emerald-700 border-emerald-200',
              isRejected && 'bg-red-50 text-red-700 border-red-200',
              isPending && 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            {isAccepted && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline" />}
            {isRejected && <XCircle className="w-3.5 h-3.5 mr-1.5 inline" />}
            {isPending && <Clock className="w-3.5 h-3.5 mr-1.5 inline" />}
            {isAccepted ? 'Offer Accepted' : isRejected ? 'Offer Rejected' : 'Pending Response'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/40 bg-muted/5 p-4 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Assigned Unit</p>
            <p className="font-bold text-oau-navy">{housingUnit.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{housingType.name}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-muted/5 p-4 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Location</p>
            <p className="font-semibold text-foreground">
              Road {housingUnit.roadNumber || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              House {housingUnit.houseNumber || 'N/A'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-muted/5 p-4 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-purple-50 flex items-center justify-center">
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Timeline</p>
            <p className="text-base font-medium">
              Offered: {format(new Date(allocation.allocatedAt), 'dd MMM yyyy')}
            </p>
            {allocation.respondedAt && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Responded: {format(new Date(allocation.respondedAt), 'dd MMM yyyy')}
              </p>
            )}
            {!allocation.respondedAt && allocation.expiresAt && (
              <p className="text-sm text-amber-600 font-medium mt-0.5">
                Expires: {format(new Date(allocation.expiresAt), 'dd MMM yyyy')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
