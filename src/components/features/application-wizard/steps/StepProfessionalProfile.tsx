'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { ApplicationWizardValues } from '@/lib/validations/housing';
import { Briefcase, GraduationCap, Users, Info } from 'lucide-react';

interface StepProfessionalProfileProps {
  form: UseFormReturn<ApplicationWizardValues>;
  isProfileComplete: boolean;
}

const RANKS = [
  'Professor',
  'Associate Professor',
  'Senior Lecturer',
  'Lecturer I',
  'Lecturer II',
  'Assistant Lecturer',
  'Graduate Assistant',
  'Principal Administrative Officer',
  'Senior Administrative Officer',
  'Administrative Officer I',
  'Administrative Officer II',
  'Chief Technologist',
  'Principal Technologist',
  'Senior Technologist',
  'Technologist I',
  'Technologist II',
];

const GRADE_LEVELS = [
  'CONUASS 1', 'CONUASS 2', 'CONUASS 3', 'CONUASS 4',
  'CONUASS 5', 'CONUASS 6', 'CONUASS 7',
  'CONTISS 2', 'CONTISS 3', 'CONTISS 4', 'CONTISS 5',
  'CONTISS 6', 'CONTISS 7', 'CONTISS 8', 'CONTISS 9',
  'CONTISS 10', 'CONTISS 11', 'CONTISS 12', 'CONTISS 13',
  'CONTISS 14', 'CONTISS 15',
];

const MARITAL_STATUSES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
] as const;

export function StepProfessionalProfile({
  form,
  isProfileComplete,
}: StepProfessionalProfileProps) {
  const { register, control, watch, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Professional Profile</h2>
          <p className="text-sm text-muted-foreground">
            Your rank and grade level determine which housing types you are eligible for.
          </p>
        </div>
      </div>

      {!isProfileComplete && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Your staff profile is incomplete. Please fill in the details below before applying.</p>
        </div>
      )}

      {/* Rank & Grade */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Academic / Professional Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="wiz-rank">Rank / Title *</Label>
            <Controller
              name="rank"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v != null && field.onChange(v)}>
                  <SelectTrigger id="wiz-rank" className={errors.rank ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select rank…" />
                  </SelectTrigger>
                  <SelectContent>
                    {RANKS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rank && <p className="text-xs text-destructive">{errors.rank.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wiz-grade">Salary Grade Level *</Label>
            <Controller
              name="salaryGradeLevel"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v != null && field.onChange(v)}>
                  <SelectTrigger id="wiz-grade" className={errors.salaryGradeLevel ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select grade level…" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.salaryGradeLevel && (
              <p className="text-xs text-destructive">{errors.salaryGradeLevel.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wiz-dept">Department *</Label>
            <Input
              id="wiz-dept"
              placeholder="e.g. Computer Science"
              {...register('department')}
              className={errors.department ? 'border-destructive' : ''}
            />
            {errors.department && (
              <p className="text-xs text-destructive">{errors.department.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wiz-faculty">Faculty *</Label>
            <Input
              id="wiz-faculty"
              placeholder="e.g. Technology"
              {...register('faculty')}
              className={errors.faculty ? 'border-destructive' : ''}
            />
            {errors.faculty && (
              <p className="text-xs text-destructive">{errors.faculty.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wiz-empdate">Employment Date *</Label>
            <Input
              id="wiz-empdate"
              type="date"
              {...register('employmentDate')}
              className={errors.employmentDate ? 'border-destructive' : ''}
            />
            {errors.employmentDate && (
              <p className="text-xs text-destructive">{errors.employmentDate.message}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Personal Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4" />
          Personal Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="wiz-marital">Marital Status *</Label>
            <Controller
              name="maritalStatus"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v != null && field.onChange(v)}>
                  <SelectTrigger id="wiz-marital" className={errors.maritalStatus ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select status…" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUSES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.maritalStatus && (
              <p className="text-xs text-destructive">{errors.maritalStatus.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wiz-deps">Number of Dependents</Label>
            <Input
              id="wiz-deps"
              type="number"
              min={0}
              max={20}
              {...register('numberOfDependents')}
            />
          </div>
        </div>
      </div>

      {/* Eligibility hint */}
      {watch('salaryGradeLevel') && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
          <p className="font-medium text-primary">
            {(() => {
              const gl = watch('salaryGradeLevel');
              const isSenior =
                /CONUASS [4-7]/.test(gl) || /CONTISS 1[3-5]/.test(gl);
              return isSenior
                ? '✅ You are eligible for Senior Staff housing (CONUASS 4+ / CONTISS 13+)'
                : '✅ You are eligible for Junior Staff housing (CONUASS 1–3 / CONTISS 2–12)';
            })()}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Housing type options on the next step will be filtered to your eligible category.
          </p>
        </div>
      )}
    </div>
  );
}
