'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  index: number;
  label: string;
  description: string;
}

interface WizardStepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-start w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isUpcoming = idx > currentStep;

          return (
            <div key={step.index} className="flex-1 flex items-start">
              {/* Step node + connector */}
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {/* Left connector */}
                  {idx > 0 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 transition-all duration-500',
                        isCompleted || isActive ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}

                  {/* Step circle */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 border-2',
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                        : isActive
                        ? 'bg-background border-primary text-primary shadow-lg shadow-primary/20 scale-110'
                        : 'bg-background border-border text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{step.index + 1}</span>
                    )}
                  </div>

                  {/* Right connector */}
                  {idx < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 transition-all duration-500',
                        isCompleted ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </div>

                {/* Label below */}
                <div className="mt-2 text-center px-1">
                  <p
                    className={cn(
                      'text-xs font-semibold transition-colors duration-200',
                      isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: compact progress bar */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.label}
          </span>
          <span className="text-muted-foreground text-xs">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
