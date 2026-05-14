'use server';

import { auth } from '@/lib/auth';
import { updateStaffProfile } from '@/lib/mock-api/endpoints/profile';
import { staffProfileSchema } from '@/lib/validations/profile';
import { revalidatePath } from 'next/cache';

export async function submitProfileForm(data: any) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  if (session.user.role !== 'STAFF') {
    return { success: false, error: 'Access denied' };
  }

  const parsed = staffProfileSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Validation failed', details: parsed.error.format() };
  }

  try {
    await updateStaffProfile(session.user.id, parsed.data);
    revalidatePath('/staff/profile');
    revalidatePath('/staff');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update profile' };
  }
}
