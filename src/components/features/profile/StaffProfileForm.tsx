'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffProfileSchema, StaffProfileFormValues } from '@/lib/validations/profile';
import { submitProfileForm } from '@/app/actions/profile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

interface StaffProfileFormProps {
  initialData: Partial<StaffProfileFormValues>;
}

export function StaffProfileForm({ initialData }: StaffProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      email: initialData.email || '',
      middleName: initialData.middleName || '',
      gender: initialData.gender || 'MALE',
      phoneNumber: initialData.phoneNumber || '',
      staffId: initialData.staffId || '',
      department: initialData.department || '',
      faculty: initialData.faculty || '',
      rank: initialData.rank || '',
      salaryGradeLevel: initialData.salaryGradeLevel || '',
      employmentDate: initialData.employmentDate || '',
      maritalStatus: initialData.maritalStatus || 'SINGLE',
      numberOfDependents: initialData.numberOfDependents || 0,
    },
  });

  const onSubmit = async (data: StaffProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await submitProfileForm(data);
      if (result.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(result.error || "Failed to update profile.");
      }
    } catch (e) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClassName = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" {...register('firstName')} readOnly className="bg-muted/50" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name</Label>
          <Input id="middleName" {...register('middleName')} />
          {errors.middleName && <p className="text-xs text-destructive">{errors.middleName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" {...register('lastName')} readOnly className="bg-muted/50" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} readOnly className="bg-muted/50" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" type="tel" {...register('phoneNumber')} />
          {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select id="gender" {...register('gender')} className={selectClassName}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
        </div>
      </div>

      <div className="border-t pt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="staffId">Staff ID</Label>
          <Input id="staffId" {...register('staffId')} />
          {errors.staffId && <p className="text-xs text-destructive">{errors.staffId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" {...register('department')} />
          {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="faculty">Faculty</Label>
          <Input id="faculty" {...register('faculty')} />
          {errors.faculty && <p className="text-xs text-destructive">{errors.faculty.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rank">Rank</Label>
          <Input id="rank" {...register('rank')} />
          {errors.rank && <p className="text-xs text-destructive">{errors.rank.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salaryGradeLevel">Salary Grade Level</Label>
          <Input id="salaryGradeLevel" {...register('salaryGradeLevel')} />
          {errors.salaryGradeLevel && <p className="text-xs text-destructive">{errors.salaryGradeLevel.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="employmentDate">Employment Date</Label>
          <Input id="employmentDate" type="date" {...register('employmentDate')} />
          {errors.employmentDate && <p className="text-xs text-destructive">{errors.employmentDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <select id="maritalStatus" {...register('maritalStatus')} className={selectClassName}>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
          {errors.maritalStatus && <p className="text-xs text-destructive">{errors.maritalStatus.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfDependents">Number of Dependents</Label>
          <Input id="numberOfDependents" type="number" {...register('numberOfDependents')} min="0" />
          {errors.numberOfDependents && <p className="text-xs text-destructive">{errors.numberOfDependents.message}</p>}
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
