'use server';

import { auth } from '@/lib/auth';
import { mockDB } from '@/lib/mock-api/db';
import { updateStaffProfile } from '@/lib/mock-api/endpoints/profile';
import { staffProfileSchema } from '@/lib/validations/profile';
import { revalidatePath } from 'next/cache';

export async function completeStaffOnboarding(data: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Access denied. Onboarding is reserved for staff members.' };
  }

  const parsed = staffProfileSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed. Please review the highlighted fields in each step.',
      details: parsed.error.format(),
    };
  }

  // Extract document uploads (not part of Zod schema — passed as pre-serialized base64 objects)
  const rawData = data as Record<string, unknown>;
  const documents = rawData.documents as {
    appointmentLetter?: { name: string; size: number; type: string; dataUrl: string; uploadedAt: string };
    assumptionLetter?: { name: string; size: number; type: string; dataUrl: string; uploadedAt: string };
    promotionLetter?: { name: string; size: number; type: string; dataUrl: string; uploadedAt: string };
  } | undefined;

  try {
    const val = parsed.data;

    // Update staff profile details
    await updateStaffProfile(session.user.id, {
      title: val.title,
      phoneNumber: val.phoneNumber,
      nationality: val.nationality,
      maritalStatus: val.maritalStatus,
      gender: val.gender,
      presentAddress: val.presentAddress,
      staffId: val.staffId,
      faculty: val.faculty,
      department: val.department,
      rank: val.rank,
      salaryLevel: val.salaryLevel,
      salaryStep: val.salaryStep,
      salaryGradeLevel: `${val.salaryLevel} ${val.salaryStep}`,
      ippisNumber: val.ippisNumber,
      employmentDate: val.employmentDate,
      assumptionDate: val.assumptionDate,
      expectedRetirementDate: val.expectedRetirementDate,
      onLeaveWithoutPay: val.onLeaveWithoutPay,
      previousSeniorStaffDate: val.previousSeniorStaffDate,
      previousExperiences: val.previousExperiences ?? [],
      documents: documents ?? undefined,
      children: val.children,
      numberOfDependents: val.children ? val.children.length : val.numberOfDependents,
      spouseName: val.spouseName,
      spouseEmployedInOAU: val.spouseEmployedInOAU,
      spouseDepartment: val.spouseDepartment,
      spouseEmploymentAddress: val.spouseEmploymentAddress,
    });

    // Update user record state to completed
    const user = mockDB.findUserById(session.user.id) || (session.user.email ? mockDB.findUserByEmail(session.user.email) : undefined);
    if (user) {
      user.profileCompleted = true;
      if (val.phoneNumber) user.phoneNumber = val.phoneNumber;
      user.updatedAt = new Date().toISOString();
    }

    // Record Audit Log
    mockDB.writeAuditLog({
      actorId: session.user.id,
      action: 'STAFF_ONBOARDING_COMPLETED',
      entityType: 'User',
      entityId: session.user.id,
      status: 'SUCCESS',
      metadata: {
        staffId: val.staffId,
        department: val.department,
        rank: val.rank,
      },
    });

    revalidatePath('/onboarding');
    revalidatePath('/dashboard');
    revalidatePath('/staff');
    revalidatePath('/staff/profile');

    const redirectUrl = session.user.role === 'STAFF' ? '/staff' : '/dashboard';
    return { success: true, redirectUrl };
  } catch (error) {
    console.error('Error completing staff onboarding:', error);
    return { success: false, error: 'An error occurred while saving your onboarding details. Please try again.' };
  }
}

export async function submitProfileForm(data: unknown) {
  return completeStaffOnboarding(data);
}

export async function updateDependantsInfo(data: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Access denied.' };
  }

  const parsed = (await import('@/lib/validations/profile')).dependantsInfoSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed. Please review the highlighted fields.',
      details: parsed.error.format(),
    };
  }

  try {
    const val = parsed.data;

    await updateStaffProfile(session.user.id, {
      spouseName: val.spouseName,
      spouseEmployedInOAU: val.spouseEmployedInOAU,
      spouseDepartment: val.spouseDepartment,
      spouseEmploymentAddress: val.spouseEmploymentAddress,
      children: val.children,
      numberOfDependents: val.children ? val.children.length : val.numberOfDependents,
    });

    mockDB.writeAuditLog({
      actorId: session.user.id,
      action: 'DEPENDANTS_INFO_UPDATED',
      entityType: 'User',
      entityId: session.user.id,
      status: 'SUCCESS',
      metadata: {
        childrenCount: val.children?.length ?? 0,
        spouseName: val.spouseName,
      },
    });

    revalidatePath('/staff/profile');
    return { success: true };
  } catch (error) {
    console.error('Error updating dependants info:', error);
    return { success: false, error: 'An error occurred while saving dependants information.' };
  }
}

