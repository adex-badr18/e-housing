// =============================================================================
// StageStepper — Visual 3-step progress indicator for the review pipeline
// =============================================================================

import { CheckCircle2, Circle, Lock, ClipboardCheck, Building2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApplicationStage } from '@/lib/mock-api/db';

interface Step {
  key:   Exclude<ApplicationStage, 'COMPLETED'>;
  label: string;
  role:  string;
  Icon:  React.ElementType;
}

const STEPS: Step[] = [
  { key: 'HOUSING', label: 'Verification & Scoring',   role: 'Housing Secretary', Icon: ClipboardCheck },
  { key: 'ESTATE',  label: 'Physical Inspection',       role: 'Estate Officer',    Icon: Building2 },
  { key: 'DVC',     label: 'Final Decision',            role: 'DVC Admin',         Icon: Crown },
];

type StepState = 'completed' | 'active' | 'locked';

function getStepState(stepKey: Exclude<ApplicationStage, 'COMPLETED'>, currentStage: ApplicationStage): StepState {
  const order: ApplicationStage[] = ['HOUSING', 'ESTATE', 'DVC', 'COMPLETED'];
  const currentIdx = order.indexOf(currentStage);
  const stepIdx    = order.indexOf(stepKey);

  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'locked';
}

interface StageStepperProps {
  currentStage: ApplicationStage;
}

export function StageStepper({ currentStage }: StageStepperProps) {
  return (
    <div className="relative flex items-start justify-between w-full">
      {STEPS.map((step, idx) => {
        const state = getStepState(step.key, currentStage);
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.key} className="flex-1 flex items-start">
            {/* Step circle + connector */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 z-10',
                  state === 'completed' && 'bg-emerald-500 border-emerald-500 text-white shadow-md',
                  state === 'active'    && 'bg-primary border-primary text-primary-foreground shadow-lg ring-4 ring-primary/20',
                  state === 'locked'    && 'bg-muted border-muted-foreground/30 text-muted-foreground/50'
                )}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : state === 'locked' ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <step.Icon className="h-5 w-5" />
                )}
              </div>
              {/* Label */}
              <div className="mt-2 text-center max-w-[120px]">
                <p className={cn(
                  'text-xs font-semibold leading-tight',
                  state === 'completed' && 'text-emerald-600',
                  state === 'active'    && 'text-primary',
                  state === 'locked'    && 'text-muted-foreground/50'
                )}>
                  {step.label}
                </p>
                <p className={cn(
                  'text-[10px] mt-0.5',
                  state === 'locked' ? 'text-muted-foreground/40' : 'text-muted-foreground'
                )}>
                  {step.role}
                </p>
              </div>
            </div>

            {/* Connector line (skip for last) */}
            {!isLast && (
              <div className="flex-1 mt-5 mx-1">
                <div className={cn(
                  'h-0.5 w-full transition-all duration-500',
                  state === 'completed' ? 'bg-emerald-400' : 'bg-muted-foreground/20'
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
