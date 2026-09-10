// =============================================================================
// ApplicationDetailsCard — Full housing application detail view
// =============================================================================
// Server-safe (no 'use client'). Displays all submitted application details:
//   · Applicant profile & staff info
//   · Housing preferences
//   · Family & dependants
//   · Scoring breakdown (or pending message if not yet evaluated)
//   · Allocated housing unit (or pending message if not yet assigned)
// =============================================================================

import type {
  HousingApplication,
  User,
  StaffProfile,
  HousingType,
  HousingUnit,
  PointsBreakdown,
} from '@/lib/mock-api/db';
import { computeYearsOfService } from '@/lib/scoring';
import {
  User as UserIcon,
  GraduationCap,
  Building2,
  Users,
  Heart,
  BarChart3,
  Home,
  Clock,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  BedDouble,
  Bath,
  Car,
  CheckCircle2,
  Info,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
}

function inferStaffCategory(salaryGradeLevel: string): string {
  if (/conuass/i.test(salaryGradeLevel)) return 'Academic (CONUASS)';
  if (/contiss/i.test(salaryGradeLevel)) return 'Non-Academic (CONTISS)';
  if (/gl/i.test(salaryGradeLevel)) return 'Non-Academic (GL)';
  return 'Non-Academic / Other';
}

// ---------------------------------------------------------------------------
// Sub-component: Section header
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>, title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 rounded-lg bg-oau-navy/10 text-oau-navy">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-oau-navy tracking-tight">{title}</h3>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Info row
// ---------------------------------------------------------------------------

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground font-medium ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Score bar
// ---------------------------------------------------------------------------

function ScoreBar({ label, points, maxPoints, description }: { label: string; points: number; maxPoints: number; description?: string }) {
  const pct = Math.round((points / maxPoints) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-bold text-oau-navy tabular-nums">{points} / {maxPoints} pts</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-oau-navy to-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ApplicationDetailsCardProps {
  application: HousingApplication;
  applicantUser: User | null;
  applicantProfile: StaffProfile | null;
  preferredTypes: HousingType[];
  allocatedUnit?: HousingUnit | null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ApplicationDetailsCard({
  application,
  applicantUser,
  applicantProfile,
  preferredTypes,
  allocatedUnit,
}: ApplicationDetailsCardProps) {
  const breakdown = application.pointsBreakdown;
  const yearsOfService = applicantProfile?.employmentDate
    ? computeYearsOfService(applicantProfile.employmentDate)
    : null;
  const staffCategory = (applicantProfile?.salaryLevel || applicantProfile?.salaryGradeLevel)
    ? inferStaffCategory(applicantProfile.salaryLevel || applicantProfile.salaryGradeLevel || '')
    : null;

  return (
    <div className="space-y-4">
      {/* ── Section 1: Applicant & Staff Information ── */}
      <div className="rounded-2xl border bg-card shadow-sm p-6">
        <SectionHeader icon={UserIcon} title="Applicant & Staff Information" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
          <InfoRow
            label="Full Name"
            value={applicantUser ? `${applicantUser.firstName} ${applicantUser.lastName}` : '—'}
          />
          <InfoRow
            label="Staff ID (P-Number)"
            value={applicantProfile?.staffId ?? '—'}
            mono
          />
          <InfoRow
            label="Rank"
            value={applicantProfile?.rank ?? '—'}
          />
          <InfoRow
            label="Staff Category"
            value={
              staffCategory ? (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  staffCategory.startsWith('Academic')
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-teal-100 text-teal-800'
                }`}>
                  <GraduationCap className="h-3 w-3" />
                  {staffCategory}
                </span>
              ) : '—'
            }
          />
          <InfoRow
            label="Department"
            value={applicantProfile?.department ?? '—'}
          />
          <InfoRow
            label="Faculty"
            value={applicantProfile?.faculty ?? '—'}
          />
          <InfoRow
            label="Salary Level"
            value={applicantProfile?.salaryLevel ?? (applicantProfile?.salaryGradeLevel ? applicantProfile.salaryGradeLevel.split(' ')[0] : '—')}
            mono
          />
          <InfoRow
            label="Salary Step"
            value={applicantProfile?.salaryStep ?? '—'}
            mono
          />
          <InfoRow
            label="IPPIS / P-Number"
            value={applicantProfile?.ippisNumber ?? '—'}
            mono
          />
          <InfoRow
            label="Employment Date"
            value={applicantProfile?.employmentDate
              ? format(new Date(applicantProfile.employmentDate), 'dd MMM yyyy')
              : '—'}
          />
          <InfoRow
            label="Years of Service"
            value={yearsOfService !== null
              ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {yearsOfService} year{yearsOfService !== 1 ? 's' : ''}
                </span>
              )
              : '—'
            }
          />
          <InfoRow
            label="Email"
            value={applicantUser?.email
              ? (
                <a href={`mailto:${applicantUser.email}`} className="flex items-center gap-1 text-oau-navy hover:underline">
                  <Mail className="h-3.5 w-3.5" />
                  {applicantUser.email}
                </a>
              )
              : '—'
            }
          />
          <InfoRow
            label="Phone"
            value={applicantProfile?.phoneNumber
              ? (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {applicantProfile.phoneNumber}
                </span>
              )
              : '—'
            }
          />
        </div>
      </div>

      {/* ── Section 2: Housing Preferences ── */}
      <div className="rounded-2xl border bg-card shadow-sm p-6">
        <SectionHeader icon={Home} title="Housing Preferences" />
        {preferredTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No housing type preferences submitted.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {preferredTypes.map((type) => (
              <div
                key={type.id}
                className="rounded-xl border bg-secondary/30 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-oau-navy">{type.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    type.buildingType === 'BUNGALOW'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {type.buildingType === 'BUNGALOW' ? 'Bungalow' : 'Storey Building'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5 shrink-0" />
                    {type.numberOfBedrooms} Bed{type.numberOfBedrooms !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5 shrink-0" />
                    {type.numberOfBathrooms} Bath{type.numberOfBathrooms !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5 shrink-0" />
                    {type.parkingSpace}
                  </span>
                  {type.hasBQ && (
                    <span className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5 shrink-0" />
                      BQ Available
                    </span>
                  )}
                </div>
                <div className="pt-1 border-t text-xs font-medium text-muted-foreground">
                  Annual Rent: <span className="text-foreground">{formatCurrency(type.annualRent)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {application.additionalNotes && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Additional Notes / Special Requests
            </p>
            <p className="text-sm text-amber-900">{application.additionalNotes}</p>
          </div>
        )}
      </div>

      {/* ── Section 3: Family & Dependants ── */}
      <div className="rounded-2xl border bg-card shadow-sm p-6">
        <SectionHeader icon={Users} title="Family & Dependants Information" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 mb-4">
          <InfoRow
            label="Marital Status"
            value={
              applicantProfile?.maritalStatus
                ? (
                  <span className="flex items-center gap-1.5">
                    <Heart className={`h-3.5 w-3.5 ${
                      applicantProfile.maritalStatus === 'MARRIED' ? 'text-rose-500' : 'text-muted-foreground'
                    }`} />
                    {applicantProfile.maritalStatus.charAt(0) + applicantProfile.maritalStatus.slice(1).toLowerCase()}
                  </span>
                )
                : '—'
            }
          />
          <InfoRow
            label="Spouse Name"
            value={applicantProfile?.spouseName ?? '—'}
          />
          <InfoRow
            label="Spouse at OAU"
            value={applicantProfile?.spouseEmployedInOAU === true
              ? 'Yes'
              : applicantProfile?.spouseEmployedInOAU === false
                ? 'No'
                : '—'
            }
          />
          {applicantProfile?.spouseEmployedInOAU && applicantProfile.spouseDepartment && (
            <InfoRow label="Spouse Dept." value={applicantProfile.spouseDepartment} />
          )}
          <InfoRow
            label="Total Dependants"
            value={
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                {applicantProfile?.numberOfDependents ?? '—'}
              </span>
            }
          />
        </div>

        {/* Children list */}
        {applicantProfile?.children && applicantProfile.children.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Children</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {applicantProfile.children.map((child, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-secondary/30"
                >
                  <div className="h-7 w-7 rounded-full bg-oau-navy/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-oau-navy">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{child.name}</p>
                    <p className="text-xs text-muted-foreground">Age {child.age}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No children recorded.</p>
        )}
      </div>

      {/* ── Section 4: Scoring & Points Breakdown ── */}
      <div className="rounded-2xl border bg-card shadow-sm p-6">
        <SectionHeader icon={BarChart3} title="Scoring & Evaluation Points" />
        {breakdown ? (
          <div className="space-y-4">
            {/* Total score badge */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-oau-navy/5 border border-oau-navy/15">
              <div className="text-center shrink-0">
                <p className="text-4xl font-extrabold text-oau-navy tabular-nums leading-none">
                  {breakdown.totalPoints}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total Points</p>
              </div>
              <div className="h-14 w-px bg-border" />
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p><span className="font-medium text-foreground">Max possible:</span> 120 points</p>
                <p><span className="font-medium text-foreground">Percentile:</span>{' '}
                  {Math.round((breakdown.totalPoints / 120) * 100)}% of maximum score
                </p>
                <p className="text-[10px] italic">Score generated by Housing Secretary at Stage 1 review</p>
              </div>
            </div>

            {/* Score bars */}
            <div className="space-y-3 pt-2">
              <ScoreBar
                label="Rank & Grade Level (Staff Category)"
                points={breakdown.baseTypePoints}
                maxPoints={70}
                description="Based on academic/administrative rank and salary grade level (CONUASS/CONTISS/GL)"
              />
              <ScoreBar
                label="Seniority (Years of Service)"
                points={breakdown.seniorityBonus}
                maxPoints={25}
                description={yearsOfService !== null ? `${yearsOfService} year(s) of service recorded` : 'Based on date of first employment at OAU'}
              />
              <ScoreBar
                label="Family Size & Dependants"
                points={breakdown.dependentsBonus}
                maxPoints={15}
                description={`${applicantProfile?.numberOfDependents ?? 0} registered dependant(s)`}
              />
              <ScoreBar
                label="Marital Status"
                points={breakdown.maritalStatusBonus}
                maxPoints={10}
                description={applicantProfile?.maritalStatus
                  ? `${applicantProfile.maritalStatus.charAt(0) + applicantProfile.maritalStatus.slice(1).toLowerCase()} status`
                  : undefined
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold text-sm">Scoring Not Yet Generated</p>
              <p className="text-xs mt-1">
                Points evaluation and breakdown will be generated by the{' '}
                <strong>Housing Secretary</strong> upon completing Stage 1 verification.
                Scoring criteria include: <em>date of employment (seniority)</em>,{' '}
                <em>staff rank &amp; grade level</em>, <em>family size &amp; dependants</em>, and{' '}
                <em>marital status</em>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 5: Allocated Housing Unit ── */}
      <div className="rounded-2xl border bg-card shadow-sm p-6">
        <SectionHeader icon={Building2} title="Allocated Housing Unit" />
        {allocatedUnit ? (
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-600 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-emerald-800 text-sm">Unit Assigned</p>
                <p className="text-xs text-emerald-700">Proposed by Estate Officer — pending DVC Admin approval</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 mt-2">
              <InfoRow label="Quarter Name" value={allocatedUnit.name} />
              <InfoRow label="House Number" value={allocatedUnit.houseNumber ?? '—'} />
              <InfoRow label="Road Number" value={allocatedUnit.roadNumber ?? '—'} />
              <InfoRow
                label="Building Type"
                value={
                  (() => {
                    return allocatedUnit.status === 'VACANT' ? 'Vacant' : 'Occupied';
                  })()
                }
              />
              <InfoRow label="Occupancy Status" value={
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  allocatedUnit.status === 'VACANT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>{allocatedUnit.status}</span>
              } />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-slate-400" />
            <div>
              <p className="font-semibold text-sm">No Unit Allocated Yet</p>
              <p className="text-xs mt-1">
                Housing unit assignment is performed by the <strong>Estate Officer</strong> at{' '}
                <strong>Stage 2</strong> of the review pipeline, based on availability and the
                applicant&apos;s evaluation score and housing preferences.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
