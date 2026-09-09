'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { dependantsInfoSchema, DependantsInfoValues } from '@/lib/validations/profile';
import { updateDependantsInfo } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Baby,
  Building2,
  MapPin,
  Plus,
  Trash2,
  Save,
  Users,
} from 'lucide-react';

interface DependantsEditFormProps {
  initialData: {
    spouseName?: string | null;
    spouseEmployedInOAU?: boolean | null;
    spouseDepartment?: string | null;
    spouseEmploymentAddress?: string | null;
    children?: { name: string; age: number }[] | null;
    numberOfDependents?: number;
    maritalStatus?: string | null;
  };
}

export function DependantsEditForm({ initialData }: DependantsEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DependantsInfoValues>({
    resolver: zodResolver(dependantsInfoSchema) as any,
    defaultValues: {
      spouseName: initialData.spouseName ?? '',
      spouseEmployedInOAU: initialData.spouseEmployedInOAU ?? false,
      spouseDepartment: initialData.spouseDepartment ?? '',
      spouseEmploymentAddress: initialData.spouseEmploymentAddress ?? '',
      children: initialData.children ?? [],
      numberOfDependents: initialData.numberOfDependents ?? 0,
    },
  });

  const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: 'children',
  });

  const watchSpouseInOAU = form.watch('spouseEmployedInOAU');

  const onSubmit = async (data: DependantsInfoValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        numberOfDependents: data.children ? data.children.length : data.numberOfDependents,
      };
      const result = await updateDependantsInfo(payload);
      if (result.success) {
        toast.success('Dependants information updated successfully!');
        // Re-fetch all server components on this page so the
        // "Number of Dependents" field in Personal Details and any
        // other server-rendered sections reflect the saved data immediately.
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update dependants information.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">

      {/* ── Spouse Section ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-background/60">
          <Heart className="size-4 text-rose-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">Spouse Details</span>
        </div>

        <div className="p-5 grid gap-4 sm:grid-cols-2">
          {/* Spouse Name */}
          <div className="space-y-1.5">
            <Label htmlFor="spouseName" className="text-xs font-semibold flex items-center gap-1.5">
              <Heart className="size-3 text-rose-400" /> Name of Spouse
            </Label>
            <Input
              id="spouseName"
              placeholder="e.g. Dr. (Mrs) Funke Bakare"
              className="text-sm"
              {...form.register('spouseName')}
            />
            {form.formState.errors.spouseName && (
              <p className="text-xs text-destructive">{form.formState.errors.spouseName.message}</p>
            )}
          </div>

          {/* Spouse Employed in OAU */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="size-3 text-blue-400" /> Is Spouse Employed in OAU?
            </Label>
            <Select
              value={watchSpouseInOAU ? 'yes' : 'no'}
              onValueChange={(val) => form.setValue('spouseEmployedInOAU', val === 'yes')}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes — Employed in OAU</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spouse Department (conditional) */}
          {watchSpouseInOAU && (
            <div className="space-y-1.5">
              <Label htmlFor="spouseDepartment" className="text-xs font-semibold flex items-center gap-1.5">
                <Building2 className="size-3 text-blue-400" /> Spouse's Department / Unit in OAU
              </Label>
              <Input
                id="spouseDepartment"
                placeholder="e.g. Department of Biochemistry"
                className="text-sm"
                {...form.register('spouseDepartment')}
              />
            </div>
          )}

          {/* Spouse Employment Address */}
          <div className={`space-y-1.5 ${watchSpouseInOAU ? '' : 'sm:col-span-2'}`}>
            <Label htmlFor="spouseEmploymentAddress" className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="size-3 text-green-400" /> Spouse's Employment Address
            </Label>
            <Input
              id="spouseEmploymentAddress"
              placeholder="e.g. OAUTHC, Ile-Ife"
              className="text-sm"
              {...form.register('spouseEmploymentAddress')}
            />
          </div>
        </div>
      </div>

      {/* ── Children / Dependants Section ─────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-background/60">
          <Baby className="size-4 text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">Child Dependants</span>
          <Badge variant="outline" className="ml-auto text-[11px]">
            {childFields.length} {childFields.length === 1 ? 'child' : 'children'}
          </Badge>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => appendChild({ name: '', age: 0 })}
            className="h-7 text-xs gap-1 border-dashed border-amber-500 text-amber-800 hover:bg-amber-50"
          >
            <Plus className="size-3.5" /> Add Child
          </Button>
        </div>

        <div className="p-5">
          {childFields.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg bg-background/50">
              <Baby className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">No child dependants added yet.</p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => appendChild({ name: '', age: 0 })}
                className="text-xs text-amber-700 h-auto p-0"
              >
                + Add a child dependant
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-[2rem_1fr_6rem_2.5rem] gap-3 px-1 pb-1 border-b border-border/60">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Age</span>
                <span />
              </div>

              {childFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[2rem_1fr_6rem_2.5rem] gap-3 items-start"
                >
                  <span className="text-xs font-bold text-muted-foreground pt-2.5">{index + 1}</span>

                  <div>
                    <Input
                      placeholder="Child's full name"
                      className="text-sm"
                      {...form.register(`children.${index}.name` as const)}
                    />
                    {form.formState.errors.children?.[index]?.name && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.children[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      type="number"
                      placeholder="Age"
                      min={0}
                      max={30}
                      className="text-sm"
                      {...form.register(`children.${index}.age` as const)}
                    />
                    {form.formState.errors.children?.[index]?.age && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.children[index]?.age?.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChild(index)}
                    className="size-9 text-red-400 hover:text-red-600 hover:bg-red-50 mt-0.5"
                    aria-label={`Remove child ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              {/* Summary */}
              <div className="pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                <span>
                  Total dependants will be recorded as{' '}
                  <strong className="text-foreground">{childFields.length}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 bg-[rgb(27,34,50)] hover:bg-[rgb(27,34,50)]/90 text-white font-semibold px-8"
        >
          <Save className="size-4" />
          {isSubmitting ? 'Saving Changes...' : 'Save Dependants Information'}
        </Button>
      </div>
    </form>
  );
}
