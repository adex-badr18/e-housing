'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { applicationWizardSchema, type ApplicationWizardValues } from '@/lib/validations/housing';
import { submitApplicationAction } from '@/app/actions/applications';
import type { HousingType, StaffProfile } from '@/lib/mock-api/db';
import { WizardStepIndicator } from './WizardStepIndicator';
import { StepProfessionalProfile } from './steps/StepProfessionalProfile';
import { StepHousingPreferences } from './steps/StepHousingPreferences';
import { StepDependents } from './steps/StepDependents';
import { StepReview } from './steps/StepReview';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Send, Home } from 'lucide-react';
import Link from 'next/link';

// Grade level → housing category eligibility
function getEligibleCategory(gradeLevel: string): 'SENIOR' | 'JUNIOR' | 'ALL' {
  if (/CONUASS [4-7]$/.test(gradeLevel) || /CONTISS 1[3-5]$/.test(gradeLevel)) return 'SENIOR';
  if (/CONUASS [1-3]$/.test(gradeLevel) || /CONTISS \d{1,2}$/.test(gradeLevel)) return 'JUNIOR';
  return 'ALL';
}

const STEPS = [
  {
    index: 0,
    label: 'Professional Profile',
    description: 'Rank & grade level',
    validateFields: [
      'rank', 'salaryGradeLevel', 'department', 'faculty', 'employmentDate', 'maritalStatus',
    ] as const,
  },
  {
    index: 1,
    label: 'Housing Preferences',
    description: 'Select up to 3 types',
    validateFields: ['preferredHousingTypeIds'] as const,
  },
  {
    index: 2,
    label: 'Spouse & Dependents',
    description: 'Family details',
    validateFields: [] as const,
  },
  {
    index: 3,
    label: 'Review & Submit',
    description: 'Confirm and submit',
    validateFields: [] as const,
  },
];

interface ApplicationWizardProps {
  housingTypes: HousingType[];
  profile: StaffProfile | null;
  hasExistingApplication: boolean;
}

export function ApplicationWizard({
  housingTypes,
  profile,
  hasExistingApplication,
}: ApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ApplicationWizardValues>({
    resolver: zodResolver(applicationWizardSchema) as any,
    mode: 'onChange',
    defaultValues: {
      rank: profile?.rank ?? '',
      salaryGradeLevel: profile?.salaryGradeLevel ?? '',
      department: profile?.department ?? '',
      faculty: profile?.faculty ?? '',
      employmentDate: profile?.employmentDate ?? '',
      maritalStatus: profile?.maritalStatus ?? 'SINGLE',
      numberOfDependents: profile?.numberOfDependents ?? 0,
      preferredHousingTypeIds: [],
      spouseName: '',
      spousePhone: '',
      dependents: [],
      additionalNotes: '',
    },
  });

  const { trigger, getValues } = form;

  // Compute eligible housing types based on current grade level selection
  const gradeLevel = form.watch('salaryGradeLevel');
  const eligibleCategory = getEligibleCategory(gradeLevel);
  const eligibleTypes = housingTypes.filter(
    (ht) => ht.isActive && (eligibleCategory === 'ALL' || ht.category === eligibleCategory)
  );

  const goNext = async () => {
    const step = STEPS[currentStep];
    const fieldsToValidate = step.validateFields as unknown as string[];
    if (fieldsToValidate.length > 0) {
      const valid = await trigger(fieldsToValidate as Parameters<typeof trigger>[0]);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    const values = getValues();
    startTransition(async () => {
      const result = await submitApplicationAction({
        preferredHousingTypeIds: values.preferredHousingTypeIds,
        additionalNotes: values.additionalNotes,
      });
      if (result.success) {
        toast.success('Application submitted successfully! The Housing Secretary will review it.');
        setIsSubmitted(true);
      } else {
        toast.error(result.error ?? 'Failed to submit application. Please try again.');
      }
    });
  };

  // Success screen
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center">
          <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-emerald-800">Application Submitted!</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Your housing application has been received and is now with the Housing Secretary for review.
            You will be notified of any updates.
          </p>
        </div>
        <Link
          href="/staff"
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Existing application guard
  if (hasExistingApplication) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center mx-auto">
          <Home className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold">Application Already Submitted</h2>
        <p className="text-muted-foreground">
          You already have an active housing application under review. You cannot submit a new application
          while one is being processed.
        </p>
        <Link href="/staff" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Housing Application</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete all steps to submit your housing application for review.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <WizardStepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div
        key={currentStep}
        className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {currentStep === 0 && (
          <StepProfessionalProfile
            form={form}
            isProfileComplete={!!profile}
          />
        )}
        {currentStep === 1 && (
          <StepHousingPreferences
            form={form}
            eligibleTypes={eligibleTypes}
          />
        )}
        {currentStep === 2 && (
          <StepDependents form={form} />
        )}
        {currentStep === 3 && (
          <StepReview form={form} housingTypes={housingTypes} />
        )}
      </div>

      {/* Navigation */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 0 || isPending}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full transition-all duration-200',
                  i === currentStep
                    ? 'w-5 h-2 bg-primary'
                    : i < currentStep
                    ? 'w-2 h-2 bg-primary/40'
                    : 'w-2 h-2 bg-border'
                )}
              />
            ))}
          </div>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              id="wizard-submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
