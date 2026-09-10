import { z } from 'zod';

// Step 1: Personal Info Schema
export const personalInfoSchema = z.object({
  title: z.string().min(1, 'Title is required (e.g. Prof., Dr., Mr., Mrs.)'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  email: z.string().optional(),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  nationality: z.string().min(2, 'Nationality is required'),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], {
    message: 'Marital status is required',
  }),
  gender: z.enum(['MALE', 'FEMALE'], {
    message: 'Gender is required',
  }),
  presentAddress: z.string().min(5, 'Address of present place of abode is required'),
});

// Previous Teaching Experience Entry Schema
export const previousExperienceSchema = z.object({
  employer: z.string().min(1, 'Employer name is required'),
  responsibility: z.string().optional(),
  period: z.string().optional(),
});

// Step 2: Appointment Info Schema
export const appointmentInfoSchema = z.object({
  staffId: z.string().min(3, 'Staff ID / P-Number is required'),
  faculty: z.string().min(2, 'Faculty is required'),
  department: z.string().min(2, 'Department is required'),
  rank: z.string().min(2, 'Rank / Cadre is required'),
  salaryLevel: z.string().min(1, 'Salary Level / Grade is required'),
  salaryStep: z.string().min(1, 'Salary Step is required'),
  salaryGradeLevel: z.string().optional(),
  ippisNumber: z.string().min(3, 'IPPIS / GIFMIS number is required'),
  employmentDate: z.string().min(1, 'Date of employment is required'),
  assumptionDate: z.string().min(1, 'Date of assumption of duty is required'),
  expectedRetirementDate: z.string().min(1, 'Expected date of retirement is required'),
  previousSeniorStaffDate: z.string().optional(),
  onLeaveWithoutPay: z.boolean().default(false),
  previousExperiences: z.array(previousExperienceSchema).optional().default([]),
});

// Child Dependant Schema
export const childSchema = z.object({
  name: z.string().min(1, 'Child name is required'),
  age: z.coerce.number().min(0, 'Age must be 0 or greater'),
});

// Step 3: Dependants Info Schema
export const dependantsInfoSchema = z.object({
  children: z.array(childSchema).optional().default([]),
  numberOfDependents: z.coerce.number().min(0, 'Dependents count cannot be negative'),
  spouseName: z.string().optional(),
  spouseEmployedInOAU: z.boolean().default(false),
  spouseDepartment: z.string().optional(),
  spouseEmploymentAddress: z.string().optional(),
});

// Full Combined Onboarding Schema
export const staffProfileSchema = z.object({
  ...personalInfoSchema.shape,
  ...appointmentInfoSchema.shape,
  ...dependantsInfoSchema.shape,
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
export type AppointmentInfoValues = z.infer<typeof appointmentInfoSchema>;
export type DependantsInfoValues = z.infer<typeof dependantsInfoSchema>;
export type StaffProfileFormValues = z.infer<typeof staffProfileSchema>;
export type PreviousExperienceValues = z.infer<typeof previousExperienceSchema>;
