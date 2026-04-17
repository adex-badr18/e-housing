import { mockDB, User } from './db';

/**
 * Simulates authentication against the mock DB.
 * In a real implementation this might call an external service or check passwords.
 * Since we are mocking, we just check if the email exists in our DB, and optionally
 * check domain requirements.
 */
export async function authenticateMockUser(email: string): Promise<User | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Enforce @oauife.edu.ng for STAFF optionally, but right now we just match exact emails in DB
  const user = mockDB.findUserByEmail(email);
  if (!user || !user.isActive) {
    return null;
  }
  
  return user;
}
