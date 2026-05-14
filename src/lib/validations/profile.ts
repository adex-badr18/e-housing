import { z } from 'zod';

export const staffProfileSchema = z.object({
  firstName: z.string().optional(), // read-only
  lastName: z.string().optional(), // read-only
  email: z.string().optional(), // read-only
  middleName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], {
    message: "Gender is required",
  }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  staffId: z.string().min(3, "Staff ID is required"),
  department: z.string().min(2, "Department is required"),
  faculty: z.string().min(2, "Faculty is required"),
  rank: z.string().min(2, "Rank is required"),
  salaryGradeLevel: z.string().min(2, "Salary Grade Level is required"),
  employmentDate: z.string({
    message: "Employment date is required",
  }),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], {
    message: "Marital status is required",
  }),
  numberOfDependents: z.coerce.number().min(0, "Dependents cannot be negative"),
});

export type StaffProfileFormValues = z.infer<typeof staffProfileSchema>;
