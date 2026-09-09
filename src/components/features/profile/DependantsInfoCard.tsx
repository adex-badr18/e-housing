import { Users, Heart, Baby, Building2, MapPin, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChildDependant {
  name: string;
  age: number;
}

interface DependantsInfoCardProps {
  spouseName?: string | null;
  spouseEmployedInOAU?: boolean | null;
  spouseDepartment?: string | null;
  spouseEmploymentAddress?: string | null;
  children?: ChildDependant[] | null;
  numberOfDependents?: number;
  maritalStatus?: string | null;
}

export function DependantsInfoCard({
  spouseName,
  spouseEmployedInOAU,
  spouseDepartment,
  spouseEmploymentAddress,
  children,
  numberOfDependents,
  maritalStatus,
}: DependantsInfoCardProps) {
  const childList = children ?? [];
  const hasSpouseInfo = spouseName || spouseEmployedInOAU || spouseDepartment || spouseEmploymentAddress;
  const isMarried = maritalStatus === 'MARRIED';

  return (
    <div className="space-y-6">
      {/* Spouse Section */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-background/60">
          <Heart className="size-4 text-rose-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">Spouse Details</span>
          {isMarried && (
            <Badge variant="secondary" className="ml-auto text-[11px] font-medium">
              Married
            </Badge>
          )}
        </div>

        <div className="p-5">
          {!isMarried || !hasSpouseInfo ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                {!isMarried
                  ? 'Not applicable — marital status is not Married.'
                  : 'No spouse information was provided during onboarding.'}
              </span>
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoField
                label="Name of Spouse"
                value={spouseName}
                icon={<Heart className="size-3.5 text-rose-400" />}
              />
              <InfoField
                label="Employed in OAU?"
                value={spouseEmployedInOAU ? 'Yes — OAU Staff' : 'No'}
                icon={<Building2 className="size-3.5 text-blue-400" />}
              />
              {spouseEmployedInOAU && spouseDepartment && (
                <InfoField
                  label="Spouse's Department / Unit"
                  value={spouseDepartment}
                  icon={<Building2 className="size-3.5 text-blue-400" />}
                />
              )}
              {spouseEmploymentAddress && (
                <InfoField
                  label="Spouse Employment Address"
                  value={spouseEmploymentAddress}
                  icon={<MapPin className="size-3.5 text-green-400" />}
                  className="sm:col-span-2"
                />
              )}
            </dl>
          )}
        </div>
      </div>

      {/* Children / Dependants Section */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-background/60">
          <Baby className="size-4 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">Child Dependants</span>
          <Badge variant="outline" className="ml-auto text-[11px] font-medium">
            {childList.length} registered
          </Badge>
        </div>

        <div className="p-5">
          {childList.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>No child dependants were registered during onboarding.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_5rem] gap-3 px-3 pb-1 border-b border-border/60">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Age</span>
              </div>
              {childList.map((child, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2rem_1fr_5rem] gap-3 items-center px-3 py-2.5 rounded-lg odd:bg-muted/50 even:bg-transparent"
                >
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {child.name || <span className="italic text-muted-foreground">—</span>}
                  </span>
                  <span className="text-sm text-muted-foreground text-right">
                    {child.age != null ? `${child.age} yr${child.age !== 1 ? 's' : ''}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {numberOfDependents != null && numberOfDependents > 0 && (
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              <span>Total recorded dependants: <strong className="text-foreground">{numberOfDependents}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component
function InfoField({
  label,
  value,
  icon,
  className = '',
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </dd>
    </div>
  );
}
