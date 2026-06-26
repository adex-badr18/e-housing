'use client';

import { useFieldArray, Controller, type UseFormReturn } from 'react-hook-form';
import type { ApplicationWizardValues } from '@/lib/validations/housing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Users, UserPlus, Trash2, Heart, Info } from 'lucide-react';

interface StepDependentsProps {
  form: UseFormReturn<ApplicationWizardValues, any, any>;
}

export function StepDependents({ form }: StepDependentsProps) {
  const { register, control, watch, formState: { errors } } = form;
  const maritalStatus = watch('maritalStatus');
  const isMarried = maritalStatus === 'MARRIED';

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'dependents',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Spouse & Dependents</h2>
          <p className="text-sm text-muted-foreground">
            Providing dependents information may affect your allocation score.
          </p>
        </div>
      </div>

      {/* Spouse Section — only shown when married */}
      {isMarried ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-400" />
            Spouse Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-rose-50/50 border border-rose-100">
            <div className="space-y-1.5">
              <Label htmlFor="wiz-spouse-name">Spouse Full Name</Label>
              <Input
                id="wiz-spouse-name"
                placeholder="e.g. Amaka Okonkwo"
                {...register('spouseName')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wiz-spouse-phone">Spouse Phone Number</Label>
              <Input
                id="wiz-spouse-phone"
                placeholder="e.g. 08012345678"
                type="tel"
                {...register('spousePhone')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          Spouse section is only shown for married staff. Your marital status from Step 1 is:{' '}
          <span className="font-medium text-foreground capitalize">{maritalStatus?.toLowerCase()}</span>
        </div>
      )}

      <Separator />

      {/* Dependents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            Dependents ({fields.length})
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            id="add-dependent-btn"
            onClick={() => append({ name: '', relationship: '' })}
            className="gap-1.5 h-8 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Dependent
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
            <Users className="h-8 w-8 mx-auto opacity-20 mb-2" />
            <p>No dependents added yet.</p>
            <p className="text-xs mt-1">Click "Add Dependent" to add children or other dependents.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-muted/20 group animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted border border-border">
                    #{index + 1}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`dep-name-${index}`} className="text-xs">Full Name *</Label>
                  <Input
                    id={`dep-name-${index}`}
                    placeholder="Full name"
                    {...register(`dependents.${index}.name`)}
                    className={errors.dependents?.[index]?.name ? 'border-destructive' : ''}
                  />
                  {errors.dependents?.[index]?.name && (
                    <p className="text-xs text-destructive">
                      {errors.dependents[index].name?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`dep-rel-${index}`} className="text-xs">Relationship *</Label>
                  <Input
                    id={`dep-rel-${index}`}
                    placeholder="e.g. Child, Parent"
                    {...register(`dependents.${index}.relationship`)}
                    className={errors.dependents?.[index]?.relationship ? 'border-destructive' : ''}
                  />
                  {errors.dependents?.[index]?.relationship && (
                    <p className="text-xs text-destructive">
                      {errors.dependents[index].relationship?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`dep-age-${index}`} className="text-xs">Age (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`dep-age-${index}`}
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Age"
                      {...register(`dependents.${index}.age`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="h-9 w-9 p-0 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove dependent ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
