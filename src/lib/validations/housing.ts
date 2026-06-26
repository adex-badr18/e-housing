// =============================================================================
// OAU E-Housing — Zod Validation Schemas
// =============================================================================
// All form-submission and server-action validation schemas live here.
// Mirrors the TypeScript interfaces in db.ts but adds runtime rules.
// =============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared / Primitive Schemas
// ---------------------------------------------------------------------------

export const roleSchema = z.enum([
  'SUPER_ADMIN',
  'HOUSING_SECRETARY',
  'ESTATE_OFFICER',
  'DVC_ADMIN',
  'ELECTRICAL_OFFICER',
  'STAFF',
]);

export const genderSchema = z.enum(['MALE', 'FEMALE']);
export const maritalStatusSchema = z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']);
export const housingCategorySchema = z.enum(['SENIOR', 'JUNIOR']);
export const buildingTypeSchema = z.enum(['BUNGALOW', 'STOREY']);
export const unitStatusSchema = z.enum(['VACANT', 'OCCUPIED', 'UNDER_MAINTENANCE']);
export const bqStatusSchema = z.enum(['VACANT', 'OCCUPIED']);
export const inspectionStatusSchema = z.enum(['PENDING', 'PASSED', 'FAILED']);
export const applicationStatusSchema = z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']);
export const applicationStageSchema = z.enum(['HOUSING', 'ESTATE', 'DVC', 'COMPLETED']);
export const reviewDecisionSchema = z.enum(['APPROVED', 'REJECTED', 'FORWARDED']);
export const allocationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']);
export const exitReasonSchema = z.enum([
  'RETIREMENT',
  'DEATH',
  'RESIGNATION',
  'RELOCATION',
  'OTHER',
]);
export const incidentStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']);

// ---------------------------------------------------------------------------
// 1. Housing Type — create / edit
// ---------------------------------------------------------------------------

export const housingTypeSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  category: housingCategorySchema,
  buildingType: buildingTypeSchema,
  numberOfBedrooms: z.coerce.number().int().min(1, 'At least 1 bedroom required'),
  numberOfBathrooms: z.coerce.number().int().min(0),
  numberOfToilets: z.coerce.number().int().min(0),
  hasStudyRoom: z.boolean(),
  hasParking: z.boolean(),
  hasBQ: z.boolean(),
  numberOfBQ: z.coerce.number().int().min(0),
  hasCourtyard: z.boolean(),
  allocationPoints: z.coerce
    .number()
    .int()
    .min(1, 'Allocation points must be at least 1'),
  annualRent: z.coerce.number().min(0, 'Annual rent cannot be negative'),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.hasBQ && data.numberOfBQ < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'If BQ is available, number of BQs must be at least 1',
      path: ['numberOfBQ'],
    });
  }
  if (!data.hasBQ && data.numberOfBQ > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Number of BQs must be 0 when BQ is not available',
      path: ['numberOfBQ'],
    });
  }
});

export type HousingTypeFormValues = z.infer<typeof housingTypeSchema>;

// ---------------------------------------------------------------------------
// 2. Housing Unit — create / edit
// ---------------------------------------------------------------------------

export const housingUnitSchema = z.object({
  name: z
    .string()
    .min(2, 'Unit name must be at least 2 characters')
    .max(50, 'Unit name is too long'),
  housingTypeId: z.string().min(1, 'Housing type is required'),
  status: unitStatusSchema,
});

export type HousingUnitFormValues = z.infer<typeof housingUnitSchema>;

// ---------------------------------------------------------------------------
// 3. BQ Occupant — add / update
// ---------------------------------------------------------------------------

export const bqOccupantSchema = z.object({
  bqId: z.string().min(1, 'BQ ID is required'),
  fullName: z.string().min(2, 'Full name is required'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  relationship: z.string().min(2, 'Relationship / role is required'),
});

export type BQOccupantFormValues = z.infer<typeof bqOccupantSchema>;

// ---------------------------------------------------------------------------
// 4. Housing Application — wizard submission
// ---------------------------------------------------------------------------

export const applicationSubmitSchema = z.object({
  preferredHousingTypeIds: z
    .array(z.string())
    .min(1, 'Select at least one preferred housing type')
    .max(3, 'You can select a maximum of 3 preferred housing types'),
  additionalNotes: z.string().max(500, 'Notes must be under 500 characters').optional(),
});

export type ApplicationSubmitValues = z.infer<typeof applicationSubmitSchema>;

// ---------------------------------------------------------------------------
// 5. Application Review — stage approval (used by management users)
// ---------------------------------------------------------------------------

export const applicationReviewSchema = z
  .object({
    applicationId: z.string().min(1),
    stage: z.enum(['HOUSING', 'ESTATE', 'DVC']),
    decision: reviewDecisionSchema,
    comments: z
      .string()
      .min(10, 'Comments must be at least 10 characters')
      .max(1000, 'Comments must be under 1000 characters'),
    // Only HOUSING stage sets a score
    score: z.coerce.number().int().min(0).max(100).optional().nullable(),
    // Points breakdown provided by Housing Secretary
    baseTypePoints: z.coerce.number().int().min(0).optional(),
    seniorityBonus: z.coerce.number().int().min(0).optional(),
    dependentsBonus: z.coerce.number().int().min(0).optional(),
    maritalStatusBonus: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.stage === 'HOUSING' && data.decision === 'FORWARDED' && (data.score == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A score must be assigned before forwarding at the Housing stage',
        path: ['score'],
      });
    }
    if (data.stage === 'DVC' && data.decision === 'FORWARDED') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DVC Admin must make a final APPROVED or REJECTED decision — not FORWARDED',
        path: ['decision'],
      });
    }
  });

export type ApplicationReviewValues = z.infer<typeof applicationReviewSchema>;

// ---------------------------------------------------------------------------
// 6. Exit Notice — staff submission
// ---------------------------------------------------------------------------

export const exitNoticeSubmitSchema = z
  .object({
    housingUnitId: z.string().min(1, 'Housing unit reference is required'),
    reason: exitReasonSchema,
    customReason: z.string().max(300, 'Custom reason must be under 300 characters').optional(),
    additionalNotes: z
      .string()
      .max(500, 'Additional notes must be under 500 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reason === 'OTHER' && !data.customReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please provide a reason when selecting "Other"',
        path: ['customReason'],
      });
    }
  });

export type ExitNoticeSubmitValues = z.infer<typeof exitNoticeSubmitSchema>;

// ---------------------------------------------------------------------------
// 7. Exit Inspection Update — management users
// ---------------------------------------------------------------------------

export const exitInspectionSchema = z.object({
  exitNoticeId: z.string().min(1, 'Exit notice ID is required'),
  /**
   * Which inspection stage this update is for.
   * The server action enforces that only the correct role can update each stage.
   */
  stage: z.enum(['HOUSING', 'ELECTRICAL', 'ESTATE']),
  result: z.enum(['PASSED', 'FAILED'], {
    message: 'Result must be either PASSED or FAILED',
  }),
  inspectionNotes: z.string().max(500).optional(),
});

export type ExitInspectionValues = z.infer<typeof exitInspectionSchema>;

// ---------------------------------------------------------------------------
// 8. Incident Ticket (Complaint) — staff submission
// ---------------------------------------------------------------------------

export const incidentTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be under 120 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be under 2000 characters'),
});

export type IncidentTicketFormValues = z.infer<typeof incidentTicketSchema>;

// ---------------------------------------------------------------------------
// 9. Incident Ticket Status Update — management
// ---------------------------------------------------------------------------

export const incidentStatusUpdateSchema = z.object({
  ticketId: z.string().min(1),
  status: incidentStatusSchema,
});

export type IncidentStatusUpdateValues = z.infer<typeof incidentStatusUpdateSchema>;

// ---------------------------------------------------------------------------
// 10. User Management — create management user (SUPER_ADMIN only)
// ---------------------------------------------------------------------------

export const createManagementUserSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z
    .string()
    .email('Invalid email')
    .refine(
      (v) => v.endsWith('@oauife.edu.ng'),
      { message: 'Must be an institutional email (@oauife.edu.ng)' }
    ),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .optional(),
  role: z.enum([
    'HOUSING_SECRETARY',
    'ESTATE_OFFICER',
    'DVC_ADMIN',
    'ELECTRICAL_OFFICER',
  ]),
});

export type CreateManagementUserValues = z.infer<typeof createManagementUserSchema>;

// ---------------------------------------------------------------------------
// 11. Allocation Response — staff accepts / rejects an allocation
// ---------------------------------------------------------------------------

export const allocationResponseSchema = z.object({
  allocationId: z.string().min(1),
  response: z.enum(['ACCEPTED', 'REJECTED']),
});

export type AllocationResponseValues = z.infer<typeof allocationResponseSchema>;
