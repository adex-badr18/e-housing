'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  staffProfileSchema,
  personalInfoSchema,
  appointmentInfoSchema,
  dependantsInfoSchema,
  StaffProfileFormValues,
} from '@/lib/validations/profile';
import { completeStaffOnboarding } from '@/app/actions/profile';
import {
  UserCheck,
  Briefcase,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  GraduationCap,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface StaffOnboardingFormProps {
  initialUser: {
    name?: string | null;
    email?: string | null;
  };
}

const STEPS = [
  { id: 1, name: 'Personal Info', icon: UserCheck, description: 'Basic identification & residence' },
  { id: 2, name: 'Appointment Info', icon: Briefcase, description: 'Staff credentials & faculty placement' },
  { id: 3, name: 'Dependants Info', icon: Users, description: 'Spouse & family details' },
];

const TITLES = ['Prof.', 'Dr.', 'Mr.', 'Mrs.', 'Miss', 'Rev.', 'Engr.', 'Arc.', 'Barr.'];

const FACULTIES = [
  "Faculty of Agriculture",
  "Faculty of Arts",
  "Faculty of Basic Medical Sciences",
  "Faculty of Clinical Sciences",
  "Faculty of Dentistry",
  "Faculty of Education",
  "Faculty of Environmental Design and Management",
  "Faculty of Law",
  "Faculty of Pharmacy",
  "Faculty of Science",
  "Faculty of Social Sciences",
  "Faculty of Technology",
  "Faculty of Computing Science & Engineering",
  "Postgraduate College",
  "Directorate of Academic Affairs",
  "Directorate of Corporate Services",
  "Directorate of Student Affairs",
  "Directorate of Technological Infrastructure (DTI / ICT Centre)",
  "Directorate of Physical Planning and Development",
  "Directorate of Works and Maintenance",
  "Bursary Department",
  "University Library (Hezekiah Oluwasanmi Library)",
  "Medical and Health Services (Health Centre)",
  "Division of Educational Services",
  "Institute of Ecology and Environmental Studies",
  "Institute of Agricultural Research and Training (IAR&T)",
  "Institute of Cultural Studies",
  "Centre for Distance Learning (CDL)",
  "Centre for Energy Research and Development (CERD)",
  "Centre for Gender and Social Policy Studies",
  "Centre for Industrial Research and Development (CIRD)",
  "Centre for Space Research and Applications",
  "Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC)",
  "Security Unit",
  "Audit Unit",
  "Legal Unit",
  "Public Relations Unit",
  "Parks and Gardens Unit",
  "Commercial Farm Unit",
  "Other"
];

const RANKS = [
  'Professor',
  'Associate Professor (Reader)',
  'Senior Lecturer',
  'Lecturer I',
  'Lecturer II',
  'Assistant Lecturer',
  'Graduate Assistant',
  'Deputy Registrar / Director',
  'Principal Assistant Registrar / Deputy Director',
  'Senior Assistant Registrar / Assistant Director',
  'Administrative Officer I / Senior Accountant',
  'Administrative Officer II / Accountant',
  'Bursar',
  'Director',
  'Deputy Director',
  'Deputy Bursar',
  'Bursary',
  'ICT',
  'Registry',
  'Works and Maintenance',
  'Health Services',
  'Library',
  'Security',
  'Sports',
  'Student Affairs',
  'Technologist I',
  'Technologist II',
  'Technical Officer I',
  'Technical Officer II',
  'System programmer I',
  'System programmer II',
  'Executive Officer I',
  'Executive Officer II',
  'Senior Executive Officer',
  'Principal Executive Officer',
  'Assistant Chief Executive Officer',
  'Chief Executive Officer',
];

const SALARY_LEVELS = [
  "CONUASS 1",
  "CONUASS 2",
  "CONUASS 3",
  "CONUASS 4",
  "CONUASS 5",
  "CONUASS 6",
  "CONUASS 7",
  "CONTISS 1",
  "CONTISS 2",
  "CONTISS 3",
  "CONTISS 4",
  "CONTISS 5",
  "CONTISS 6",
  "CONTISS 7",
  "CONTISS 8",
  "CONTISS 9",
  "CONTISS 11",
  "CONTISS 13",
  "CONTISS 14",
  "CONTISS 15",
  "CONHESS 1",
  "CONHESS 2",
  "CONHESS 3",
  "CONHESS 4",
  "CONHESS 5",
  "CONHESS 6",
  "CONHESS 7",
  "CONHESS 8",
  "CONHESS 9",
  "CONHESS 10",
  "CONHESS 11",
  "CONHESS 12",
  "CONHESS 13",
  "CONHESS 14",
  "CONHESS 15",
  "CONMESS 1",
  "CONMESS 2",
  "CONMESS 3",
  "CONMESS 4",
  "CONMESS 5",
  "CONMESS 6",
  "CONMESS 7"
];

const SALARY_STEPS = Array.from({ length: 15 }, (_, i) => `Step ${i + 1}`);

export function StaffOnboardingForm({ initialUser }: StaffOnboardingFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StaffProfileFormValues>({
    resolver: zodResolver(staffProfileSchema) as any,
    defaultValues: {
      title: 'Dr.',
      firstName: initialUser.name?.split(' ')[0] || '',
      lastName: initialUser.name?.split(' ').slice(1).join(' ') || '',
      email: initialUser.email || '',
      phoneNumber: '',
      nationality: 'Nigerian',
      maritalStatus: 'MARRIED',
      gender: 'MALE',
      presentAddress: '',
      staffId: '',
      faculty: 'Technology',
      department: 'Computer Science & Engineering',
      rank: 'Lecturer I',
      salaryLevel: 'CONUASS 4',
      salaryStep: 'Step 2',
      ippisNumber: '',
      employmentDate: '',
      assumptionDate: '',
      expectedRetirementDate: '',
      onLeaveWithoutPay: false,
      previousEmployer: '',
      previousSeniorStaffDate: '',
      previousResponsibility: '',
      previousPeriod: '',
      children: [],
      numberOfDependents: 0,
      spouseName: '',
      spouseEmployedInOAU: false,
      spouseDepartment: '',
      spouseEmploymentAddress: '',
    },
  });

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: 'children',
  });

  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    if (step === 1) {
      const res = personalInfoSchema.safeParse(values);
      if (!res.success) {
        // Trigger field validations
        form.trigger(['title', 'phoneNumber', 'nationality', 'maritalStatus', 'gender', 'presentAddress']);
        toast.error('Please fill in all required fields in Personal Info.');
        return false;
      }
    } else if (step === 2) {
      const res = appointmentInfoSchema.safeParse(values);
      if (!res.success) {
        form.trigger([
          'staffId',
          'faculty',
          'department',
          'rank',
          'salaryLevel',
          'salaryStep',
          'ippisNumber',
          'employmentDate',
          'assumptionDate',
          'expectedRetirementDate',
        ]);
        toast.error('Please fill in all required fields in Appointment Info.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: StaffProfileFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure numberOfDependents matches children count
      const payload = {
        ...data,
        numberOfDependents: data.children ? data.children.length : data.numberOfDependents,
      };

      const result = await completeStaffOnboarding(payload);

      if (result.success) {
        toast.success('Onboarding complete! Redirecting to staff portal...');
        // Force a full JWT session refresh (re-reads profileCompleted=true from mockDB and updates token)
        await updateSession({ profileCompleted: true });
        const dest = result.redirectUrl || '/staff';
        window.location.href = dest;
      } else {
        toast.error(result.error || 'Failed to complete onboarding.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during onboarding submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Visual Stepper Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[rgb(27,34,50)]">Staff Onboarding</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete your institutional record to unlock your housing portal account.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
            <Sparkles className="size-3 text-amber-600" /> Step {currentStep} of 3
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-[rgb(27,34,50)] to-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Step Indicator Badges */}
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                  else if (step.id === currentStep + 1) handleNext();
                }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isActive
                  ? 'bg-[rgb(27,34,50)] text-white border-[rgb(27,34,50)] shadow-md'
                  : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
                    : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}
              >
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isActive
                    ? 'bg-amber-400 text-[rgb(27,34,50)]'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {isCompleted ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-semibold truncate">{step.name}</p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="shadow-lg border-0 bg-white">
        <form onSubmit={(e) => e.preventDefault()}>
          {/* STEP 1: PERSONAL INFO */}
          {currentStep === 1 && (
            <>
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-bold text-[rgb(27,34,50)] flex items-center gap-2">
                  <UserCheck className="size-5 text-amber-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Review locked OAuth profile credentials and complete present place of abode details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Locked Google OAuth Info Banner */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
                  <Lock className="size-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-amber-950">Verified Institutional Google OAuth Credentials</p>
                    <p className="text-amber-800 leading-relaxed">
                      Your Official Full Name and Institutional Email address were imported directly from your @oauife.edu.ng identity provider and cannot be altered here.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-xs font-semibold">Title *</Label>
                    <Select
                      value={form.watch('title') || 'Dr.'}
                      onValueChange={(val) => form.setValue('title', val || '', { shouldValidate: true })}
                    >
                      <SelectTrigger id="title" className="w-full mt-1">
                        <SelectValue placeholder="Select Title" />
                      </SelectTrigger>
                      <SelectContent>
                        {TITLES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Full Name (Locked) */}
                  <div className="md:col-span-2">
                    <Label className="text-xs font-semibold">Official Full Name (Locked)</Label>
                    <div className="relative mt-1 w-full">
                      <Input
                        value={`${initialUser.name || ''}`}
                        disabled
                        className="w-full bg-gray-100 text-gray-700 pr-9 font-medium"
                      />
                      <Lock className="size-4 text-gray-400 absolute right-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email (Locked) */}
                  <div>
                    <Label className="text-xs font-semibold">Official Email Address (Locked)</Label>
                    <div className="relative mt-1 w-full">
                      <Input
                        value={initialUser.email || ''}
                        disabled
                        className="w-full bg-gray-100 text-gray-700 pr-9 font-mono text-xs"
                      />
                      <Lock className="size-4 text-gray-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phoneNumber" className="text-xs font-semibold">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="e.g. 08012345678"
                      className="w-full mt-1"
                      {...form.register('phoneNumber')}
                    />
                    {form.formState.errors.phoneNumber && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nationality */}
                  <div>
                    <Label htmlFor="nationality" className="text-xs font-semibold">Nationality *</Label>
                    <Input
                      id="nationality"
                      placeholder="e.g. Nigerian"
                      className="w-full mt-1"
                      {...form.register('nationality')}
                    />
                    {form.formState.errors.nationality && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.nationality.message}
                      </p>
                    )}
                  </div>

                  {/* Marital Status */}
                  <div>
                    <Label htmlFor="maritalStatus" className="text-xs font-semibold">Marital Status *</Label>
                    <Select
                      value={form.watch('maritalStatus')}
                      onValueChange={(val) =>
                        form.setValue('maritalStatus', val as any, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger id="maritalStatus" className="w-full mt-1">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="MARRIED">Married</SelectItem>
                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gender */}
                  <div>
                    <Label htmlFor="gender" className="text-xs font-semibold">Gender *</Label>
                    <Select
                      value={form.watch('gender')}
                      onValueChange={(val) =>
                        form.setValue('gender', val as any, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger id="gender" className="w-full mt-1">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Present Address */}
                <div>
                  <Label htmlFor="presentAddress" className="text-xs font-semibold">
                    Address of Present Place of Abode *
                  </Label>
                  <Textarea
                    id="presentAddress"
                    rows={3}
                    placeholder="Enter your current residential residential address (e.g. Line 2, Road 7, Senior Staff Quarters, OAU Campus)"
                    className="w-full mt-1 text-xs"
                    {...form.register('presentAddress')}
                  />
                  {form.formState.errors.presentAddress && (
                    <p className="text-xs text-destructive mt-1">
                      {form.formState.errors.presentAddress.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: APPOINTMENT INFO */}
          {currentStep === 2 && (
            <>
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-bold text-[rgb(27,34,50)] flex items-center gap-2">
                  <Briefcase className="size-5 text-amber-600" />
                  Appointment & Employment Information
                </CardTitle>
                <CardDescription>
                  Enter official university appointment details, salary grade level, and duty dates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Staff ID */}
                  <div>
                    <Label htmlFor="staffId" className="text-xs font-semibold">Staff ID *</Label>
                    <Input
                      id="staffId"
                      placeholder="e.g. STF-009"
                      className="w-full mt-1 font-mono text-xs"
                      {...form.register('staffId')}
                    />
                    {form.formState.errors.staffId && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.staffId.message}
                      </p>
                    )}
                  </div>

                  {/* IPPIS / GIFMIS Number */}
                  <div>
                    <Label htmlFor="ippisNumber" className="text-xs font-semibold">IPPIS / GIFMIS Number *</Label>
                    <Input
                      id="ippisNumber"
                      placeholder="e.g. 10094821"
                      className="w-full mt-1 font-mono text-xs"
                      {...form.register('ippisNumber')}
                    />
                    {form.formState.errors.ippisNumber && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.ippisNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Faculty */}
                  <div>
                    <Label htmlFor="faculty" className="text-xs font-semibold">Faculty *</Label>
                    <Select
                      value={form.watch('faculty') || 'Technology'}
                      onValueChange={(val) => form.setValue('faculty', val || '', { shouldValidate: true })}
                    >
                      <SelectTrigger id="faculty" className="w-full mt-1">
                        <SelectValue placeholder="Select Faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {FACULTIES.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department */}
                  <div>
                    <Label htmlFor="department" className="text-xs font-semibold">Department / Unit *</Label>
                    <Input
                      id="department"
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full mt-1"
                      {...form.register('department')}
                    />
                    {form.formState.errors.department && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.department.message}
                      </p>
                    )}
                  </div>

                  {/* Rank */}
                  <div>
                    <Label htmlFor="rank" className="text-xs font-semibold">Rank / Cadre *</Label>
                    <Select
                      value={form.watch('rank') || 'Lecturer I'}
                      onValueChange={(val) => form.setValue('rank', val || '', { shouldValidate: true })}
                    >
                      <SelectTrigger id="rank" className="w-full mt-1">
                        <SelectValue placeholder="Select Rank" />
                      </SelectTrigger>
                      <SelectContent>
                        {RANKS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Salary Level / Grade */}
                  <div>
                    <Label htmlFor="salaryLevel" className="text-xs font-semibold">Salary Level / Grade *</Label>
                    <Select
                      value={form.watch('salaryLevel') || 'CONUASS 4'}
                      onValueChange={(val) => form.setValue('salaryLevel', val || '', { shouldValidate: true })}
                    >
                      <SelectTrigger id="salaryLevel" className="w-full mt-1">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALARY_LEVELS.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.salaryLevel && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.salaryLevel.message}
                      </p>
                    )}
                  </div>

                  {/* Salary Step */}
                  <div>
                    <Label htmlFor="salaryStep" className="text-xs font-semibold">Salary Step *</Label>
                    <Select
                      value={form.watch('salaryStep') || 'Step 2'}
                      onValueChange={(val) => form.setValue('salaryStep', val || '', { shouldValidate: true })}
                    >
                      <SelectTrigger id="salaryStep" className="w-full mt-1">
                        <SelectValue placeholder="Select Step" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALARY_STEPS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.salaryStep && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.salaryStep.message}
                      </p>
                    )}
                  </div>

                  {/* Date of Employment */}
                  <div>
                    <Label htmlFor="employmentDate" className="text-xs font-semibold">Date of Employment *</Label>
                    <Input
                      id="employmentDate"
                      type="date"
                      className="w-full mt-1"
                      {...form.register('employmentDate')}
                    />
                    {form.formState.errors.employmentDate && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.employmentDate.message}
                      </p>
                    )}
                  </div>

                  {/* Date of Assumption of Duty */}
                  <div>
                    <Label htmlFor="assumptionDate" className="text-xs font-semibold">Date of Assumption of Duty *</Label>
                    <Input
                      id="assumptionDate"
                      type="date"
                      className="w-full mt-1"
                      {...form.register('assumptionDate')}
                    />
                    {form.formState.errors.assumptionDate && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.assumptionDate.message}
                      </p>
                    )}
                  </div>

                  {/* Expected Date of Retirement */}
                  <div>
                    <Label htmlFor="expectedRetirementDate" className="text-xs font-semibold">Expected Date of Retirement *</Label>
                    <Input
                      id="expectedRetirementDate"
                      type="date"
                      className="w-full mt-1"
                      {...form.register('expectedRetirementDate')}
                    />
                    {form.formState.errors.expectedRetirementDate && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.expectedRetirementDate.message}
                      </p>
                    )}
                  </div>

                  {/* Date of Becoming Senior Staff */}
                  <div>
                    <Label htmlFor="previousSeniorStaffDate" className="text-xs font-semibold">Date of Becoming Senior Staff</Label>
                    <Input
                      id="previousSeniorStaffDate"
                      type="date"
                      className="w-full mt-1 text-xs"
                      {...form.register('previousSeniorStaffDate')}
                    />
                  </div>
                </div>

                {/* Leave Without Pay Switch */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[rgb(27,34,50)]">Are you currently on Leave?</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Indicate whether you are on approved Secondment, Sabbatical Leave or Leave of Absence without Pay.
                    </p>
                  </div>
                  <Select
                    value={form.watch('onLeaveWithoutPay') ? 'yes' : 'no'}
                    onValueChange={(val) => form.setValue('onLeaveWithoutPay', val === 'yes')}
                  >
                    <SelectTrigger className="w-28 sm:w-36 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Previous Teaching Experience */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-bold text-[rgb(27,34,50)] flex items-center gap-1.5">
                    <GraduationCap className="size-4 text-amber-600" />
                    Previous Teaching (Optional)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="previousEmployer" className="text-xs">Previous Employer</Label>
                      <Input
                        id="previousEmployer"
                        placeholder="e.g. University of Lagos"
                        className="w-full mt-1 text-xs"
                        {...form.register('previousEmployer')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="previousResponsibility" className="text-xs">Job Nature / Responsibility</Label>
                      <Input
                        id="previousResponsibility"
                        placeholder="e.g. Lecturer II / Researcher"
                        className="w-full mt-1 text-xs"
                        {...form.register('previousResponsibility')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="previousPeriod" className="text-xs">Period (Duration)</Label>
                      <Input
                        id="previousPeriod"
                        placeholder="e.g. 2018 - 2021 (3 years)"
                        className="w-full mt-1 text-xs"
                        {...form.register('previousPeriod')}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 3: DEPENDANTS INFO */}
          {currentStep === 3 && (
            <>
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-lg font-bold text-[rgb(27,34,50)] flex items-center gap-2">
                  <Users className="size-5 text-amber-600" />
                  Dependants & Spouse Information
                </CardTitle>
                <CardDescription>
                  Register child dependants and spouse employment status for housing scoring allocation.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Spouse Details */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-bold text-[rgb(27,34,50)]">Spouse Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="spouseName" className="text-xs">Name of Spouse</Label>
                      <Input
                        id="spouseName"
                        placeholder="e.g. Dr. (Mrs) Funke Bakare"
                        className="w-full mt-1 text-xs"
                        {...form.register('spouseName')}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Is Spouse Employed in OAU?</Label>
                      <Select
                        value={form.watch('spouseEmployedInOAU') ? 'yes' : 'no'}
                        onValueChange={(val) => form.setValue('spouseEmployedInOAU', val === 'yes')}
                      >
                        <SelectTrigger className="w-full mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes (Employed in OAU)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {form.watch('spouseEmployedInOAU') && (
                    <div>
                      <Label htmlFor="spouseDepartment" className="text-xs">Department / Unit of Spouse in OAU</Label>
                      <Input
                        id="spouseDepartment"
                        placeholder="e.g. Department of Biochemistry"
                        className="w-full mt-1 text-xs"
                        {...form.register('spouseDepartment')}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="spouseEmploymentAddress" className="text-xs">Employment Address of Spouse</Label>
                    <Input
                      id="spouseEmploymentAddress"
                      placeholder="e.g. Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC)"
                      className="w-full mt-1 text-xs"
                      {...form.register('spouseEmploymentAddress')}
                    />
                  </div>
                </div>

                {/* Children Details */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[rgb(27,34,50)]">Child(ren) Dependants</p>
                      <p className="text-[11px] text-muted-foreground">Add details of dependent children under your care.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendChild({ name: '', age: 0 })}
                      className="text-xs gap-1 border-dashed border-amber-500 text-amber-800 hover:bg-amber-50"
                    >
                      <Plus className="size-3.5" /> Add Child
                    </Button>
                  </div>

                  {childFields.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg bg-gray-50/50">
                      <p className="text-xs text-muted-foreground">No child dependants added yet.</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => appendChild({ name: '', age: 0 })}
                        className="text-xs text-amber-700"
                      >
                        + Add a child dependant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {childFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-xs font-bold text-gray-500 w-6">#{index + 1}</span>
                          <div className="flex-1">
                            <Input
                              placeholder="Child's Full Name"
                              className="text-xs bg-white"
                              {...form.register(`children.${index}.name` as const)}
                            />
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              placeholder="Age"
                              min={0}
                              className="text-xs bg-white"
                              {...form.register(`children.${index}.age` as const)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeChild(index)}
                            className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Footer Controls */}
          <CardFooter className="flex justify-between border-t p-6 bg-gray-50/50">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack} className="gap-2 text-xs">
                <ArrowLeft className="size-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                key="next-btn"
                type="button"
                onClick={handleNext}
                className="gap-2 bg-[rgb(27,34,50)] hover:bg-[rgb(27,34,50)]/90 text-xs px-6"
              >
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                key="submit-btn"
                type="button"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-8 shadow-md"
              >
                {isSubmitting ? (
                  <>Processing Onboarding...</>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Complete Onboarding & Enter Portal
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
